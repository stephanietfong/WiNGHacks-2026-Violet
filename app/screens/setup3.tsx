import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

export interface PhotoData {
  uri: string;
  url?: string;
  isVerificationPhoto: boolean;
}

export default function PhotoSetup() {
  const router = useRouter();
  const {
    userId,
    firstName,
    phone,
    age,
    selectedFeet,
    selectedInches,
    heightLabel,
    interests,
    minAge,
    maxAge,
    distanceMiles,
    relationshipType,
    locationPermission,
    latitude,
    longitude,
    photos: photosParam,
  } = useLocalSearchParams();

  const readParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const parsePhotosParam = (
    value: string | string[] | undefined,
  ): PhotoData[] => {
    const raw = readParam(value);
    if (!raw) return [];

    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (item) =>
            item &&
            typeof item.uri === "string" &&
            typeof item.isVerificationPhoto === "boolean",
        )
        .map((item) => ({
          uri: item.uri,
          url: typeof item.url === "string" ? item.url : undefined,
          isVerificationPhoto: item.isVerificationPhoto,
        }));
    } catch {
      return [];
    }
  };

  const resolvedUserId = readParam(userId) ?? "";

  const [photos, setPhotos] = useState<PhotoData[]>(
    parsePhotosParam(photosParam),
  );
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const serializedPhotos =
      photos.length > 0 ? encodeURIComponent(JSON.stringify(photos)) : "";

    router.setParams({
      userId: resolvedUserId,
      firstName: readParam(firstName) ?? "",
      phone: readParam(phone) ?? "",
      age: readParam(age) ?? "",
      selectedFeet: readParam(selectedFeet) ?? "",
      selectedInches: readParam(selectedInches) ?? "",
      heightLabel: readParam(heightLabel) ?? "",
      interests: readParam(interests) ?? "",
      minAge: readParam(minAge) ?? "",
      maxAge: readParam(maxAge) ?? "",
      distanceMiles: readParam(distanceMiles) ?? "",
      relationshipType: readParam(relationshipType) ?? "",
      locationPermission: readParam(locationPermission) ?? "",
      latitude: readParam(latitude) ?? "",
      longitude: readParam(longitude) ?? "",
      photos: serializedPhotos,
    });
  }, [
    age,
    distanceMiles,
    firstName,
    heightLabel,
    interests,
    latitude,
    locationPermission,
    longitude,
    maxAge,
    minAge,
    phone,
    photos,
    relationshipType,
    resolvedUserId,
    router,
    selectedFeet,
    selectedInches,
  ]);

  const CLOUDINARY_CLOUD_NAME = "dnug5q7e1"; // Replace with your Cloudinary cloud name
  const CLOUDINARY_UPLOAD_PRESET = "violetpics1"; // Replace with your upload preset

  // Pick an image from library
  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert("Limit Reached", "You can only upload up to 6 photos");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const newPhoto: PhotoData = {
          uri: result.assets[0].uri,
          isVerificationPhoto: photos.length === 0, // First photo is verification photo
        };
        setPhotos([...photos, newPhoto]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Upload to Cloudinary
  const uploadToCloudinary = async (
    photo: PhotoData,
    userId: string,
  ): Promise<{ url: string; publicId: string }> => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const publicId = `users/${userId}/photo-${timestamp}-${randomId}`;

    const formData = new FormData();
    formData.append("file", {
      uri: photo.uri,
      type: "image/jpeg",
      name: `photo_${timestamp}.jpg`,
    } as any);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("public_id", publicId); // Add naming convention

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message || "Failed to upload to Cloudinary",
        );
      }

      if (data?.secure_url) {
        return { url: data.secure_url, publicId };
      }

      if (data?.url) {
        return { url: data.url, publicId };
      }

      if (data?.public_id) {
        return {
          url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${data.public_id}`,
          publicId,
        };
      }

      throw new Error("Cloudinary did not return a usable image URL");
    } catch (error) {
      throw new Error("Failed to upload to Cloudinary");
    }
  };

  // Handle deletion with confirmation for verification photo
  const handleDeletePhoto = (index: number) => {
    const photo = photos[index];
    if (photo.isVerificationPhoto) {
      setDeleteConfirmIndex(index);
    } else {
      removePhoto(index);
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    // Ensure first photo is always verification photo
    if (newPhotos.length > 0) {
      newPhotos[0].isVerificationPhoto = true;
    }
    setPhotos(newPhotos);
    setDeleteConfirmIndex(null);
  };

  // Submit photos
  const handleNext = async () => {
    if (!resolvedUserId) {
      Alert.alert(
        "Session Error",
        "Missing user information. Please create your account again.",
      );
      return;
    }

    if (photos.length === 0) {
      Alert.alert("No Photos", "Please upload at least one photo");
      return;
    }

    const verificationPhoto = photos.find((p) => p.isVerificationPhoto);
    if (!verificationPhoto) {
      Alert.alert(
        "Verification Photo Required",
        "Please ensure the first photo is marked for verification",
      );
      return;
    }

    setUploading(true);

    try {
      // Upload all photos to Cloudinary
      const uploadedPhotos = await Promise.all(
        photos.map(async (photo) => {
          const { url, publicId } = await uploadToCloudinary(
            photo,
            resolvedUserId,
          );
          return {
            url,
            publicId,
            isVerificationPhoto: photo.isVerificationPhoto,
          };
        }),
      );

      // Save to backend
      const response = await fetch(
        `${API_BASE_URL}/setup/page-3/${resolvedUserId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photos: uploadedPhotos }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Photos uploaded!", [
          {
            text: "OK",
            onPress: () => {
              router.push({
                pathname: "/screens/(tabs)/discovery" as any,
                params: {
                  userId: resolvedUserId,
                  firstName: readParam(firstName) ?? "",
                  phone: readParam(phone) ?? "",
                  age: readParam(age) ?? "",
                  selectedFeet: readParam(selectedFeet) ?? "",
                  selectedInches: readParam(selectedInches) ?? "",
                  heightLabel: readParam(heightLabel) ?? "",
                  interests: readParam(interests) ?? "",
                  minAge: readParam(minAge) ?? "",
                  maxAge: readParam(maxAge) ?? "",
                  distanceMiles: readParam(distanceMiles) ?? "",
                  relationshipType: readParam(relationshipType) ?? "",
                  locationPermission: readParam(locationPermission) ?? "",
                  latitude: readParam(latitude) ?? "",
                  longitude: readParam(longitude) ?? "",
                  photos:
                    photos.length > 0
                      ? encodeURIComponent(JSON.stringify(photos))
                      : "",
                },
              });
            },
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to save photos");
      }
    } catch (error) {
      Alert.alert("Upload Error", "Failed to upload photos to Cloudinary");
    } finally {
      setUploading(false);
    }
  };

  return (
    <LinearGradient colors={["#FE9FB8", "#FEB2AB"]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Add Photos</Text>
        <Text style={styles.subtitle}>Upload 1-6 photos.</Text>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              {photo.isVerificationPhoto && (
                <View style={styles.verificationBadge}>
                  <Text style={styles.verificationText}>ID VERIFY</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(index)}
              >
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < 6 && (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={pickImage}
              disabled={uploading}
            >
              <View style={styles.addPhotoIconCircle}>
                <Text style={styles.addPhotoIcon}>+</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.photoCount}>
          {photos.length}/6 photos ({6 - photos.length} remaining)
        </Text>

        {photos.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Add a clear photo of only yourself for your first image. This will
              be used to verify your account.
            </Text>
          </View>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteConfirmIndex !== null}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmDialog}>
              <Text style={styles.confirmTitle}>
                Delete Verification Photo?
              </Text>
              <Text style={styles.confirmMessage}>
                This photo is used to verify your account. The verified badge
                will be removed from your profile until you choose a new photo
                to use for ID verification.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setDeleteConfirmIndex(null)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={() =>
                    deleteConfirmIndex !== null &&
                    removePhoto(deleteConfirmIndex)
                  }
                >
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push({
              pathname: "/screens/setup2" as any,
              params: {
                userId: resolvedUserId,
                firstName: readParam(firstName) ?? "",
                phone: readParam(phone) ?? "",
                age: readParam(age) ?? "",
                selectedFeet: readParam(selectedFeet) ?? "",
                selectedInches: readParam(selectedInches) ?? "",
                heightLabel: readParam(heightLabel) ?? "",
                interests: readParam(interests) ?? "",
                minAge: readParam(minAge) ?? "",
                maxAge: readParam(maxAge) ?? "",
                distanceMiles: readParam(distanceMiles) ?? "",
                relationshipType: readParam(relationshipType) ?? "",
                locationPermission: readParam(locationPermission) ?? "",
                latitude: readParam(latitude) ?? "",
                longitude: readParam(longitude) ?? "",
                photos:
                  photos.length > 0
                    ? encodeURIComponent(JSON.stringify(photos))
                    : "",
              },
            })
          }
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, uploading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={uploading}
        >
          <Text style={styles.nextIcon}>{uploading ? "⋯" : "→"}</Text>
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    minHeight: "100%",
    overflow: "visible",
  },
  scroll: { flex: 1, overflow: "visible", zIndex: 20 },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  heading: {
    fontSize: 34,
    fontWeight: "700",
    marginTop: 36,
    marginBottom: 8,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#111",
    marginBottom: 24,
    opacity: 0.7,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  photoContainer: {
    width: "31%",
    aspectRatio: 1,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  verificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#7B4DE1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verificationText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  deleteButton: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  addPhotoButton: {
    width: "31%",
    aspectRatio: 0.6,
    borderRadius: 16,
    backgroundColor: "#E9C2BC",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#B88BD0",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoIcon: {
    fontSize: 28,
    lineHeight: 28,
    color: "#111",
    width: "100%",
    textAlign: "center",
    includeFontPadding: false,
  },
  photoCount: {
    fontSize: 12,
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
    opacity: 0.7,
  },
  emptyStateContainer: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDialog: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 14,
    color: "#111",
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  bottomRow: {
    position: "absolute",
    bottom: 96,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    elevation: 100,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "rgba(251, 233, 222, 0.5)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  dotActive: {
    backgroundColor: "#A893CE",
    width: 12,
    height: 12,
    borderRadius: 9,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A893CE",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 24,
    top: -65,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A893CE",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 24,
    top: -65,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextIcon: { fontSize: 24, color: "#000000" },
  backIcon: { fontSize: 24, color: "#000000" },
});
