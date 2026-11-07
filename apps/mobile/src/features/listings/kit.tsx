import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ListingStatus, ReservationStatus } from "@bitego/shared";
import { ApiRequestError } from "@/api/client";
import { toFieldErrors } from "@/features/auth/formErrors";
import { color, shadow } from "./design";
import { Icon, type IconName } from "./Icon";

// The seller screens' building blocks, translated from the design prototype's CSS to React Native.

// ---------- Layout ----------

export function Page({
  children,
  footer,
  refreshing,
  onRefresh,
  flush = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  flush?: boolean;
}) {
  return (
    <SafeAreaView style={styles.page} edges={flush ? ["left", "right"] : ["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={flush ? styles.flushContent : styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={color.primary} colors={[color.primary]} /> : undefined
          }
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function TopBar({ title, action }: { title: string; action?: ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.topbar}>
      <IconButton icon="back" label="Go back" onPress={() => router.back()} />
      <Text style={[styles.titleMd, styles.topbarTitle]} numberOfLines={1}>{title}</Text>
      <View style={styles.topAction}>{action}</View>
    </View>
  );
}

export function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.pageHead}>
      <View style={styles.flex}>
        <Text style={styles.titleXl}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={[styles.titleMd, styles.sectionTitle]}>{children}</Text>;
}

export function Surface({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (!onPress) return <View style={[styles.surface, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.surface, style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

// ---------- Buttons ----------

export function Btn({
  title,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  const fg = variant === "primary" || variant === "danger" ? "#fff" : variant === "ghost" ? color.error : color.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "secondary" && styles.btnSecondary,
        variant === "danger" && styles.btnDanger,
        off && styles.btnOff,
        pressed && styles.btnPressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, style, iconColor = color.text, size = 20 }: { icon: IconName; label: string; onPress: () => void; style?: StyleProp<ViewStyle>; iconColor?: string; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.iconBtn, style, pressed && styles.pressed]}>
      <Icon name={icon} size={size} color={iconColor} />
    </Pressable>
  );
}

// ---------- Forms ----------

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  optional,
  icon,
  keyboardType,
  autoCapitalize,
  multiline,
  disabled,
  prefix,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
  icon?: IconName;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  disabled?: boolean;
  prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      <View style={[styles.inputWrap, multiline && styles.inputMulti, focused && styles.inputFocus, !!error && styles.inputError, disabled && styles.inputOff]}>
        {icon ? <Icon name={icon} size={18} color={color.muted2} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={color.muted2}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "sentences"}
          autoCorrect={false}
          multiline={multiline}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.inputMultiText]}
        />
      </View>
      <FieldError>{error}</FieldError>
    </View>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <View style={styles.errorRow}>
      <Icon name="close" size={13} color={color.error} />
      <Text style={styles.errorText}>{children}</Text>
    </View>
  );
}

export function FormError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <View style={styles.formError}>
      <Icon name="alert" size={16} color={color.error} />
      <Text style={styles.formErrorText}>{children}</Text>
    </View>
  );
}

export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label?: string;
  options: { value: T; label: string; disabled?: boolean }[];
  value: T | null;
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.chips}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: o.disabled }}
              disabled={o.disabled}
              onPress={() => onChange(o.value)}
              style={[styles.chip, active && styles.chipActive, o.disabled && styles.chipOff]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <FieldError>{error}</FieldError>
    </View>
  );
}

export function Stepper({ value, onMinus, onPlus, minusDisabled, plusDisabled, label }: { value: string; onMinus: () => void; onPlus: () => void; minusDisabled?: boolean; plusDisabled?: boolean; label: string }) {
  const button = (icon: IconName, onPress: () => void, off: boolean | undefined, name: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name} ${label}`}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [styles.stepBtn, off && styles.btnOff, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} color={color.primary} />
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      {button("minus", onMinus, minusDisabled, "Decrease")}
      <Text style={styles.stepValue}>{value}</Text>
      {button("plus", onPlus, plusDisabled, "Increase")}
    </View>
  );
}

// ---------- Display ----------

export function Tabs<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.tabs}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(o.value)} style={styles.tab}>
            <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>{o.label}</Text>
            {active ? <View style={styles.tabLine} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

type BadgeTone = "active" | "ready" | "complete" | "cancelled" | "neutral";
const BADGE_COLORS: Record<BadgeTone, { bg: string; fg: string }> = {
  active: { bg: color.tint, fg: color.primary },
  ready: { bg: color.amberTint, fg: color.warnText },
  complete: { bg: color.line, fg: color.muted },
  cancelled: { bg: color.errorTint, fg: color.error },
  neutral: { bg: color.surface2, fg: color.muted },
};

export function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  const c = BADGE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: c.fg }]} />
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const LISTING_BADGES: Record<ListingStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "Available", tone: "active" },
  SOLD_OUT: { label: "Sold out", tone: "ready" },
  COMPLETED: { label: "Completed", tone: "complete" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "cancelled" },
};
export const ListingBadge = ({ status }: { status: ListingStatus }) => <Badge {...LISTING_BADGES[status]} />;

const ORDER_BADGES: Record<ReservationStatus, { label: string; tone: BadgeTone }> = {
  CONFIRMED: { label: "Reserved", tone: "active" },
  PICKED_UP: { label: "Picked up", tone: "complete" },
  CANCELLED: { label: "Cancelled", tone: "cancelled" },
  EXPIRED: { label: "No-show", tone: "neutral" },
};
export const OrderBadge = ({ status }: { status: ReservationStatus }) => <Badge {...ORDER_BADGES[status]} />;

export function FoodImage({ uri, style }: { uri?: string | null; style: StyleProp<ViewStyle> }) {
  if (uri) return <Image source={{ uri }} accessibilityIgnoresInvertColors style={[styles.foodImage, style] as never} />;
  return (
    <View style={[styles.foodImage, styles.foodImageEmpty, style]}>
      <Icon name="utensils" size={26} color={color.light} />
    </View>
  );
}

export function InfoIcon({ icon, tone = "primary" }: { icon: IconName; tone?: "primary" | "amber" }) {
  return (
    <View style={[styles.infoIcon, tone === "amber" && { backgroundColor: color.amberSoft }]}>
      <Icon name={icon} size={18} color={tone === "amber" ? color.warnText : color.primary} />
    </View>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Icon name={icon} size={28} color={color.primary} /></View>
      <Text style={[styles.titleMd, styles.centerText]}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {action}
    </View>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <View accessibilityLabel="Loading" style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <Animated.View key={i} style={[styles.surface, styles.skeletonCard, { opacity }]}>
          <View style={styles.skeletonImage} />
          <View style={styles.flex}>
            <View style={[styles.skeletonLine, { width: "70%" }]} />
            <View style={[styles.skeletonLine, { width: "90%" }]} />
            <View style={[styles.skeletonLine, { width: "45%" }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <EmptyState icon="alert" title="Something went wrong" text={message} action={<Btn title="Try again" variant="secondary" icon="refresh" onPress={onRetry} style={styles.emptyAction} />} />;
}

export function ConfirmDialog({
  visible,
  icon = "alert",
  title,
  message,
  confirmLabel,
  cancelLabel = "Keep",
  busy,
  onConfirm,
  onClose,
  children,
}: {
  visible: boolean;
  icon?: IconName;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.dialogIcon}><Icon name={icon} size={24} color={color.error} /></View>
          <Text style={[styles.titleLg, styles.centerText]}>{title}</Text>
          <Text style={styles.dialogText}>{message}</Text>
          {children}
          <View style={styles.dialogActions}>
            <Btn title={cancelLabel} variant="secondary" onPress={onClose} disabled={busy} style={styles.flex} />
            <Btn title={confirmLabel} variant="danger" onPress={onConfirm} loading={busy} style={styles.flex} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Data ----------

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";

// Field errors from an API validation failure, for showing next to each input.
export function apiFieldErrors(err: unknown): Record<string, string> {
  if (err instanceof ApiRequestError && err.code === "VALIDATION_ERROR" && Array.isArray(err.details)) {
    return toFieldErrors(err.details as { path: string; message: string }[]);
  }
  return {};
}

// Loads data whenever the screen comes into view, so lists are fresh after editing something.
export function useFocusData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);

  const run = useCallback(async () => {
    const request = ++latest.current;
    try {
      const result = await load();
      if (request === latest.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (request === latest.current) setError(errorMessage(err));
    } finally {
      if (request === latest.current) setRefreshing(false);
    }
  }, [load]);

  useFocusEffect(useCallback(() => void run(), [run]));

  const refresh = useCallback(() => {
    setRefreshing(true);
    void run();
  }, [run]);

  const retry = useCallback(() => {
    setError(null);
    void run();
  }, [run]);

  return { data, setData, error, refreshing, refresh, retry };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flex: 1, backgroundColor: color.page },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  flushContent: { paddingBottom: 32 },
  footer: { backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.line, paddingHorizontal: 20, paddingTop: 11, paddingBottom: 14, gap: 8 },
  pressed: { opacity: 0.8 },
  list: { gap: 11 },
  centerText: { textAlign: "center" },

  titleXl: { fontSize: 27, fontWeight: "700", color: color.text, letterSpacing: -0.6 },
  titleLg: { fontSize: 21, fontWeight: "700", color: color.text, letterSpacing: -0.4 },
  titleMd: { fontSize: 16, fontWeight: "700", color: color.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: color.muted, marginTop: 4 },
  sectionTitle: { marginTop: 20, marginBottom: 12 },

  topbar: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  topbarTitle: { flex: 1, textAlign: "center", marginHorizontal: 8 },
  topAction: { minWidth: 44, alignItems: "flex-end" },
  pageHead: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingTop: 10, paddingBottom: 18 },
  surface: { backgroundColor: color.surface, borderRadius: 17, borderWidth: 1, borderColor: color.line, ...shadow },

  btn: { minHeight: 48, borderRadius: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  btnPrimary: { backgroundColor: color.primary, shadowColor: color.primary, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  btnSecondary: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.lineStrong },
  btnDanger: { backgroundColor: color.error },
  btnOff: { opacity: 0.45 },
  btnPressed: { transform: [{ scale: 0.98 }] },
  btnText: { fontSize: 15, fontWeight: "700" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.surface, alignItems: "center", justifyContent: "center" },

  field: { gap: 8, marginTop: 16 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "600", color: color.text },
  optional: { fontSize: 11, color: color.muted },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 49, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  inputMulti: { minHeight: 96, alignItems: "flex-start", paddingVertical: 10 },
  inputFocus: { borderColor: color.mid },
  inputError: { borderColor: color.error },
  inputOff: { backgroundColor: color.surface2 },
  input: { flex: 1, minWidth: 0, fontSize: 15, color: color.text, paddingVertical: 8 },
  inputMultiText: { minHeight: 76, textAlignVertical: "top", paddingVertical: 0 },
  prefix: { fontSize: 15, color: color.muted },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  errorText: { flex: 1, fontSize: 12, color: color.error, fontWeight: "500" },
  formError: { flexDirection: "row", gap: 7, alignItems: "center", padding: 12, borderRadius: 11, backgroundColor: color.errorTint },
  formErrorText: { flex: 1, fontSize: 13, lineHeight: 18, color: color.error },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 99, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  chipActive: { backgroundColor: color.primary, borderColor: color.primary },
  chipOff: { opacity: 0.4 },
  chipText: { fontSize: 13, fontWeight: "600", color: color.text },
  chipTextActive: { color: "#fff" },

  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { width: 37, height: 37, borderRadius: 19, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, alignItems: "center", justifyContent: "center" },
  stepValue: { minWidth: 72, textAlign: "center", fontSize: 14, fontWeight: "700", color: color.text },

  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: color.line, marginBottom: 18 },
  tab: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  tabText: { fontSize: 13, fontWeight: "700", color: color.muted },
  tabTextActive: { color: color.primary },
  tabLine: { position: "absolute", bottom: -1, left: 10, right: 10, height: 2, borderRadius: 2, backgroundColor: color.primary },

  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99 },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },

  foodImage: { borderRadius: 12, backgroundColor: color.tintSoft },
  foodImageEmpty: { alignItems: "center", justifyContent: "center" },
  infoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.tintSoft, alignItems: "center", justifyContent: "center" },

  empty: { alignItems: "center", paddingHorizontal: 20, paddingTop: 32, paddingBottom: 18, gap: 6 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: color.tint, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  emptyText: { fontSize: 13, lineHeight: 19, color: color.muted, textAlign: "center" },
  emptyAction: { marginTop: 14, alignSelf: "stretch" },

  skeletonCard: { flexDirection: "row", gap: 12, padding: 10 },
  skeletonImage: { width: 96, height: 96, borderRadius: 12, backgroundColor: color.line },
  skeletonLine: { height: 10, borderRadius: 9, backgroundColor: color.line, marginTop: 12 },

  overlay: { flex: 1, backgroundColor: "rgba(40,20,8,0.48)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 350, backgroundColor: color.surface, borderRadius: 22, padding: 24, alignItems: "stretch" },
  dialogIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: color.errorTint, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 },
  dialogText: { fontSize: 13, lineHeight: 19, color: color.muted, textAlign: "center", marginTop: 8, marginBottom: 14 },
  dialogActions: { flexDirection: "row", gap: 9, marginTop: 8 },
});
