import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface PhotoData {
  uri: string;
  url?: string;
  isVerificationPhoto: boolean;
}

export default function PhotoSetup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(
    null,
  );

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
  const uploadToCloudinary = async (photo: PhotoData): Promise<string> => {
    const formData = new FormData();
    formData.append("file", {
      uri: photo.uri,
      type: "image/jpeg",
      name: `photo_${Date.now()}.jpg`,
    } as any);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      return data.secure_url;
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
          const url = await uploadToCloudinary(photo);
          return {
            url,
            isVerificationPhoto: photo.isVerificationPhoto,
          };
        }),
      );

      // Save to backend
      const response = await fetch(
        `http://10.136.197.71:3000/setup/page-3/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photos: uploadedPhotos }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Navigate to verification page (or home if not built yet)
        Alert.alert("Success", "Photos uploaded!", [
          {
            text: "OK",
            onPress: () => {
              router.push({
                pathname: "messages" as any,
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
    <LinearGradient
      colors={["#FE9FB8", "#FEB2AB"]}
      style={[styles.gradient, { paddingTop: insets.top }]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Add Photos</Text>
        <Text style={styles.subtitle}>
          Upload 1-6 photos. The first photo will be used to verify your
          account.
        </Text>

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
              <Text style={styles.addPhotoIcon}>+</Text>
              <Text style={styles.addPhotoText}>Add Photo</Text>
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

        <View style={styles.bottomRow}>
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>

          <TouchableOpacity
            style={[styles.nextButton, uploading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={uploading}
          >
            <Text style={styles.nextIcon}>{uploading ? "⋯" : "→"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
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
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoIcon: {
    fontSize: 32,
    color: "#111",
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 11,
    color: "#111",
    fontWeight: "500",
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
    marginTop: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.71)",
  },
  dotActive: { backgroundColor: "#7B4DE1" },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A893CE",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextIcon: { fontSize: 24, color: "#000" },
});
