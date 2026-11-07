import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { BusinessType } from "@bitego/shared";
import { fetchMyBusiness } from "@/api/seller";
import { useAuth } from "@/features/auth/AuthProvider";
import { color, initials } from "@/features/listings/design";
import { Icon, type IconName } from "@/features/listings/Icon";
import { Btn, ConfirmDialog, InfoIcon, LoadError, Page, PageHead, SectionTitle, SkeletonCards, Surface, useFocusData } from "@/features/listings/kit";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RESTAURANT: "Restaurant",
  CAFE: "Café",
  BAKERY: "Bakery",
  SUPERMARKET: "Supermarket",
  CANTEEN: "Canteen",
  HOTEL: "Hotel",
  SHOP: "Shop",
  OTHER: "Other",
};

function InfoRow({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress?: () => void }) {
  const body = (
    <>
      <InfoIcon icon={icon} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {onPress ? <Icon name="chevron" size={18} color={color.muted2} /> : null}
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}>{body}</Pressable>
  ) : (
    <View style={styles.infoRow}>{body}</View>
  );
}

export function ShopScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { data: shop, error, refreshing, refresh, retry } = useFocusData(fetchMyBusiness);
  const [loggingOut, setLoggingOut] = useState(false);

  const openMap = () => {
    if (shop) void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`);
  };

  return (
    <Page refreshing={refreshing} onRefresh={refresh}>
      <PageHead title="Shop" subtitle="Your business profile and pickup location." />
      {error && !shop ? <LoadError message={error} onRetry={retry} /> : null}
      {!error && !shop ? <SkeletonCards count={2} /> : null}
      {shop ? (
        <>
          <Surface style={styles.profile}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(shop.name)}</Text></View>
            <View style={styles.profileText}>
              <Text style={styles.name} numberOfLines={2}>{shop.name}</Text>
              <Text style={styles.small}>{BUSINESS_TYPE_LABELS[shop.type]} · {shop.city}</Text>
              <View style={styles.verifiedRow}>
                <View style={styles.verified}><Icon name="check" size={10} color="#fff" /></View>
                <Text style={styles.verifiedText}>Verified provider</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push("/shop/edit")} style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </Surface>

          <View style={styles.stats}>
            <Stat value={String(shop.stats.activeListings)} label="Active listings" />
            <Stat value={String(shop.stats.itemsRescued)} label="Items rescued" divider />
            <Stat value={shop.stats.averageRating === null ? "–" : shop.stats.averageRating.toFixed(1)} label={shop.stats.reviewCount === 1 ? "1 review" : `${shop.stats.reviewCount} reviews`} divider />
          </View>

          {shop.description ? <Text style={styles.description}>{shop.description}</Text> : null}

          <SectionTitle>Shop details</SectionTitle>
          <Surface style={styles.list}>
            <InfoRow
              icon="pin"
              label="Pickup location"
              value={[shop.addressLine, shop.city, shop.district].filter(Boolean).join(", ")}
              onPress={openMap}
            />
            <InfoRow icon="phone" label="Contact number" value={shop.contactNo} />
            {shop.email ? <InfoRow icon="mail" label="Business email" value={shop.email} /> : null}
            {shop.registrationNo ? <InfoRow icon="tag" label="Registration number" value={shop.registrationNo} /> : null}
          </Surface>

          <SectionTitle>Account</SectionTitle>
          <Surface style={styles.list}>
            <InfoRow icon="user" label={profile?.fullName ?? "Owner"} value={profile?.email ?? ""} />
          </Surface>
          <Btn title="Log out" icon="logout" variant="ghost" onPress={() => setLoggingOut(true)} style={styles.logout} />
        </>
      ) : null}

      <ConfirmDialog
        visible={loggingOut}
        icon="logout"
        title="Log out?"
        message="You'll need to log in again to manage your listings."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onConfirm={() => {
          setLoggingOut(false);
          void signOut();
        }}
        onClose={() => setLoggingOut(false)}
      />
    </Page>
  );
}

function Stat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <View style={[styles.stat, divider && styles.statDivider]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  profile: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: 18 },
  avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: color.mid, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  profileText: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3, color: color.text },
  small: { fontSize: 12, color: color.muted },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  verified: { width: 15, height: 15, borderRadius: 8, backgroundColor: color.mid, alignItems: "center", justifyContent: "center" },
  verifiedText: { fontSize: 11, fontWeight: "600", color: color.primary },
  editBtn: { minHeight: 34, paddingHorizontal: 12, borderRadius: 11, backgroundColor: color.tintSoft, alignItems: "center", justifyContent: "center" },
  editText: { fontSize: 13, fontWeight: "700", color: color.primary },
  stats: { flexDirection: "row", marginTop: 14, paddingVertical: 15, paddingHorizontal: 4, borderRadius: 17, backgroundColor: "#E8782A" },
  stat: { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.25)" },
  statValue: { fontSize: 17, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.85)" },
  description: { marginTop: 16, fontSize: 14, lineHeight: 21, color: color.muted },
  list: { paddingHorizontal: 13, paddingVertical: 3, shadowOpacity: 0, elevation: 0 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11 },
  infoText: { flex: 1, minWidth: 0, gap: 2 },
  infoLabel: { fontSize: 12, color: color.muted },
  infoValue: { fontSize: 14, fontWeight: "600", color: color.text },
  logout: { marginTop: 14 },
});
