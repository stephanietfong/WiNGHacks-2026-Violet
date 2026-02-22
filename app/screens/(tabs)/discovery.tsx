// app/screens/tabs/discovery.tsx
import { BottomNav } from "@/components/bottom-nav";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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

type DiscoveryProfile = {
  userId: string;
  email?: string;
  profile?: {
    firstName?: string;
    age?: number;
    pronouns?: string;
    heightInches?: number;
    photos?: Photo[];
  };
  interests?: string[];
  preferences?: {
    relationshipType?: string;
  };
  matchStatus?: "pending" | "matched" | "blocked";
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

const API_FALLBACK_URLS = Array.from(
  new Set(
    [
      API_BASE_URL,
      process.env.IP ? `http://${process.env.IP}:3000` : null,
      "http://localhost:3000",
    ].filter((value): value is string => Boolean(value)),
  ),
);

const formatHeight = (inches?: number) => {
  if (!inches || inches <= 0) return "Not set";
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}' ${remainingInches}\"`;
};

export default function Discovery() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!resolvedUserId) return;

      setLoading(true);
      try {
        for (const baseUrl of API_FALLBACK_URLS) {
          let response: Response;
          try {
            response = await fetch(`${baseUrl}/discovery/${resolvedUserId}/profiles`);
          } catch {
            continue;
          }

          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          setProfiles(Array.isArray(data?.profiles) ? data.profiles : []);
          setCurrentIndex(0);
          return;
        }

        setProfiles([]);
      } catch {
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [resolvedUserId]);

  const currentProfile = profiles[currentIndex] ?? null;

  const handleAction = async (status: "blocked" | "pending") => {
    if (!resolvedUserId || !currentProfile || saving) return;

    try {
      setSaving(true);
      setActionError(null);
      let requestFailed = true;

      for (const baseUrl of API_FALLBACK_URLS) {
        let response: Response;
        try {
          response = await fetch(`${baseUrl}/matches/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actorUserId: resolvedUserId,
              targetUserId: currentProfile.userId,
              status,
            }),
          });
        } catch {
          continue;
        }

        if (!response.ok) {
          continue;
        }

        requestFailed = false;
        setCurrentIndex((prev) => prev + 1);
        return;
      }

      if (requestFailed) {
        setActionError("Could not save your action. Please try again.");
      }
    } catch {
      setActionError("Could not save your action. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FE9FB8", "#FFC198"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.text}>Discovery</Text>
        </View>

        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color="#333" />
            <Text style={styles.statusText}>Loading profiles...</Text>
          </View>
        ) : !currentProfile ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>No more profiles right now.</Text>
          </View>
        ) : (
          <View style={styles.box}>
            {currentProfile.profile?.photos?.[0]?.url ? (
              <Image
                source={{ uri: currentProfile.profile.photos[0].url }}
                style={styles.coverPhoto}
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text style={styles.placeholderText}>No profile photo yet</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.name}>
                {currentProfile.profile?.firstName || "Unknown"}
                {currentProfile.profile?.age ? `, ${currentProfile.profile.age}` : ""}
              </Text>
              {!!currentProfile.profile?.pronouns && (
                <Text style={styles.subText}>{currentProfile.profile.pronouns}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.fieldLine}>
                Height: {formatHeight(currentProfile.profile?.heightInches)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <Text style={styles.fieldLine}>
                {currentProfile.interests?.length
                  ? currentProfile.interests.join(" • ")
                  : "No interests selected"}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <Text style={styles.fieldLine}>
                Looking for: {currentProfile.preferences?.relationshipType || "Not set"}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction("blocked")}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Image
                  source={require("../../../assets/images/xicon.png")}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction("pending")}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Image
                  source={require("../../../assets/images/checkicon.png")}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>
            </View>

            {saving && (
              <View style={styles.savingRow}>
                <ActivityIndicator color="#333" />
                <Text style={styles.savingText}>Saving...</Text>
              </View>
            )}

            {!!actionError && (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{actionError}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="discovery" userId={resolvedUserId} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
  },
  content: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 35,
    fontWeight: "bold",
  },
  statusBox: {
    width: "98%",
    height: 620,
    backgroundColor: "rgba(251, 233, 222, 0.6)",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  box: {
    width: "98%",
    backgroundColor: "rgba(251, 233, 222, 0.65)",
    borderRadius: 18,
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
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingTop: 12,
    paddingBottom: 16,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 16,
  },
  savingText: {
    color: "#333",
    fontWeight: "600",
  },
  errorRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  errorText: {
    color: "#8a1f1f",
    fontWeight: "600",
    textAlign: "center",
  },
});
