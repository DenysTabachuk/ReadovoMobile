import { useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type FrameInfo,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type SpoilerPlaceholderProps = { revealed: boolean };

type Particle = {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  opacity: number;
};

type ParticleLayer = {
  horizontalCycles: number;
  verticalCycles: number;
  phase: number;
  particles: Particle[];
};

type ParticleLayerProps = {
  layer: ParticleLayer;
  cycle: SharedValue<number>;
  reveal: SharedValue<number>;
  styles: ReturnType<typeof createStyles>;
};

const PARTICLES_PER_LAYER = 27;
const DRIFT_PERIOD_MS = 2700;
const MAX_DRIFT_FRAME_MS = 15;
const FADE_PARTICLES_MS = 240;
const TWO_PI = 2 * Math.PI;
const HORIZONTAL_DRIFT = 5;
const VERTICAL_DRIFT = 4;
const layers: ParticleLayer[] = [
  { horizontalCycles: 4, verticalCycles: 7, phase: 0.4 },
  { horizontalCycles: 7, verticalCycles: 4, phase: 1.8 },
  { horizontalCycles: 5, verticalCycles: 6, phase: 2.6 },
  { horizontalCycles: 6, verticalCycles: 3, phase: 0.9 },
  { horizontalCycles: 7, verticalCycles: 5, phase: 4.9 },
  { horizontalCycles: 3, verticalCycles: 7, phase: 3.6 },
  { horizontalCycles: 5, verticalCycles: 4, phase: 1.2 },
  { horizontalCycles: 6, verticalCycles: 5, phase: 5.7 },
].map((motion, layerIndex) => ({
  ...motion,
  particles: Array.from(
    { length: PARTICLES_PER_LAYER },
    (_, index): Particle => ({
      left: `${2 + ((index * 37 + layerIndex * 13) % 97)}%`,
      top: `${8 + ((index * 29 + layerIndex * 41) % 84)}%`,
      size: [1.2, 1.5, 1.9][(index + layerIndex) % 3],
      opacity: [0.45, 0.7, 1][(index + layerIndex * 2) % 3],
    }),
  ),
}));

function MovingParticles({ layer, cycle, reveal, styles }: ParticleLayerProps) {
  const { horizontalCycles, verticalCycles, phase, particles } = layer;
  const motionStyle = useAnimatedStyle(() => {
    const orbit = cycle.value * TWO_PI;
    const revealTurn = reveal.value * Math.PI;
    const horizontalPhase = orbit * horizontalCycles + phase + revealTurn;
    const verticalPhase = orbit * verticalCycles - phase - revealTurn;

    return {
      opacity: 0.82 + 0.18 * Math.cos(horizontalPhase + verticalPhase),
      transform: [
        { translateX: Math.sin(horizontalPhase) * HORIZONTAL_DRIFT },
        { translateY: Math.cos(verticalPhase) * VERTICAL_DRIFT },
      ],
    };
  });

  return (
    <Animated.View style={[styles.layer, motionStyle]}>
      {particles.map(({ left, top, size, opacity }) => (
        <View
          key={left}
          style={[
            styles.particle,
            { left, top, width: size, height: size, opacity },
          ]}
        />
      ))}
    </Animated.View>
  );
}

export function SpoilerPlaceholder({ revealed }: SpoilerPlaceholderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reducedMotion = useReducedMotion();
  const cycle = useSharedValue(0);
  const reveal = useSharedValue(revealed ? 1 : 0);
  const advanceDrift = useCallback(
    ({ timeSincePreviousFrame }: FrameInfo) => {
      'worklet';
      if (timeSincePreviousFrame === null) return;
      // Cap unusually long gaps so a resumed frame continues near the last position.
      const elapsed = Math.min(timeSincePreviousFrame, MAX_DRIFT_FRAME_MS);
      cycle.value += elapsed / DRIFT_PERIOD_MS;
    },
    [cycle],
  );
  const drift = useFrameCallback(advanceDrift, false);

  useEffect(() => {
    drift.setActive(!revealed && !reducedMotion);
    return () => drift.setActive(false);
  }, [drift, reducedMotion, revealed]);

  useEffect(() => {
    if (revealed) {
      reveal.value = withTiming(1, {
        duration: FADE_PARTICLES_MS,
        easing: Easing.out(Easing.quad),
        reduceMotion: ReduceMotion.System,
      });
      return () => cancelAnimation(reveal);
    }

    reveal.value = 0;
  }, [reveal, revealed]);

  const fieldStyle = useAnimatedStyle(() => ({ opacity: 1 - reveal.value }));

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.field, fieldStyle]}
    >
      {layers.map((layer) => (
        <MovingParticles
          key={layer.phase}
          layer={layer}
          cycle={cycle}
          reveal={reveal}
          styles={styles}
        />
      ))}
    </Animated.View>
  );
}
