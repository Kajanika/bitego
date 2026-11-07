import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ReservationStatus, SellerOrderDto } from "@bitego/shared";
import { fetchOrders } from "@/api/seller";
import { color, formatDay, formatPrice, formatQuantity, formatTime, formatWindow } from "./design";
import { Btn, EmptyState, FoodImage, LoadError, OrderBadge, Page, PageHead, SkeletonCards, Surface, Tabs, useFocusData } from "./kit";

const TABS: { value: ReservationStatus; label: string }[] = [
  { value: "CONFIRMED", label: "Upcoming" },
  { value: "PICKED_UP", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "No-show" },
];

const EMPTY_TEXT: Record<ReservationStatus, { title: string; text: string }> = {
  CONFIRMED: { title: "No upcoming pickups", text: "When someone reserves your food, it will appear here." },
  PICKED_UP: { title: "No completed pickups", text: "Orders you hand over will appear here." },
  CANCELLED: { title: "No cancelled reservations", text: "Cancelled reservations will appear here." },
  EXPIRED: { title: "No no-shows", text: "Reservations not collected before the pickup deadline will appear here." },
};

function OrderCard({ order, onCheck }: { order: SellerOrderDto; onCheck: () => void }) {
  const lastLabel = order.status === "PICKED_UP" ? "Picked up" : "Pickup";
  const lastValue =
    order.status === "PICKED_UP" && order.pickedUpAt
      ? `${formatDay(new Date(order.pickedUpAt))}, ${formatTime(new Date(order.pickedUpAt))}`
      : formatWindow(order.listing.pickupStart, order.listing.pickupEnd);
  return (
    <Surface style={styles.card}>
      <View style={styles.top}>
        <FoodImage uri={order.listing.imageUrl} style={styles.image} />
        <View style={styles.topText}>
          <OrderBadge status={order.status} />
          <Text style={styles.title} numberOfLines={2}>{order.listing.title}</Text>
          <Text style={styles.buyer} numberOfLines={1}>{order.buyer.fullName}{order.buyer.isBusiness ? " · Business buyer" : ""}</Text>
        </View>
      </View>
      <View style={styles.meta}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Quantity</Text>
          <Text style={styles.metaValue}>{formatQuantity(order.quantity, order.listing.unit)}</Text>
        </View>
        <View style={[styles.metaCell, styles.metaDivider]}>
          <Text style={styles.metaLabel}>{order.status === "CONFIRMED" ? "To collect" : "Total"}</Text>
          <Text style={[styles.metaValue, order.totalPrice === 0 && styles.free]}>{formatPrice(order.totalPrice)}</Text>
        </View>
      </View>
      <Text style={styles.metaLabel}>{lastLabel}</Text>
      <Text style={styles.when}>{lastValue}</Text>
      {order.cancelReason ? <Text style={styles.reason}>{order.cancelReason}</Text> : null}
      {order.status === "EXPIRED" ? <Text style={styles.reason}>This reservation was not collected before the pickup deadline.</Text> : null}
      {order.status === "CONFIRMED" ? <Btn title="Check pickup code" onPress={onCheck} style={styles.check} /> : null}
    </Surface>
  );
}

export function OrdersScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<ReservationStatus>("CONFIRMED");
  const load = useCallback(() => fetchOrders(tab), [tab]);
  const { data, error, refreshing, refresh, retry } = useFocusData(load);
  const goVerify = () => router.push("/orders/verify");

  // Hides the previous tab's rows while the new tab loads.
  const orders = data?.filter((o) => o.status === tab);

  return (
    <Page refreshing={refreshing} onRefresh={refresh}>
      <PageHead title="Orders" subtitle="Keep track of every reserved pickup." />
      <Btn title="Check a pickup code" icon="shield" onPress={goVerify} style={styles.verify} />
      <Tabs options={TABS} value={tab} onChange={setTab} />
      {error && !data ? <LoadError message={error} onRetry={retry} /> : null}
      {!error && !data ? <SkeletonCards /> : null}
      {orders && orders.length === 0 ? <EmptyState icon="receipt" {...EMPTY_TEXT[tab]} /> : null}
      <View style={styles.list}>
        {orders?.map((o) => <OrderCard key={o.id} order={o} onCheck={goVerify} />)}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  verify: { marginBottom: 14 },
  list: { gap: 12 },
  card: { padding: 12, borderRadius: 19 },
  top: { flexDirection: "row", gap: 12 },
  image: { width: 92, height: 92, borderRadius: 14 },
  topText: { flex: 1, minWidth: 0, gap: 5, alignItems: "flex-start" },
  title: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3, color: color.text },
  buyer: { fontSize: 13, color: color.muted },
  meta: { flexDirection: "row", marginTop: 13, marginBottom: 11, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line },
  metaCell: { flex: 1, gap: 3 },
  metaDivider: { paddingLeft: 11, borderLeftWidth: 1, borderLeftColor: color.line },
  metaLabel: { fontSize: 12, color: color.muted },
  metaValue: { fontSize: 14, fontWeight: "700", color: color.text },
  free: { color: color.primary },
  when: { fontSize: 14, fontWeight: "700", color: color.text, marginTop: 3 },
  reason: { marginTop: 10, padding: 11, borderRadius: 11, backgroundColor: color.surface2, fontSize: 12, lineHeight: 18, color: color.muted, overflow: "hidden" },
  check: { marginTop: 12 },
});
