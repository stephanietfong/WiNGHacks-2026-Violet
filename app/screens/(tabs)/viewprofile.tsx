import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Photo = {
  url: string;
  publicId?: string;
  isVerificationPhoto?: boolean;
};

type ProfileData = {
  firstName?: string;
  age?: number;
  pronouns?: string;
  heightInches?: number;
  phone?: string;
  photos?: Photo[];
  bannedWords?: string[];
};

type UserPayload = {
  userId: string;
  email?: string;
  profile?: ProfileData;
  interests?: string[];
  preferences?: {
    minAge?: number;
    maxAge?: number;
    distanceMiles?: number;
    relationshipType?: string;
  };
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

const formatHeight = (inches?: number) => {
  if (!inches || inches <= 0) return "Not set";
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}' ${remainingInches}\"`;
};

export default function ViewProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserPayload | null>(null);

  const resolvedUserId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const fallbackPhotos = useMemo(() => {
    const raw = Array.isArray(params.photos) ? params.photos[0] : params.photos;
    if (!raw) return [] as Photo[];

    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.photos]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!resolvedUserId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/users/${resolvedUserId}/profile`,
        );

        if (!response.ok) return;

        const data = await response.json();
        setUser(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [resolvedUserId]);

  const photos = user?.profile?.photos?.length
    ? user.profile.photos
    : fallbackPhotos;
  const coverPhoto = photos[0]?.url;

  return (
    <LinearGradient
      colors={["#FE9FB8", "#FFC198"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
        style={{ flexDirection: "row", alignItems: "center" }}
        >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push({
              pathname: "/screens/(tabs)/profile",
              params,
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/screens/(tabs)/editprofile")}> 
            <Image
              source={require("../../../assets/images/edit-icon.png")}
              style={{ width: 30, height: 30, marginLeft: 260, marginBottom: 7 }}
            />
        </TouchableOpacity>
        </View>
        <Text style={styles.title}>Your Public Profile</Text>

        <View style={styles.profileCard}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <View style={styles.coverPlaceholder}>
              {loading ? (
                <ActivityIndicator color="#333" />
              ) : (
                <Text style={styles.placeholderText}>No profile photo yet</Text>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.name}>
              {user?.profile?.firstName || "Unknown"}
              {user?.profile?.age ? `, ${user.profile.age}` : ""}
            </Text>
            {!!user?.profile?.pronouns && (
              <Text style={styles.subText}>{user.profile.pronouns}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.fieldLine}>
              Height: {formatHeight(user?.profile?.heightInches)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <Text style={styles.fieldLine}>
              {user?.interests?.length
                ? user.interests.join(" • ")
                : "No interests selected"}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <Text style={styles.fieldLine}>
              Looking for: {user?.preferences?.relationshipType || "Not set"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 28,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(251, 233, 222, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  backButtonText: {
    color: "#222",
    fontWeight: "600",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 12,
    color: "#222",
  },
  profileCard: {
    borderRadius: 18,
    backgroundColor: "rgba(251, 233, 222, 0.65)",
    overflow: "hidden",
  },
  coverPhoto: {
    width: "100%",
    height: 360,
  },
  coverPlaceholder: {
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3dfd1",
  },
  placeholderText: {
    color: "#555",
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
  },
  name: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  subText: {
    marginTop: 2,
    fontSize: 17,
    color: "#444",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#1a1a1a",
  },
  fieldLine: {
    fontSize: 16,
    color: "#2e2e2e",
    lineHeight: 24,
  },
});
