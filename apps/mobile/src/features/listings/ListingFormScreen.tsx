import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import type { ImagePickerAsset } from "expo-image-picker";
import {
  createListingSchema,
  QUANTITY_UNITS,
  type CategoryDto,
  type ListingAudience,
  type QuantityUnit,
  type SellerListingDto,
  type UpdateListingInput,
} from "@bitego/shared";
import { ApiRequestError } from "@/api/client";
import {
  addListingImage,
  createListing,
  fetchCategories,
  fetchMyListing,
  removeListingImage,
  updateListing,
  uploadListingPhoto,
} from "@/api/seller";
import { toFieldErrors } from "@/features/auth/formErrors";
import { color, formatDay, formatTime, startOfDay } from "./design";
import { Icon } from "./Icon";
import { apiFieldErrors, Btn, Chips, errorMessage, Field, FormError, LoadError, Page, SectionTitle, SkeletonCards, Stepper, Surface, TopBar } from "./kit";
import { PhotoPicker, type PhotoItem } from "./PhotoPicker";

const STEP_MINUTES = 15;
const STEP_MS = STEP_MINUTES * 60000;
const DAY_MS = 86400000;

const UNIT_LABELS: Record<QuantityUnit, string> = { PORTION: "Portions", PIECE: "Pieces", PACK: "Packs", KG: "Kg" };
const AUDIENCES: { value: ListingAudience; label: string; hint: string }[] = [
  { value: "EVERYONE", label: "Everyone", hint: "Customers and other businesses can reserve this." },
  { value: "CUSTOMERS_ONLY", label: "Customers only", hint: "Only customers can see and reserve this." },
  { value: "BUSINESSES_ONLY", label: "Businesses only", hint: "Only other businesses can see and reserve this. Needs a B2B-suitable category." },
];

function nextQuarterHour(): Date {
  const next = Math.ceil(Date.now() / STEP_MS) * STEP_MS;
  return new Date(next);
}

const toNumber = (text: string) => (text.trim() === "" ? undefined : Number(text.replace(/,/g, "")));

// Errors from the API that belong to one input.
const CODE_FIELDS: Record<string, string> = {
  CATEGORY_NOT_AVAILABLE: "categoryId",
  CATEGORY_NOT_B2B_SUITABLE: "categoryId",
  QUANTITY_BELOW_RESERVED: "quantityTotal",
  PICKUP_ALREADY_ENDED: "pickupEnd",
  PICKUP_WINDOW_LOCKED: "pickupEnd",
  INVALID_PICKUP_WINDOW: "pickupEnd",
  INVALID_PRICE: "price",
};

// Create and edit share this screen. With a listing id it edits; photos then save immediately.
export function ListingFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDto[] | null>(null);
  const [existing, setExisting] = useState<SellerListingDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<QuantityUnit>("PORTION");
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [start, setStart] = useState(nextQuarterHour);
  const [end, setEnd] = useState(() => new Date(nextQuarterHour().getTime() + 2 * 3600000));
  const [pickupNote, setPickupNote] = useState("");
  const [audience, setAudience] = useState<ListingAudience>("EVERYONE");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [cats, listing] = await Promise.all([fetchCategories(), id ? fetchMyListing(id) : Promise.resolve(null)]);
      setCategories(cats);
      if (listing) {
        setExisting(listing);
        setTitle(listing.title);
        setDescription(listing.description ?? "");
        setCategoryId(listing.category.id);
        setQuantity(String(listing.quantityTotal));
        setUnit(listing.unit);
        setIsFree(listing.price === 0);
        setPrice(listing.price === 0 ? "" : String(listing.price));
        setOriginalPrice(listing.originalPrice === listing.price ? "" : String(listing.originalPrice));
        setStart(new Date(listing.pickupStart));
        setEnd(new Date(listing.pickupEnd));
        setPickupNote(listing.pickupNote ?? "");
        setAudience(listing.audience);
        setPhotos(listing.images.map((i) => ({ id: i.id, uri: i.imageUrl })));
      }
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // A hidden category stays selectable on a listing that already uses it.
  const options = [...(categories ?? [])];
  if (existing && !options.some((c) => c.id === existing.category.id)) {
    options.unshift({ ...existing.category, description: null, iconUrl: null, b2bSuitability: "RESTRICTED" });
  }
  const categoryOptions = options.map((c) => ({
    value: c.id,
    label: c.name,
    disabled: audience === "BUSINESSES_ONLY" && c.b2bSuitability !== "SUITABLE",
  }));

  function chooseAudience(next: ListingAudience) {
    setAudience(next);
    const selected = options.find((c) => c.id === categoryId);
    if (next === "BUSINESSES_ONLY" && selected && selected.b2bSuitability !== "SUITABLE") setCategoryId(null);
  }

  function chooseDay(offset: number) {
    const target = startOfDay(new Date()).getTime() + offset * DAY_MS;
    const shift = target - startOfDay(start).getTime();
    setStart(new Date(start.getTime() + shift));
    setEnd(new Date(end.getTime() + shift));
  }

  const dayOffset = Math.round((startOfDay(start).getTime() - startOfDay(new Date()).getTime()) / DAY_MS);

  // Photos: while creating, upload and keep the keys for the POST. While editing, save straight away.
  const addPhoto = async (asset: ImagePickerAsset) => {
    const key = await uploadListingPhoto({ uri: asset.uri, mimeType: asset.mimeType });
    if (existing) {
      const updated = await addListingImage(existing.id, key);
      setExisting(updated);
      setPhotos(updated.images.map((i) => ({ id: i.id, uri: i.imageUrl })));
    } else {
      setPhotos((current) => [...current, { id: key, uri: asset.uri }]);
    }
  };

  const removePhoto = async (photo: PhotoItem) => {
    if (existing) {
      const updated = await removeListingImage(existing.id, photo.id);
      setExisting(updated);
      setPhotos(updated.images.map((i) => ({ id: i.id, uri: i.imageUrl })));
    } else {
      setPhotos((current) => current.filter((p) => p.id !== photo.id));
    }
  };

  async function submit() {
    setFormError(null);
    const priceValue = isFree ? 0 : toNumber(price);
    const originalValue = toNumber(originalPrice) ?? priceValue;
    const parsed = createListingSchema.safeParse({
      categoryId: categoryId ?? undefined,
      title,
      description: description.trim() || undefined,
      quantityTotal: toNumber(quantity),
      unit,
      originalPrice: originalValue,
      price: priceValue,
      pickupStart: start.toISOString(),
      pickupEnd: end.toISOString(),
      pickupNote: pickupNote.trim() || undefined,
      audience,
      imageKeys: existing ? undefined : photos.map((p) => p.id),
    });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      setFormError("Please fix the highlighted fields.");
      return;
    }
    const pickupChanged = !existing || existing.pickupEnd !== end.toISOString();
    if (pickupChanged && end.getTime() <= Date.now()) {
      setErrors({ pickupEnd: "The pickup end time has already passed" });
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      if (existing) {
        await updateListing(existing.id, changesFrom(existing, parsed.data));
        router.back();
      } else {
        const created = await createListing(parsed.data);
        router.replace(`/sell/${created.id}`);
      }
    } catch (err) {
      const field = err instanceof ApiRequestError ? CODE_FIELDS[err.code] : undefined;
      setErrors(field ? { [field]: errorMessage(err) } : apiFieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const screenTitle = id ? "Edit listing" : "Post surplus food";

  if (loadError) {
    return (
      <Page>
        <TopBar title={screenTitle} />
        <LoadError message={loadError} onRetry={() => void load()} />
      </Page>
    );
  }
  if (!categories || (id && !existing)) {
    return (
      <Page>
        <TopBar title={screenTitle} />
        <SkeletonCards />
      </Page>
    );
  }

  return (
    <Page
      footer={
        <>
          <FormError>{formError}</FormError>
          <Btn title={existing ? "Save changes" : "Post listing"} loading={saving} onPress={() => void submit()} />
        </>
      }
    >
      <TopBar title={screenTitle} />

      <Text style={styles.sectionFirst}>Food photos</Text>
      <Text style={styles.hint}>A clear photo helps your food get reserved faster.</Text>
      <PhotoPicker photos={photos} onAdd={addPhoto} onRemove={removePhoto} />

      <SectionTitle>Food details</SectionTitle>
      <Field label="Food name" placeholder="e.g. Rice & Curry" value={title} onChangeText={setTitle} error={errors.title} />
      <Field label="Description" optional multiline placeholder="What's included?" value={description} onChangeText={setDescription} error={errors.description} />
      <Chips label="Category" options={categoryOptions} value={categoryId} onChange={setCategoryId} error={errors.categoryId} />

      <SectionTitle>Quantity</SectionTitle>
      <Field label="Quantity available" placeholder="e.g. 10" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} error={errors.quantityTotal} />
      {existing && existing.quantityTotal > existing.quantityAvailable ? (
        <Text style={styles.note}>{existing.quantityTotal - existing.quantityAvailable} already reserved, so the quantity cannot go below that.</Text>
      ) : null}
      <Chips label="Unit" options={QUANTITY_UNITS.map((u) => ({ value: u, label: UNIT_LABELS[u] }))} value={unit} onChange={setUnit} error={errors.unit} />

      <SectionTitle>Price</SectionTitle>
      <Surface style={styles.freeRow}>
        <View style={styles.freeText}>
          <Text style={styles.freeTitle}>Give it away for free</Text>
          <Text style={styles.hintInline}>Shown to buyers as FREE community food.</Text>
        </View>
        <Switch
          accessibilityLabel="Free food"
          value={isFree}
          onValueChange={setIsFree}
          trackColor={{ false: color.line, true: color.primary }}
          thumbColor="#fff"
        />
      </Surface>
      {isFree ? null : (
        <View style={styles.twoFields}>
          <View style={styles.half}>
            <Field label="Your price" prefix="Rs." placeholder="220" keyboardType="decimal-pad" value={price} onChangeText={setPrice} error={errors.price} />
          </View>
          <View style={styles.half}>
            <Field label="Original price" optional prefix="Rs." placeholder="380" keyboardType="decimal-pad" value={originalPrice} onChangeText={setOriginalPrice} error={errors.originalPrice} />
          </View>
        </View>
      )}

      <SectionTitle>Pickup time</SectionTitle>
      <Chips<string>
        options={[
          { value: "0", label: "Today" },
          { value: "1", label: "Tomorrow" },
        ]}
        value={dayOffset === 0 || dayOffset === 1 ? String(dayOffset) : null}
        onChange={(v) => chooseDay(Number(v))}
      />
      <Surface style={styles.timeCard}>
        <TimeRow
          label="From"
          date={start}
          onMinus={() => setStart(new Date(start.getTime() - STEP_MS))}
          onPlus={() => {
            const next = new Date(start.getTime() + STEP_MS);
            setStart(next);
            if (end <= next) setEnd(new Date(next.getTime() + STEP_MS));
          }}
        />
        <View style={styles.divider} />
        <TimeRow
          label="Until"
          date={end}
          minusDisabled={end.getTime() - STEP_MS <= start.getTime()}
          onMinus={() => setEnd(new Date(end.getTime() - STEP_MS))}
          onPlus={() => setEnd(new Date(end.getTime() + STEP_MS))}
        />
      </Surface>
      {errors.pickupStart ? <Text style={styles.errorNote}>{errors.pickupStart}</Text> : null}
      {errors.pickupEnd ? <Text style={styles.errorNote}>{errors.pickupEnd}</Text> : null}
      <Field label="Pickup note" optional placeholder="e.g. Ask at the front counter" value={pickupNote} onChangeText={setPickupNote} error={errors.pickupNote} />

      <SectionTitle>Who can buy this?</SectionTitle>
      <Chips options={AUDIENCES.map(({ value, label }) => ({ value, label }))} value={audience} onChange={chooseAudience} error={errors.audience} />
      <View style={styles.audienceHint}>
        <Icon name="info" size={16} color={color.primary} />
        <Text style={styles.audienceText}>{AUDIENCES.find((a) => a.value === audience)?.hint}</Text>
      </View>
    </Page>
  );
}

function TimeRow({ label, date, onMinus, onPlus, minusDisabled }: { label: string; date: Date; onMinus: () => void; onPlus: () => void; minusDisabled?: boolean }) {
  return (
    <View style={styles.timeRow}>
      <View>
        <Text style={styles.timeLabel}>{label}</Text>
        <Text style={styles.timeDay}>{formatDay(date)}</Text>
      </View>
      <Stepper label={`${label} time`} value={formatTime(date)} onMinus={onMinus} onPlus={onPlus} minusDisabled={minusDisabled} />
    </View>
  );
}

// Only what changed goes to the API, so unchanged times are not re-checked against the pickup-window rules.
function changesFrom(
  existing: SellerListingDto,
  next: {
    categoryId: string;
    title: string;
    description?: string;
    quantityTotal: number;
    unit: QuantityUnit;
    originalPrice: number;
    price: number;
    pickupStart: string;
    pickupEnd: string;
    pickupNote?: string;
    audience: ListingAudience;
  },
): UpdateListingInput {
  const changes: UpdateListingInput = {};
  if (next.categoryId !== existing.category.id) changes.categoryId = next.categoryId;
  if (next.title !== existing.title) changes.title = next.title;
  if ((next.description ?? null) !== existing.description) changes.description = next.description ?? null;
  if (next.quantityTotal !== existing.quantityTotal) changes.quantityTotal = next.quantityTotal;
  if (next.unit !== existing.unit) changes.unit = next.unit;
  if (next.originalPrice !== existing.originalPrice) changes.originalPrice = next.originalPrice;
  if (next.price !== existing.price) changes.price = next.price;
  if (next.pickupStart !== existing.pickupStart) changes.pickupStart = next.pickupStart;
  if (next.pickupEnd !== existing.pickupEnd) changes.pickupEnd = next.pickupEnd;
  if ((next.pickupNote ?? null) !== existing.pickupNote) changes.pickupNote = next.pickupNote ?? null;
  if (next.audience !== existing.audience) changes.audience = next.audience;
  // An unchanged form still needs one field, because the API refuses an empty update.
  return Object.keys(changes).length > 0 ? changes : { title: next.title };
}

const styles = StyleSheet.create({
  sectionFirst: { fontSize: 16, fontWeight: "700", color: color.text, letterSpacing: -0.3 },
  hint: { fontSize: 13, color: color.muted, marginTop: 4, marginBottom: 12 },
  hintInline: { fontSize: 12, color: color.muted, marginTop: 3 },
  note: { fontSize: 12, color: color.warnText, marginTop: 6 },
  errorNote: { fontSize: 12, color: color.error, marginTop: 8, fontWeight: "500" },
  freeRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, shadowOpacity: 0, elevation: 0 },
  freeText: { flex: 1 },
  freeTitle: { fontSize: 14, fontWeight: "700", color: color.text },
  twoFields: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  timeCard: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 4, shadowOpacity: 0, elevation: 0 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  timeLabel: { fontSize: 13, fontWeight: "600", color: color.text },
  timeDay: { fontSize: 12, color: color.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: color.line },
  audienceHint: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 13, borderRadius: 14, backgroundColor: color.tintSoft, marginTop: 12 },
  audienceText: { flex: 1, fontSize: 12, lineHeight: 17, color: color.primary },
});
