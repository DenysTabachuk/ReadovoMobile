import { getMascotErrorMessageKey } from '@/features/mascot';
import { Image } from 'expo-image';
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
import { useAchievementsProfileQuery } from '@/features/achievements';
import {
  getMascotCatalogItem,
  getMascotItemsBySlot,
  useMascotProfileQuery,
  useBuyMascotMutation,
  useEquipMascotMutation,
  useClearMascotMutation,
  useClearAllMascotSlotsMutation,
  Mascot,
  mascotAccessorySlots,
  type MascotAccessorySlot,
  type MascotCatalogItem,
} from '@/features/mascot';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

export default function WardrobeScreen() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [selectedSlot, setSelectedSlot] = useState<MascotAccessorySlot>('head');
  const [purchaseItem, setPurchaseItem] = useState<MascotCatalogItem | null>(
    null,
  );

  const mascotQuery = useMascotProfileQuery();
  const achievementsQuery = useAchievementsProfileQuery();

  const selectedItems = useMemo(
    () => getMascotItemsBySlot(selectedSlot),
    [selectedSlot],
  );
  const equippedItems = mascotQuery.data?.equippedItems ?? {};
  const ownedItemIds = mascotQuery.data?.ownedItemIds ?? [];
  const balance = achievementsQuery.data?.progress.balance ?? 0;
  const isRefreshing = mascotQuery.isFetching || achievementsQuery.isFetching;
  const equippedSlots = mascotAccessorySlots.filter(
    (slot) => equippedItems[slot],
  );
  const canConfirmPurchase = purchaseItem
    ? balance >= purchaseItem.price
    : false;

  const buyMutation = useBuyMascotMutation({
    onError: (error) => {
      const messageKey = getMascotErrorMessageKey(error);
      if (!messageKey) return;

      showBanner({
        title: t(messageKey),
        variant: 'error',
      });
    },
    onSuccess: (_, itemId) => {
      const item = getMascotCatalogItem(itemId);

      setPurchaseItem(null);
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
  const equipMutation = useEquipMascotMutation({
    onError: (error) => {
      const messageKey = getMascotErrorMessageKey(error);
      if (!messageKey) return;
      showBanner({ title: t(messageKey), variant: 'error' });
    },
  });
  const clearMutation = useClearMascotMutation({
    onError: (error) => {
      const messageKey = getMascotErrorMessageKey(error);
      if (!messageKey) return;

      showBanner({
        title: t(messageKey),
        variant: 'error',
      });
    },
  });
  const clearAllMutation = useClearAllMascotSlotsMutation({
    slots: equippedSlots,
    onError: (error) => {
      const messageKey = getMascotErrorMessageKey(error);
      if (!messageKey) return;

      showBanner({
        title: t(messageKey),
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
        <Image
          contentFit="contain"
          source={item.asset}
          style={styles.itemImage}
        />
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
              <ThemedText>{item.price}</ThemedText>
            </View>
          )}
        </View>
        <Pressable
          disabled={isPending || isEquipped}
          onPress={() => handleItemAction(item)}
          style={[
            styles.itemAction,
            isPending || isEquipped ? styles.itemActionDisabled : null,
          ]}
        >
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

  const loadError = mascotQuery.error ?? achievementsQuery.error;
  const loadErrorMessageKey = loadError
    ? getMascotErrorMessageKey(loadError)
    : null;
  if (loadErrorMessageKey) {
    return (
      <ScreenContainer>
        <View style={styles.previewBlock}>
          <ThemedText type="screenTitle">{t('mascot.errorTitle')}</ThemedText>
          <ThemedText>{t(loadErrorMessageKey)}</ThemedText>
          <Button onPress={handleRefresh}>{t('dictionary.retry')}</Button>
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
        ListEmptyComponent={<ThemedText>{t('mascot.emptySlot')}</ThemedText>}
        ListFooterComponent={
          equippedSlots.length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.footerActions}>
                {equippedItems[selectedSlot] ? (
                  <Button
                    disabled={
                      clearMutation.isPending || clearAllMutation.isPending
                    }
                    onPress={() => clearMutation.mutate(selectedSlot)}
                    style={styles.footerButton}
                    variant="secondary"
                  >
                    {t('mascot.clearSlot')}
                  </Button>
                ) : null}
                <Button
                  disabled={
                    clearMutation.isPending || clearAllMutation.isPending
                  }
                  onPress={() => clearAllMutation.mutate()}
                  style={styles.footerButton}
                  variant="secondary"
                >
                  {t('mascot.clearAll')}
                </Button>
              </View>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>{t('mascot.title')}</ThemedText>
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
              <Mascot
                equippedItems={equippedItems}
                style={styles.previewMascot}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.slotRow}
            >
              {mascotAccessorySlots.map((slot) => {
                const isActive = slot === selectedSlot;

                return (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[
                      styles.slotTab,
                      isActive ? styles.slotTabActive : null,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.slotTabText,
                        isActive ? styles.slotTabTextActive : null,
                      ]}
                    >
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
        title={t('mascot.purchaseConfirmTitle')}
      >
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
              <ThemedText type="bodyStrong">{purchaseItem.price}</ThemedText>
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
                variant="secondary"
              >
                {t('mascot.cancel')}
              </Button>
              <Button
                disabled={!canConfirmPurchase || buyMutation.isPending}
                onPress={handleConfirmPurchase}
                style={styles.purchaseModalButton}
              >
                {buyMutation.isPending
                  ? t('mascot.buying')
                  : t('mascot.confirmBuy')}
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
