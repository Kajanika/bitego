import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { pickupCodeSchema, type SellerOrderDto } from "@bitego/shared";
import { confirmPickup, verifyPickupCode } from "@/api/seller";
import { color, formatPrice, formatQuantity, formatWindow } from "./design";
import { Icon } from "./Icon";
import { Btn, errorMessage, FormError, Page, Surface, TopBar } from "./kit";

// Three steps: type the buyer's code, check the order, then confirm the handover.
export function VerifyPickupScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<SellerOrderDto | null>(null);
  const [done, setDone] = useState<SellerOrderDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCode("");
    setOrder(null);
    setDone(null);
    setError(null);
  }

  async function check() {
    setError(null);
    const parsed = pickupCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter the pickup code");
      return;
    }
    setBusy(true);
    try {
      setOrder(await verifyPickupCode(parsed.data.code));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      setDone(await confirmPickup(code.trim().toUpperCase()));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Page>
        <View style={styles.success}>
          <View style={styles.ring}><Icon name="check" size={38} color="#fff" /></View>
          <Text style={styles.successTitle}>Pickup confirmed!</Text>
          <Text style={styles.successText}>
            {formatQuantity(done.quantity, done.listing.unit)} of {done.listing.title} handed over to {done.buyer.fullName}.
          </Text>
          <View style={styles.successActions}>
            <Btn title="Check another code" onPress={reset} />
            <Btn title="Back to orders" variant="secondary" onPress={() => router.back()} />
          </View>
        </View>
      </Page>
    );
  }

  if (order) {
    return (
      <Page
        footer={
          <>
            <FormError>{error}</FormError>
            <Btn title="Confirm pickup" icon="check" loading={busy} onPress={() => void confirm()} />
            <Btn title="Use a different code" variant="secondary" disabled={busy} onPress={reset} />
          </>
        }
      >
        <TopBar title="Check the order" />
        <View style={styles.valid}>
          <Icon name="shield" color={color.primary} />
          <Text style={styles.validText}>Code {code.trim().toUpperCase()} is valid</Text>
        </View>
        <Surface style={styles.details}>
          <Row label="Food" value={order.listing.title} />
          <Row label="Quantity" value={formatQuantity(order.quantity, order.listing.unit)} />
          <Row label="Buyer" value={`${order.buyer.fullName}${order.buyer.isBusiness ? " (business)" : ""}`} />
          <Row label="Pickup" value={formatWindow(order.listing.pickupStart, order.listing.pickupEnd)} />
          <View style={styles.hr} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{order.totalPrice === 0 ? "Free food" : "Collect from buyer"}</Text>
            <Text style={styles.total}>{formatPrice(order.totalPrice)}</Text>
          </View>
        </Surface>
        <Text style={styles.note}>Confirm only after handing over the food. This cannot be undone.</Text>
      </Page>
    );
  }

  return (
    <Page footer={<Btn title="Check code" loading={busy} onPress={() => void check()} />}>
      <TopBar title="Check pickup code" />
      <View style={styles.intro}>
        <View style={styles.introIcon}><Icon name="shield" size={28} color={color.primary} /></View>
        <Text style={styles.introTitle}>Ask for the pickup code</Text>
        <Text style={styles.introText}>The buyer can find their 6-character code in their reservation.</Text>
      </View>
      <TextInput
        accessibilityLabel="Pickup code"
        value={code}
        onChangeText={(v) => {
          setCode(v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6));
          setError(null);
        }}
        placeholder="BG4821"
        placeholderTextColor={color.muted2}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        returnKeyType="done"
        onSubmitEditing={() => void check()}
        style={[styles.codeInput, !!error && styles.codeError]}
      />
      <FormError>{error}</FormError>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: "center", gap: 6, marginTop: 8, marginBottom: 24 },
  introIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: color.tint, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  introTitle: { fontSize: 21, fontWeight: "700", letterSpacing: -0.4, color: color.text },
  introText: { fontSize: 14, lineHeight: 20, color: color.muted, textAlign: "center" },
  codeInput: { height: 72, marginBottom: 12, borderRadius: 18, borderWidth: 1, borderStyle: "dashed", borderColor: color.light, backgroundColor: color.tintSoft, textAlign: "center", fontSize: 30, fontWeight: "800", letterSpacing: 6, color: color.primary },
  codeError: { borderColor: color.error },
  valid: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: color.light, backgroundColor: color.tintSoft, marginBottom: 14 },
  validText: { fontSize: 14, fontWeight: "700", color: color.primary },
  details: { padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: color.muted },
  rowValue: { flex: 1, fontSize: 13, fontWeight: "700", color: color.text, textAlign: "right" },
  hr: { height: 1, backgroundColor: color.line, marginVertical: 10 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, fontWeight: "700", color: color.text },
  total: { fontSize: 19, fontWeight: "800", color: color.primary },
  note: { fontSize: 13, lineHeight: 19, color: color.warnText, textAlign: "center", marginTop: 14 },
  success: { alignItems: "center", paddingTop: 72 },
  ring: { width: 76, height: 76, borderRadius: 38, backgroundColor: color.primary, alignItems: "center", justifyContent: "center", borderWidth: 12, borderColor: color.tint, boxSizing: "content-box" },
  successTitle: { fontSize: 27, fontWeight: "700", letterSpacing: -0.6, color: color.text, marginTop: 30 },
  successText: { fontSize: 14, lineHeight: 21, color: color.muted, textAlign: "center", marginTop: 8, maxWidth: 300 },
  successActions: { alignSelf: "stretch", gap: 9, marginTop: 28 },
});
