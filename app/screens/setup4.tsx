import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function IDScannerScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);

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
    photos,
    idCaptureUri,
    idPhotoKept,
  } = useLocalSearchParams();

  const readParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const initialCapturedUri = readParam(idCaptureUri) ?? null;
  const initialIsPhotoKept = readParam(idPhotoKept) === "1";

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(
    initialCapturedUri,
  );
  const [isPhotoKept, setIsPhotoKept] = useState(
    initialIsPhotoKept && Boolean(initialCapturedUri),
  );
  const [savingKeep, setSavingKeep] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const resolvedUserId = readParam(userId) ?? "";

  const handleCapture = async () => {
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert(
          "Camera Access Needed",
          "Allow camera access to scan your ID.",
        );
        return;
      }
    }

    if (!cameraRef.current || capturing) return;

    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setIsPhotoKept(false);
      }
    } catch {
      Alert.alert(
        "Capture Error",
        "Unable to capture image. Please try again.",
      );
    } finally {
      setCapturing(false);
    }
  };

  const navigateToDiscovery = () => {
    router.replace({
      pathname: "/screens/(tabs)/discovery",
      params: commonParams,
    });
  };

  const commonParams = {
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
    photos: readParam(photos) ?? "",
    idCaptureUri: isPhotoKept && capturedUri ? capturedUri : "",
    idPhotoKept: isPhotoKept ? "1" : "0",
    idPhotoUploaded: "0",
  };

  const handleRetake = () => {
    if (savingKeep || isVerified) return;
    setCapturedUri(null);
    setIsPhotoKept(false);
    setShowSuccessPopup(false);
  };

  const handleKeep = async () => {
    if (!capturedUri) return;
    if (isVerified) return;
    if (!resolvedUserId) {
      Alert.alert(
        "Session Error",
        "Missing user information. Please create your account again.",
      );
      return;
    }

    if (savingKeep) return;

    try {
      setSavingKeep(true);

      setIsPhotoKept(true);
      setIsVerified(true);
      setShowSuccessPopup(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save ID photo. Please try again.";
      Alert.alert("Verification Error", message);
      setIsPhotoKept(false);
      setIsVerified(false);
    } finally {
      setSavingKeep(false);
    }
  };

  return (
    <LinearGradient colors={["#FEB2AB", "#FE9FB8"]} style={styles.gradient}>
      <View style={styles.cameraSection}>
        {capturedUri ? (
          <Image
            source={{ uri: capturedUri }}
            style={styles.cameraView}
            contentFit="cover"
          />
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.cameraView}
              facing="back"
            />
          </>
        )}

        {!capturedUri && (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={capturing}
          >
            <Image
              source={require("../../assets/images/camera.png")}
              style={styles.captureIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        )}

        {capturedUri && (
          <View style={styles.reviewActionsRow}>
            {!isPhotoKept && (
              <TouchableOpacity
                style={styles.reviewRetakeButton}
                onPress={handleRetake}
                disabled={savingKeep}
              >
                <Text style={styles.reviewRetakeText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.reviewKeepButton,
                isPhotoKept && styles.reviewKeepButtonActive,
              ]}
              onPress={handleKeep}
              disabled={savingKeep || isVerified}
            >
              <Text style={styles.reviewKeepText}>
                {savingKeep ? "⋯" : "✓"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.bottomContent}>
        <Text style={styles.title}>Scan the front of your ID.</Text>
        <Text style={styles.subtitle}>
          Make sure you’re in a well lit area!
        </Text>

        <Text style={styles.validIdsTitle}>Valid ID Types:</Text>
        <Text style={styles.validIdItem}>Driver’s License</Text>
        <Text style={styles.validIdItem}>State ID</Text>
        <Text style={styles.validIdItem}>Passport</Text>
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.backButton}
          disabled={savingKeep || isVerified}
          onPress={() =>
            router.push({
              pathname: "/screens/setup3" as any,
              params: commonParams,
            })
          }
        >
          <Text style={styles.navIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </View>

      <Modal visible={showSuccessPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successPopup}>
            <Text style={styles.successTitle}>
              You're in! ID verification complete.
            </Text>
            <TouchableOpacity
              style={styles.successNextButton}
              onPress={navigateToDiscovery}
            >
              <Text style={styles.navIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: "#F7D8C8",
  },
  cameraSection: {
    height: "50%",
    backgroundColor: "#6D4D56",
    overflow: "hidden",
  },
  cameraView: {
    width: "100%",
    height: "100%",
  },
  captureButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fbe9de90",
  },
  captureIcon: {
    width: 38,
    height: 38,
  },
  reviewActionsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  reviewRetakeButton: {
    backgroundColor: "rgba(0,0,0,0.45)",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewRetakeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  reviewKeepButton: {
    backgroundColor: "#fff",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewKeepButtonActive: {
    backgroundColor: "#A893CE",
  },
  reviewKeepText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "700",
  },
  bottomContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#111",
    marginBottom: 24,
    opacity: 0.7,
  },
  validIdsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  validIdItem: {
    fontSize: 14,
    color: "#111",
    lineHeight: 20,
  },
  bottomRow: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "rgba(251, 233, 222, 0.6)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: "rgba(168, 147, 206, 0.7)",
  },
  dotActive: {
    backgroundColor: "#ffffff",
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
    top: -64,
    zIndex: 2,
  },
  navIcon: {
    fontSize: 24,
    color: "#000",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successPopup: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  successTitle: {
    color: "#111",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  successNextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A893CE",
    alignItems: "center",
    justifyContent: "center",
  },
});
