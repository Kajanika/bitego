import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MAX_LISTING_IMAGES } from "@bitego/shared";
import { color } from "./design";
import { Icon } from "./Icon";
import { errorMessage, FieldError } from "./kit";

export type PhotoItem = { id: string; uri: string };

// The listing form's photo row: take a photo or pick one, shown as thumbnails with a remove button.
// `onAdd` uploads the photo, and this component shows the progress and any error.
export function PhotoPicker({
  photos,
  onAdd,
  onRemove,
}: {
  photos: PhotoItem[];
  onAdd: (asset: ImagePicker.ImagePickerAsset) => Promise<void>;
  onRemove: (photo: PhotoItem) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function pick(source: "camera" | "library") {
    setError(undefined);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError("Camera permission was denied. Allow it in your phone settings, or choose a photo from your gallery.");
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [4, 3] };
      const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      setBusy(true);
      await onAdd(result.assets[0]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(photo: PhotoItem) {
    setError(undefined);
    setBusy(true);
    try {
      await onRemove(photo);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const full = photos.length >= MAX_LISTING_IMAGES;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {photos.map((p) => (
          <View key={p.id} style={styles.thumb}>
            <Image source={{ uri: p.uri }} style={styles.thumbImage} accessibilityLabel="Food photo" />
            <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" disabled={busy} hitSlop={6} onPress={() => void remove(p)} style={styles.remove}>
              <Icon name="close" size={13} color="#fff" />
            </Pressable>
          </View>
        ))}
        {busy ? <View style={[styles.thumb, styles.busy]}><ActivityIndicator color={color.primary} /></View> : null}
      </View>
      {full ? null : (
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void pick("camera")} style={({ pressed }) => [styles.action, pressed && styles.pressed, busy && styles.off]}>
            <Icon name="camera" size={20} color={color.primary} />
            <Text style={styles.actionText}>Take photo</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void pick("library")} style={({ pressed }) => [styles.action, pressed && styles.pressed, busy && styles.off]}>
            <Icon name="image" size={20} color={color.primary} />
            <Text style={styles.actionText}>From gallery</Text>
          </Pressable>
        </View>
      )}
      <FieldError>{error}</FieldError>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  thumb: { width: 88, height: 88, borderRadius: 13, overflow: "hidden", backgroundColor: color.tintSoft },
  thumbImage: { width: "100%", height: "100%" },
  busy: { alignItems: "center", justifyContent: "center" },
  remove: { position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(40,20,8,0.65)", alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: 9 },
  action: { flex: 1, minHeight: 72, gap: 5, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: color.light, backgroundColor: color.tintSoft, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: 13, fontWeight: "600", color: color.primary },
  pressed: { opacity: 0.8 },
  off: { opacity: 0.45 },
});
