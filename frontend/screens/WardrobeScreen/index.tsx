import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { Mascot } from '@/components/mascot';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { getAchievementsProfile } from '@/features/achievements';
import {
  buyMascotItem,
  clearMascotSlot,
  equipMascotItem,
  getMascotItemsBySlot,
  getMascotProfile,
  mascotAccessorySlots,
  type MascotAccessorySlot,
  type MascotCatalogItem,
} from '@/features/mascot';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

export default function WardrobeScreen() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [selectedSlot, setSelectedSlot] = useState<MascotAccessorySlot>('head');
  const userId = currentUser?.id;

  const mascotQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => getMascotProfile(userId ?? ''),
    queryKey: ['mascot-profile', userId],
  });
  const achievementsQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => getAchievementsProfile(userId ?? ''),
    queryKey: ['achievements-profile', userId],
  });

  const selectedItems = useMemo(
    () => getMascotItemsBySlot(selectedSlot),
    [selectedSlot],
  );
  const equippedItems = mascotQuery.data?.equippedItems ?? {};
  const ownedItemIds = mascotQuery.data?.ownedItemIds ?? [];
  const balance = achievementsQuery.data?.progress.balance ?? 0;
  const isRefreshing = mascotQuery.isFetching || achievementsQuery.isFetching;

  const invalidateMascotState = () => {
    if (!userId) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['mascot-profile', userId] });
    void queryClient.invalidateQueries({ queryKey: ['achievements-profile', userId] });
  };

  const buyMutation = useMutation({
    mutationFn: (itemId: string) => buyMascotItem(userId ?? '', itemId),
    onSuccess: invalidateMascotState,
  });
  const equipMutation = useMutation({
    mutationFn: (itemId: string) => equipMascotItem(userId ?? '', itemId),
    onSuccess: invalidateMascotState,
  });
  const clearMutation = useMutation({
    mutationFn: (slot: MascotAccessorySlot) => clearMascotSlot(userId ?? '', slot),
    onSuccess: invalidateMascotState,
  });

  const handleRefresh = () => {
    void mascotQuery.refetch();
    void achievementsQuery.refetch();
  };

  const handleItemAction = (item: MascotCatalogItem) => {
    const isOwned = ownedItemIds.includes(item.id);

    if (!isOwned && item.price > 0) {
      buyMutation.mutate(item.id);
      return;
    }

    equipMutation.mutate(item.id);
  };

  const renderItem: ListRenderItem<MascotCatalogItem> = ({ item }) => {
    const isOwned = ownedItemIds.includes(item.id) || item.price === 0;
    const isEquipped = equippedItems[item.slot] === item.id;
    const isPending = buyMutation.isPending || equipMutation.isPending;
    const actionLabel = getItemActionLabel({
      isEquipped,
      isOwned,
      price: item.price,
      t,
    });

    return (
      <View style={[styles.itemCard, isEquipped ? styles.selectedCard : null]}>
        <Image contentFit="contain" source={item.asset} style={styles.itemImage} />
        <View style={styles.itemMeta}>
          <ThemedText style={styles.itemTitle}>{item.label}</ThemedText>
          <View style={styles.itemPriceRow}>
            <Image
              contentFit="contain"
              source={require('../../assets/images/money.png')}
              style={styles.balanceIcon}
            />
            <ThemedText>
              {item.price === 0
                ? t('mascot.free', { defaultValue: 'Free' })
                : item.price}
            </ThemedText>
          </View>
        </View>
        <Pressable
          disabled={isPending || isEquipped}
          onPress={() => handleItemAction(item)}
          style={[
            styles.itemAction,
            isPending || isEquipped ? styles.itemActionDisabled : null,
          ]}>
          <ThemedText style={styles.actionText}>{actionLabel}</ThemedText>
        </Pressable>
      </View>
    );
  };

  if (mascotQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.previewBlock}>
          <ActivityIndicator color={palette.tint} size="large" />
          <ThemedText>{t('mascot.loading', { defaultValue: 'Loading wardrobe...' })}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (mascotQuery.error) {
    return (
      <ScreenContainer>
        <View style={styles.previewBlock}>
          <ThemedText type="screenTitle">
            {t('mascot.errorTitle', { defaultValue: 'Wardrobe is unavailable' })}
          </ThemedText>
          <Button onPress={() => mascotQuery.refetch()}>
            {t('dictionary.retry', { defaultValue: 'Try again' })}
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={selectedItems}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            {t('mascot.emptySlot', {
              defaultValue: 'No items in this category yet.',
            })}
          </ThemedText>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              {t('mascot.title', { defaultValue: 'Mascot wardrobe' })}
            </ThemedText>
            <View style={styles.previewBlock}>
              <View style={styles.walletRow}>
                <View style={styles.walletItem}>
                  <Image
                    contentFit="contain"
                    source={require('../../assets/images/money.png')}
                    style={styles.walletIcon}
                  />
                  <ThemedText style={styles.walletText}>
                    {t('profile.balance', { defaultValue: 'My balance' })}: {balance}
                  </ThemedText>
                </View>
              </View>
              <Mascot equippedItems={equippedItems} style={styles.previewMascot} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.slotRow}>
              {mascotAccessorySlots.map((slot) => {
                const isActive = slot === selectedSlot;

                return (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.slotTab, isActive ? styles.slotTabActive : null]}>
                    <ThemedText
                      style={[
                        styles.slotTabText,
                        isActive ? styles.slotTabTextActive : null,
                      ]}>
                      {getSlotLabel(slot, t)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
            {equippedItems[selectedSlot] ? (
              <Pressable
                disabled={clearMutation.isPending}
                onPress={() => clearMutation.mutate(selectedSlot)}
                style={styles.clearButton}>
                <ThemedText style={styles.clearButtonText}>
                  {t('mascot.clearSlot', { defaultValue: 'Remove item' })}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        }
        numColumns={2}
        refreshControl={
          <RefreshControl
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={palette.tint}
          />
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function getSlotLabel(
  slot: MascotAccessorySlot,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const labels: Record<MascotAccessorySlot, string> = {
    eyes: t('mascot.slots.eyes', { defaultValue: 'Eyes' }),
    head: t('mascot.slots.head', { defaultValue: 'Head' }),
  };

  return labels[slot];
}

function getItemActionLabel({
  isEquipped,
  isOwned,
  price,
  t,
}: {
  isEquipped: boolean;
  isOwned: boolean;
  price: number;
  t: ReturnType<typeof useTranslation>['t'];
}): string {
  if (isEquipped) {
    return t('mascot.equipped', { defaultValue: 'Equipped' });
  }

  if (isOwned || price === 0) {
    return t('mascot.equip', { defaultValue: 'Equip' });
  }

  return t('mascot.buy', { defaultValue: 'Buy' });
}
