import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { BUSINESS_TYPES, updateBusinessSchema, type BusinessType, type SellerBusinessDto } from "@bitego/shared";
import { fetchMyBusiness, updateMyBusiness } from "@/api/seller";
import { LocationPicker, type Coordinates } from "@/components/LocationPicker";
import { useAuth } from "@/features/auth/AuthProvider";
import { toFieldErrors } from "@/features/auth/formErrors";
import { color } from "@/features/listings/design";
import { apiFieldErrors, Btn, Chips, errorMessage, Field, FieldError, FormError, LoadError, Page, SectionTitle, SkeletonCards, TopBar } from "@/features/listings/kit";
import { BUSINESS_TYPE_LABELS } from "./ShopScreen";

export function EditShopScreen() {
  const router = useRouter();
  const { reload } = useAuth();
  const [shop, setShop] = useState<SellerBusinessDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<BusinessType | null>(null);
  const [description, setDescription] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [location, setLocation] = useState<Coordinates | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoadError(null);
    try {
      const b = await fetchMyBusiness();
      setShop(b);
      setName(b.name);
      setType(b.type);
      setDescription(b.description ?? "");
      setContactNo(b.contactNo);
      setEmail(b.email ?? "");
      setAddressLine(b.addressLine);
      setCity(b.city);
      setDistrict(b.district ?? "");
      setLocation({ latitude: b.latitude, longitude: b.longitude });
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setFormError(null);
    const parsed = updateBusinessSchema.safeParse({
      name,
      type: type ?? undefined,
      description: description.trim() || null,
      contactNo,
      email: email.trim() || null,
      addressLine,
      city,
      district: district.trim() || null,
      latitude: location?.latitude,
      longitude: location?.longitude,
    });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updateMyBusiness(parsed.data);
      await reload(); // The shop name appears on other screens.
      router.back();
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <Page>
        <TopBar title="Edit shop" />
        <LoadError message={loadError} onRetry={() => void load()} />
      </Page>
    );
  }
  if (!shop) {
    return (
      <Page>
        <TopBar title="Edit shop" />
        <SkeletonCards count={2} />
      </Page>
    );
  }

  return (
    <Page
      footer={
        <>
          <FormError>{formError}</FormError>
          <Btn title="Save changes" loading={saving} onPress={() => void save()} />
        </>
      }
    >
      <TopBar title="Edit shop" />

      <Text style={styles.sectionFirst}>Business details</Text>
      <Field label="Business name" icon="store" value={name} onChangeText={setName} error={errors.name} placeholder="Business name" />
      <Chips label="Business type" options={BUSINESS_TYPES.map((t) => ({ value: t, label: BUSINESS_TYPE_LABELS[t] }))} value={type} onChange={setType} error={errors.type} />
      <Field label="Description" optional multiline value={description} onChangeText={setDescription} error={errors.description} placeholder="Tell buyers about your shop" />

      <SectionTitle>Contact</SectionTitle>
      <Field label="Contact number" icon="phone" keyboardType="phone-pad" value={contactNo} onChangeText={setContactNo} error={errors.contactNo} placeholder="0771234567" />
      <Field label="Business email" optional icon="mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={errors.email} placeholder="shop@example.com" />

      <SectionTitle>Shop location</SectionTitle>
      <Field label="Address" icon="pin" value={addressLine} onChangeText={setAddressLine} error={errors.addressLine} placeholder="Street and number" />
      <Field label="City" autoCapitalize="words" value={city} onChangeText={setCity} error={errors.city} placeholder="City" />
      <Field label="District" optional autoCapitalize="words" value={district} onChangeText={setDistrict} error={errors.district} placeholder="District" />
      <Text style={styles.mapHint}>Buyers use this pin to find you and to see how far away you are.</Text>
      <LocationPicker value={location} onChange={setLocation} error={errors.latitude} />
      <FieldError>{errors.longitude}</FieldError>
    </Page>
  );
}

const styles = StyleSheet.create({
  sectionFirst: { fontSize: 16, fontWeight: "700", color: color.text, letterSpacing: -0.3 },
  mapHint: { fontSize: 13, lineHeight: 18, color: color.muted, marginTop: 16, marginBottom: 4 },
});
