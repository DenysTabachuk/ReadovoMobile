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

import { useBanner } from '@/components/banner';
import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { getAchievementsProfile } from '@/features/achievements';
import {
  buyMascotItem,
  clearMascotSlot,
  equipMascotItem,
  getMascotCatalogItem,
  getMascotItemsBySlot,
  getMascotProfile,
  Mascot,
  mascotAccessorySlots,
  type MascotAccessorySlot,
  type MascotCatalogItem,
} from '@/features/mascot';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

export default function WardrobeScreen() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [selectedSlot, setSelectedSlot] = useState<MascotAccessorySlot>('head');
  const [purchaseItem, setPurchaseItem] = useState<MascotCatalogItem | null>(null);
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
  const equippedSlots = mascotAccessorySlots.filter((slot) => equippedItems[slot]);
  const canConfirmPurchase = purchaseItem ? balance >= purchaseItem.price : false;

  const invalidateMascotState = () => {
    if (!userId) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['mascot-profile', userId] });
    void queryClient.invalidateQueries({ queryKey: ['achievements-profile', userId] });
  };

  const buyMutation = useMutation({
    mutationFn: (itemId: string) => buyMascotItem(userId ?? '', itemId),
    onError: (error) => {
      const messageKey =
        error instanceof Error ? error.message : 'mascot.errors.buyFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('mascot.errors.buyFailed'),
        }),
        variant: 'error',
      });
    },
    onSuccess: (_, itemId) => {
      const item = getMascotCatalogItem(itemId);

      setPurchaseItem(null);
      invalidateMascotState();
      showBanner({
        description: item
          ? t('mascot.purchaseSuccessDescription', {
              itemName: t(item.labelKey),
              price: item.price,
            })
          : undefined,
        title: t('mascot.purchaseSuccessTitle'),
        variant: 'success',
      });
    },
  });
  const equipMutation = useMutation({
    mutationFn: (itemId: string) => equipMascotItem(userId ?? '', itemId),
    onSuccess: invalidateMascotState,
  });
  const clearMutation = useMutation({
    mutationFn: (slot: MascotAccessorySlot) => clearMascotSlot(userId ?? '', slot),
    onSuccess: invalidateMascotState,
    onError: (error) => {
      const messageKey =
        error instanceof Error ? error.message : 'mascot.errors.clearFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('mascot.errors.clearFailed'),
        }),
        variant: 'error',
      });
    },
  });
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      for (const slot of equippedSlots) {
        await clearMascotSlot(userId ?? '', slot);
      }
    },
    onSuccess: invalidateMascotState,
    onError: (error) => {
      const messageKey =
        error instanceof Error ? error.message : 'mascot.errors.clearFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('mascot.errors.clearFailed'),
        }),
        variant: 'error',
      });
    },
  });

  const handleRefresh = () => {
    void mascotQuery.refetch();
    void achievementsQuery.refetch();
  };

  const handleItemAction = (item: MascotCatalogItem) => {
    const isOwned = ownedItemIds.includes(item.id);

    if (!isOwned) {
      setPurchaseItem(item);
      return;
    }

    equipMutation.mutate(item.id);
  };

  const handleConfirmPurchase = () => {
    if (!purchaseItem || !canConfirmPurchase) {
      return;
    }

    buyMutation.mutate(purchaseItem.id);
  };

  const renderItem: ListRenderItem<MascotCatalogItem> = ({ item }) => {
    const isOwned = ownedItemIds.includes(item.id);
    const isEquipped = equippedItems[item.slot] === item.id;
    const isPending = buyMutation.isPending || equipMutation.isPending;
    const actionLabel = getItemActionLabel({
      isEquipped,
      isOwned,
      t,
    });

    return (
      <View style={[styles.itemCard, isEquipped ? styles.selectedCard : null]}>
        <Image contentFit="contain" source={item.asset} style={styles.itemImage} />
        <View style={styles.itemMeta}>
          <ThemedText style={styles.itemTitle}>{t(item.labelKey)}</ThemedText>
          {isOwned ? (
            <ThemedText style={styles.ownedLabel}>
              {t('mascot.owned')}
            </ThemedText>
          ) : (
            <View style={styles.itemPriceRow}>
              <Image
                contentFit="contain"
                source={require('../../../../assets/images/money.png')}
                style={styles.balanceIcon}
              />
              <ThemedText>
                {item.price}
              </ThemedText>
            </View>
          )}
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
          <ThemedText>{t('mascot.loading')}</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (mascotQuery.error) {
    return (
      <ScreenContainer>
        <View style={styles.previewBlock}>
          <ThemedText type="screenTitle">
            {t('mascot.errorTitle')}
          </ThemedText>
          <Button onPress={() => mascotQuery.refetch()}>
            {t('dictionary.retry')}
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
          <ThemedText>
            {t('mascot.emptySlot')}
          </ThemedText>
        }
        ListFooterComponent={
          equippedSlots.length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.footerActions}>
                {equippedItems[selectedSlot] ? (
                  <Button
                    disabled={clearMutation.isPending || clearAllMutation.isPending}
                    onPress={() => clearMutation.mutate(selectedSlot)}
                    style={styles.footerButton}
                    variant="secondary">
                    {t('mascot.clearSlot')}
                  </Button>
                ) : null}
                <Button
                  disabled={clearMutation.isPending || clearAllMutation.isPending}
                  onPress={() => clearAllMutation.mutate()}
                  style={styles.footerButton}
                  variant="secondary">
                  {t('mascot.clearAll')}
                </Button>
              </View>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              {t('mascot.title')}
            </ThemedText>
            <View style={styles.previewBlock}>
              <View style={styles.walletRow}>
                <View style={styles.walletItem}>
                  <Image
                    contentFit="contain"
                    source={require('../../../../assets/images/money.png')}
                    style={styles.walletIcon}
                  />
                  <ThemedText style={styles.walletText}>
                    {t('profile.balance')}: {balance}
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
      <ModalSheet
        modalProps={{ presentationStyle: 'overFullScreen' }}
        onClose={() => setPurchaseItem(null)}
        open={Boolean(purchaseItem)}
        title={t('mascot.purchaseConfirmTitle')}>
        {purchaseItem ? (
          <View style={styles.purchaseModalContent}>
            <Image
              contentFit="contain"
              source={purchaseItem.asset}
              style={styles.purchaseModalImage}
            />
            <ThemedText style={styles.purchaseModalDescription}>
              {t('mascot.purchaseConfirmDescription', {
                itemName: t(purchaseItem.labelKey),
                price: purchaseItem.price,
              })}
            </ThemedText>
            <View style={styles.purchaseModalPriceRow}>
              <Image
                contentFit="contain"
                source={require('../../../../assets/images/money.png')}
                style={styles.balanceIcon}
              />
              <ThemedText type="bodyStrong">
                {purchaseItem.price}
              </ThemedText>
            </View>
            {!canConfirmPurchase ? (
              <ThemedText style={styles.purchaseModalError}>
                {t('mascot.errors.notEnoughCoins')}
              </ThemedText>
            ) : null}
            <View style={styles.purchaseModalActions}>
              <Button
                disabled={buyMutation.isPending}
                onPress={() => setPurchaseItem(null)}
                style={styles.purchaseModalButton}
                variant="secondary">
                {t('mascot.cancel')}
              </Button>
              <Button
                disabled={!canConfirmPurchase || buyMutation.isPending}
                onPress={handleConfirmPurchase}
                style={styles.purchaseModalButton}>
                {buyMutation.isPending ? t('mascot.buying') : t('mascot.confirmBuy')}
              </Button>
            </View>
          </View>
        ) : null}
      </ModalSheet>
    </ScreenContainer>
  );
}

function getSlotLabel(
  slot: MascotAccessorySlot,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const labels: Record<MascotAccessorySlot, string> = {
    eyes: t('mascot.slots.eyes'),
    head: t('mascot.slots.head'),
  };

  return labels[slot];
}

function getItemActionLabel({
  isEquipped,
  isOwned,
  t,
}: {
  isEquipped: boolean;
  isOwned: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}): string {
  if (isEquipped) {
    return t('mascot.equipped');
  }

  if (isOwned) {
    return t('mascot.equip');
  }

  return t('mascot.buy');
}
