import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cancelListing, fetchMyListing, fetchOrders } from "@/api/seller";
import { color, formatMoney, formatPrice, formatQuantity, formatWindow, savePercent } from "./design";
import { Icon } from "./Icon";
import {
  Btn,
  ConfirmDialog,
  EmptyState,
  errorMessage,
  Field,
  FoodImage,
  FormError,
  IconButton,
  InfoIcon,
  ListingBadge,
  LoadError,
  OrderBadge,
  Page,
  SkeletonCards,
  Surface,
  TopBar,
  useFocusData,
} from "./kit";

const AUDIENCE_LABELS = { EVERYONE: "Everyone", CUSTOMERS_ONLY: "Customers only", BUSINESSES_ONLY: "Businesses only" } as const;

export function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const load = useCallback(async () => {
    const [listing, orders] = await Promise.all([fetchMyListing(id), fetchOrders("ALL", id)]);
    return { listing, orders };
  }, [id]);
  const { data, setData, error, retry } = useFocusData(load);

  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!data) {
    return (
      <Page>
        <TopBar title="Listing" />
        {error ? <LoadError message={error} onRetry={retry} /> : <SkeletonCards count={2} />}
      </Page>
    );
  }

  const { listing, orders } = data;
  const save = savePercent(listing.originalPrice, listing.price);
  const editable = listing.status === "ACTIVE" || listing.status === "SOLD_OUT";
  const primary = listing.images.find((i) => i.isPrimary) ?? listing.images[0];

  async function doCancel() {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await cancelListing(listing.id, { reason: reason.trim() || undefined });
      setData({ listing: updated, orders: await fetchOrders("ALL", id) });
      setConfirming(false);
    } catch (err) {
      setConfirming(false);
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <FoodImage uri={primary?.imageUrl} style={styles.heroImage} />
          <View style={[styles.heroActions, { top: insets.top + 12 }]}>
            <IconButton icon="back" label="Go back" onPress={() => router.back()} style={styles.heroBtn} />
            {editable ? <IconButton icon="edit" label="Edit listing" onPress={() => router.push(`/sell/${listing.id}/edit`)} style={styles.heroBtn} /> : null}
          </View>
          <Text style={styles.pickupOnly}>PICKUP ONLY</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.providerRow}>
            <Text style={styles.category}>{listing.category.name}</Text>
            <ListingBadge status={listing.status} />
          </View>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            {save > 0 ? (
              <>
                <Text style={styles.oldPrice}>{formatMoney(listing.originalPrice)}</Text>
                <Text style={styles.saveText}>Save {save}%</Text>
              </>
            ) : null}
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <InfoIcon icon="receipt" />
              <Text style={styles.infoSmall}>Available</Text>
              <Text style={styles.infoBold}>{formatQuantity(listing.quantityAvailable, listing.unit)} of {listing.quantityTotal}</Text>
            </View>
            <View style={styles.infoCell}>
              <InfoIcon icon="user" tone="amber" />
              <Text style={styles.infoSmall}>Who can buy</Text>
              <Text style={styles.infoBold}>{AUDIENCE_LABELS[listing.audience]}</Text>
            </View>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineIcon}><Icon name="clock" color={color.warnText} /></View>
            <View style={styles.flex}>
              <Text style={styles.timelineSmall}>PICKUP WINDOW</Text>
              <Text style={styles.timelineTitle}>{formatWindow(listing.pickupStart, listing.pickupEnd)}</Text>
              {listing.pickupNote ? <Text style={styles.timelineNote}>{listing.pickupNote}</Text> : null}
            </View>
          </View>

          {listing.description ? (
            <View style={styles.description}>
              <Text style={styles.sectionHead}>About this food</Text>
              <Text style={styles.descriptionText}>{listing.description}</Text>
            </View>
          ) : null}

          <Text style={[styles.sectionHead, styles.ordersHead]}>Reservations</Text>
          {orders.length === 0 ? (
            <EmptyState icon="receipt" title="No reservations yet" text="Reservations for this food will appear here." />
          ) : (
            <View style={styles.orders}>
              {orders.map((o) => (
                <Surface key={o.id} style={styles.orderRow}>
                  <View style={styles.flex}>
                    <Text style={styles.orderBuyer} numberOfLines={1}>{o.buyer.fullName}</Text>
                    <Text style={styles.orderMeta}>{formatQuantity(o.quantity, listing.unit)} · {formatPrice(o.totalPrice)}</Text>
                  </View>
                  <OrderBadge status={o.status} />
                </Surface>
              ))}
            </View>
          )}

          <FormError>{actionError}</FormError>
          {editable ? (
            <View style={styles.actions}>
              <Btn title="Edit listing" icon="edit" variant="secondary" onPress={() => router.push(`/sell/${listing.id}/edit`)} />
              <Btn title="Cancel listing" icon="close" variant="ghost" onPress={() => setConfirming(true)} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        title="Cancel this listing?"
        message={
          listing.reservations.active > 0
            ? `${listing.reservations.active === 1 ? "1 reservation" : `${listing.reservations.active} reservations`} will also be cancelled, and the buyers will be notified. This cannot be undone.`
            : "Buyers will no longer see this food. This cannot be undone."
        }
        confirmLabel="Cancel listing"
        cancelLabel="Keep it"
        busy={busy}
        onConfirm={() => void doCancel()}
        onClose={() => setConfirming(false)}
      >
        <Field label="Reason" optional placeholder="e.g. Food finished early" value={reason} onChangeText={setReason} />
      </ConfirmDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.page },
  scroll: { paddingBottom: 32 },
  hero: { height: 280 },
  heroImage: { width: "100%", height: "100%", borderRadius: 0 },
  heroActions: { position: "absolute", left: 18, right: 18, flexDirection: "row", justifyContent: "space-between" },
  heroBtn: { backgroundColor: "rgba(255,255,255,0.93)" },
  pickupOnly: { position: "absolute", bottom: 30, left: 18, backgroundColor: color.primaryDark, color: "#fff", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, overflow: "hidden", fontSize: 10, fontWeight: "800", letterSpacing: 0.9 },
  content: { backgroundColor: color.page, borderTopLeftRadius: 27, borderTopRightRadius: 27, marginTop: -18, paddingHorizontal: 20, paddingTop: 22 },
  providerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  category: { flex: 1, fontSize: 13, color: color.muted },
  title: { fontSize: 27, fontWeight: "700", letterSpacing: -0.6, color: color.text, marginTop: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 13, marginBottom: 20 },
  price: { fontSize: 25, fontWeight: "800", color: color.primary },
  oldPrice: { fontSize: 13, color: color.muted2, textDecorationLine: "line-through" },
  saveText: { fontSize: 11, fontWeight: "700", color: color.primary, backgroundColor: color.tint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  infoGrid: { flexDirection: "row", gap: 10 },
  infoCell: { flex: 1, padding: 13, borderRadius: 15, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, gap: 4 },
  infoSmall: { fontSize: 12, color: color.muted, marginTop: 4 },
  infoBold: { fontSize: 13, fontWeight: "700", color: color.text },
  timeline: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 17, backgroundColor: color.amberSoft, marginTop: 12 },
  timelineIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: color.amberTint, alignItems: "center", justifyContent: "center" },
  timelineSmall: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, color: color.warnText },
  timelineTitle: { fontSize: 15, fontWeight: "700", color: color.text, marginTop: 3 },
  timelineNote: { fontSize: 12, color: "#8F6A2A", marginTop: 4 },
  description: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: color.line },
  sectionHead: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3, color: color.text },
  descriptionText: { marginTop: 8, fontSize: 14, lineHeight: 21, color: color.muted },
  ordersHead: { marginTop: 22, marginBottom: 12 },
  orders: { gap: 9 },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, shadowOpacity: 0, elevation: 0 },
  orderBuyer: { fontSize: 14, fontWeight: "700", color: color.text },
  orderMeta: { fontSize: 12, color: color.muted, marginTop: 3 },
  actions: { gap: 8, marginTop: 22 },
});
