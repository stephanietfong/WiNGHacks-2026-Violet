import { BottomNav } from "@/components/bottom-nav";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

type Photo = {
  url: string;
  publicId?: string;
  isVerificationPhoto?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { userId, photos } = params;
  const [remotePhotos, setRemotePhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;

  const parsedPhotosFromParams = useMemo(() => {
    const raw = Array.isArray(photos) ? photos[0] : photos;
    if (!raw) return [] as Photo[];

    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [photos]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!resolvedUserId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/users/${resolvedUserId}/photos`,
        );

        if (!response.ok) return;
        const data = await response.json();
        setRemotePhotos(Array.isArray(data) ? data : []);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [resolvedUserId]);

  const allPhotos =
    remotePhotos.length > 0 ? remotePhotos : parsedPhotosFromParams;
  const firstPhoto = allPhotos[0]?.url;

  return (
    <LinearGradient
      colors={["#FE9FB8", "#FFC198"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.settingsButton, { top: insets.top - 33 }]}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/screens/(tabs)/settings",
              params,
            })
          }
        >
          <Image
            source={require("../../../assets/images/settingicon.png")}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/screens/(tabs)/viewprofile",
              params,
            })
          }
        >
          {firstPhoto ? (
            <Image source={{ uri: firstPhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              {loading ? (
                <ActivityIndicator color="#333" />
              ) : (
                <Text style={styles.avatarFallbackText}>View Profile</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.safetyText}>Safety</Text>
        <View style={styles.safetyLine} />

        <View style={styles.safetyLinksContainer}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/screens/(info)/bannedlist",
                params,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.safetyLinkText}>Banned words</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/screens/(info)/communityguidelines",
                params,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.safetyLinkText}>Community guidelines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/screens/(info)/reportaccount",
                params,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.safetyLinkText}>How to report an account</Text>
          </TouchableOpacity>
        </View>
      </View>
      <BottomNav activeTab="profile" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 120,
    paddingTop: "22%",
  },
  settingsButton: {
    position: "absolute",
    right: 18,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  settingsIcon: {
    width: 26,
    height: 26,
  },
  avatarButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: "hidden",
    backgroundColor: "rgba(251, 233, 222, 0.7)",
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.12)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  safetyText: {
    position: "absolute",
    top: "62%",
    fontSize: 28,
    fontWeight: "500",
    color: "#111",
  },
  safetyLine: {
    position: "absolute",
    top: "69%",
    width: "72%",
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  safetyLinksContainer: {
    position: "absolute",
    top: "72%",
    alignItems: "center",
    gap: 10,
  },
  safetyLinkText: {
    fontSize: 16,
    color: "#111",
    textDecorationLine: "underline",
  },
});
