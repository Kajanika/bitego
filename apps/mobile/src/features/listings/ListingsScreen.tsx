import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SellerListingDto } from "@bitego/shared";
import { fetchMyListings } from "@/api/seller";
import { useAuth } from "@/features/auth/AuthProvider";
import { color, formatPrice, formatQuantity, formatWindow, savePercent } from "./design";
import { Icon } from "./Icon";
import { Btn, EmptyState, FoodImage, ListingBadge, LoadError, Page, SkeletonCards, Surface, Tabs, useFocusData } from "./kit";

type Tab = "live" | "ended" | "cancelled";

const TABS: { value: Tab; label: string }[] = [
  { value: "live", label: "Active" },
  { value: "ended", label: "Ended" },
  { value: "cancelled", label: "Cancelled" },
];

function inTab(listing: SellerListingDto, tab: Tab) {
  if (tab === "live") return listing.status === "ACTIVE" || listing.status === "SOLD_OUT";
  if (tab === "ended") return listing.status === "COMPLETED" || listing.status === "EXPIRED";
  return listing.status === "CANCELLED";
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
}

const EMPTY_TEXT: Record<Tab, { title: string; text: string }> = {
  live: { title: "No active listings", text: "Post your surplus food so nearby people can reserve it before closing time." },
  ended: { title: "No ended listings", text: "Sold and expired listings will appear here." },
  cancelled: { title: "No cancelled listings", text: "Listings you cancel will appear here." },
};

function ListingCard({ listing, onPress }: { listing: SellerListingDto; onPress: () => void }) {
  const save = savePercent(listing.originalPrice, listing.price);
  const primary = listing.images.find((i) => i.isPrimary) ?? listing.images[0];
  return (
    <Surface style={styles.card} onPress={onPress}>
      <FoodImage uri={primary?.imageUrl} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <ListingBadge status={listing.status} />
        <Text style={styles.cardTitle} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{listing.category.name}</Text>
        <View style={styles.priceLine}>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          {save > 0 ? <Text style={styles.savePill}>Save {save}%</Text> : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaPill}>{formatQuantity(listing.quantityAvailable, listing.unit)} left</Text>
          {listing.reservations.active > 0 ? <Text style={styles.metaPill}>{listing.reservations.active} reserved</Text> : null}
        </View>
        <View style={styles.timeRow}>
          <Icon name="clock" size={14} color={color.primary} />
          <Text style={styles.timeText} numberOfLines={1}>{formatWindow(listing.pickupStart, listing.pickupEnd)}</Text>
        </View>
      </View>
    </Surface>
  );
}

export function ListingsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("live");
  const { data, error, refreshing, refresh, retry } = useFocusData(fetchMyListings);

  const shown = useMemo(() => (data ?? []).filter((l) => inTab(l, tab)), [data, tab]);
  const live = useMemo(() => (data ?? []).filter((l) => inTab(l, "live")), [data]);
  const reserved = live.reduce((sum, l) => sum + l.reservations.active, 0);
  const goNew = () => router.push("/sell/new");

  return (
    <Page refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.shopName} numberOfLines={1}>{profile?.business?.name ?? "My shop"}</Text>
        </View>
        <Btn title="Post food" icon="plus" onPress={goNew} style={styles.postBtn} />
      </View>

      <View style={styles.impact}>
        <View style={styles.impactIcon}><Icon name="leaf" size={20} color="#fff" /></View>
        <View style={styles.impactText}>
          <Text style={styles.impactTitle}>Nearby pickup, less waste</Text>
          <Text style={styles.impactSub}>{live.length === 1 ? "1 active listing" : `${live.length} active listings`}</Text>
        </View>
        <View>
          <Text style={styles.impactNumber}>{reserved}</Text>
          <Text style={styles.impactSmall}>reserved</Text>
        </View>
      </View>

      <Tabs options={TABS} value={tab} onChange={setTab} />

      {error && !data ? <LoadError message={error} onRetry={retry} /> : null}
      {!error && !data ? <SkeletonCards /> : null}
      {data && shown.length === 0 ? (
        <EmptyState
          icon="utensils"
          title={EMPTY_TEXT[tab].title}
          text={EMPTY_TEXT[tab].text}
          action={tab === "live" ? <Btn title="Post surplus food" icon="plus" onPress={goNew} style={styles.emptyBtn} /> : undefined}
        />
      ) : null}
      <View style={styles.list}>
        {shown.map((l) => <ListingCard key={l.id} listing={l} onPress={() => router.push(`/sell/${l.id}`)} />)}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8, paddingBottom: 18 },
  headText: { flex: 1 },
  greeting: { fontSize: 13, color: color.muted, marginBottom: 3 },
  shopName: { fontSize: 27, fontWeight: "700", color: color.text, letterSpacing: -0.6 },
  postBtn: { paddingHorizontal: 14 },
  impact: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: color.primaryDark, marginBottom: 18 },
  impactIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.13)", alignItems: "center", justifyContent: "center" },
  impactText: { flex: 1, gap: 3 },
  impactTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  impactSub: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  impactNumber: { fontSize: 21, fontWeight: "800", color: "#fff", textAlign: "center" },
  impactSmall: { fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  list: { gap: 11 },
  emptyBtn: { marginTop: 14, alignSelf: "stretch" },
  card: { flexDirection: "row", gap: 12, padding: 9 },
  cardImage: { width: 106, minHeight: 150, alignSelf: "stretch" },
  cardBody: { flex: 1, minWidth: 0, paddingVertical: 4, paddingRight: 2 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: color.text, letterSpacing: -0.3, marginTop: 7 },
  cardCategory: { fontSize: 12, color: color.muted, marginTop: 2 },
  priceLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  price: { fontSize: 16, fontWeight: "800", color: color.primary },
  savePill: { fontSize: 10, fontWeight: "700", color: color.primary, backgroundColor: color.tint, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
  metaPill: { fontSize: 11, fontWeight: "600", color: color.primary, backgroundColor: color.tintSoft, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, overflow: "hidden" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  timeText: { flex: 1, fontSize: 11, fontWeight: "600", color: color.primary },
});
