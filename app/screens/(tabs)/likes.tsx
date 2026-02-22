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
};

type LikeProfile = {
  userId: string;
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

export default function LikesPage() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;

  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [likes, setLikes] = useState<LikeProfile[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!resolvedUserId) return;

      setLoading(true);
      setLoadError(null);
      try {
        for (const baseUrl of API_FALLBACK_URLS) {
          let response: Response;
          try {
            response = await fetch(`${baseUrl}/likes/${resolvedUserId}/incoming`);
          } catch {
            continue;
          }

          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          setLikes(Array.isArray(data?.likes) ? data.likes : []);
          return;
        }

        setLikes([]);
        setLoadError("Could not load incoming likes from server.");
      } catch {
        setLikes([]);
        setLoadError("Could not load incoming likes from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [resolvedUserId]);

  const handleAction = async (
    targetUserId: string,
    status: "blocked" | "matched",
  ) => {
    if (!resolvedUserId || savingUserId) return;

    setSavingUserId(targetUserId);
    try {
      for (const baseUrl of API_FALLBACK_URLS) {
        let response: Response;
        try {
          response = await fetch(`${baseUrl}/matches/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actorUserId: resolvedUserId,
              targetUserId,
              status,
            }),
          });
        } catch {
          continue;
        }

        if (!response.ok) {
          continue;
        }

        setLikes((previousLikes) =>
          previousLikes.filter((like) => like.userId !== targetUserId),
        );
        return;
      }
    } catch {
    } finally {
      setSavingUserId(null);
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
        <Text style={styles.title}>Likes</Text>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#333" />
            <Text style={styles.stateText}>Loading likes...</Text>
          </View>
        ) : likes.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{loadError || "No likes yet."}</Text>
          </View>
        ) : (
          likes.map((likedUser) => {
            const coverPhoto = likedUser.profile?.photos?.[0]?.url;

            return (
              <View key={likedUser.userId} style={styles.profileCard}>
                {coverPhoto ? (
                  <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Text style={styles.placeholderText}>No profile photo yet</Text>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.name}>
                    {likedUser.profile?.firstName || "Unknown"}
                    {likedUser.profile?.age ? `, ${likedUser.profile.age}` : ""}
                  </Text>
                  {!!likedUser.profile?.pronouns && (
                    <Text style={styles.subText}>{likedUser.profile.pronouns}</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.fieldLine}>
                    Height: {formatHeight(likedUser.profile?.heightInches)}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <Text style={styles.fieldLine}>
                    {likedUser.interests?.length
                      ? likedUser.interests.join(" • ")
                      : "No interests selected"}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Preferences</Text>
                  <Text style={styles.fieldLine}>
                    Looking for: {likedUser.preferences?.relationshipType || "Not set"}
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction(likedUser.userId, "blocked")}
                    disabled={savingUserId === likedUser.userId}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={require("../../../assets/images/xicon.png")}
                      style={styles.actionIcon}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction(likedUser.userId, "matched")}
                    disabled={savingUserId === likedUser.userId}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={require("../../../assets/images/checkicon.png")}
                      style={styles.actionIcon}
                    />
                  </TouchableOpacity>
                </View>

                {savingUserId === likedUser.userId && (
                  <View style={styles.savingRow}>
                    <ActivityIndicator color="#333" />
                    <Text style={styles.savingText}>Saving...</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <BottomNav activeTab="likes" userId={resolvedUserId} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 120,
    gap: 12,
  },
  title: {
    fontSize: 35,
    fontWeight: "700",
    color: "#222",
  },
  stateBox: {
    width: "100%",
    minHeight: 220,
    borderRadius: 18,
    backgroundColor: "rgba(251, 233, 222, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
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
});
