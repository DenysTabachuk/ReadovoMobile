import { Image } from 'expo-image';
import { useState } from 'react';
import {
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  getMascotCatalogItem,
  mascotAccessorySlots,
  type MascotEquippedItems,
} from '@/features/mascot';

import { styles } from './styles';

type MascotProps = {
  equippedItems?: MascotEquippedItems;
  style?: StyleProp<ViewStyle>;
};

export function Mascot({ equippedItems = {}, style }: MascotProps) {
  const [stageHeight, setStageHeight] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setStageHeight(event.nativeEvent.layout.height);
  };

  return (
    <View onLayout={handleLayout} style={[styles.stage, style]}>
      <Image
        contentFit="contain"
        source={require('../../assets/mascot/base/octopus.png')}
        style={styles.base}
      />
      {mascotAccessorySlots.map((slot) => {
        const itemId = equippedItems[slot];
        const item = itemId ? getMascotCatalogItem(itemId) : undefined;

        if (!item) {
          return null;
        }

        const translateY =
          stageHeight * (item.placement?.translateYRatio ?? 0);

        const translateX =
          stageHeight * (item.placement?.translateXRatio ?? 0);

        return (
          <View
            key={`${slot}-${item.id}`}
            pointerEvents="none"
            style={[
              styles.accessoryLayer,
              {
                transform: [
                  { translateY },
                  {translateX},
                  { scale: item.placement?.scale ?? 1 },
                ],
              },
            ]}
          >
            <Image
              contentFit="contain"
              source={item.asset}
              style={styles.accessory}
            />
          </View>
        );
      })}
    </View>
  );
}
