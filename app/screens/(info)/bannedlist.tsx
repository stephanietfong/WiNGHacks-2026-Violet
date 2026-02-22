import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

const DEFAULT_BANNED_WORDS = [
  "unicorn",
  "throuple",
  "threesome",
  "pineapple",
  "looking for a third",
];

export default function BannedListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [newWord, setNewWord] = useState("");
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const resolvedUserId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  useEffect(() => {
    const loadBannedWords = async () => {
      if (!resolvedUserId) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/users/${resolvedUserId}/profile`,
        );

        if (!response.ok) return;

        const data = await response.json();
        const words = Array.isArray(data?.profile?.bannedWords)
          ? data.profile.bannedWords
          : [];

        const customWords = words.filter(
          (word: string) => !DEFAULT_BANNED_WORDS.includes(word),
        );

        setBannedWords(customWords);
      } catch {}
    };

    loadBannedWords();
  }, [resolvedUserId]);

  const handleAddWord = () => {
    const normalized = newWord.trim().toLowerCase();
    if (!normalized) return;

    if (DEFAULT_BANNED_WORDS.includes(normalized)) {
      Alert.alert(
        "Default Protected",
        "That word is already enforced by Violet and cannot be changed.",
      );
      return;
    }

    if (bannedWords.includes(normalized)) {
      Alert.alert("Duplicate", "That word is already in your list.");
      return;
    }

    setBannedWords((prev) => [...prev, normalized]);
    setNewWord("");
  };

  const handleRemoveWord = (word: string) => {
    setBannedWords((prev) => prev.filter((item) => item !== word));
  };

  const handleSaveBannedWords = async () => {
    if (!resolvedUserId) {
      Alert.alert("Missing User", "Unable to find current user.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${resolvedUserId}/profile/banned-words`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bannedWords }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Update Failed",
          data?.message || "Could not save banned words.",
        );
        return;
      }

      const updatedWords = Array.isArray(data?.bannedWords)
        ? data.bannedWords
        : bannedWords;

      setBannedWords(
        updatedWords.filter(
          (word: string) => !DEFAULT_BANNED_WORDS.includes(word),
        ),
      );
      Alert.alert("Saved", "Your banned words were updated.");
    } catch {
      Alert.alert("Network Error", "Unable to save banned words.");
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push({
              pathname: "/screens/(tabs)/profile",
              params,
            })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Banned words</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Dedicated to Single-Connection Spaces
          </Text>

          <Text style={styles.sectionBody}>
            Violet is a community built for lesbian and queer students to find
            genuine, peer-to-peer connections. To ensure the safety and comfort
            of our users, we strictly prohibit "Unicorn Hunting"—the practice of
            couples seeking a "third" for their relationship.
          </Text>

          <Text style={styles.sectionBody}>
            Terms like "Unicorn," "Throuple," and "Pineapple" (a common code for
            swinging/couples) are banned from bios and messages. Our space is
            for you, not for your straight relationship's "experiment." Any
            account found to be a joint couple profile or seeking a third will
            be permanently removed.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your Profile Banned Words</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={newWord}
              onChangeText={setNewWord}
              placeholder="Add a word"
              placeholderTextColor="#777"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddWord}
              activeOpacity={0.85}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wordsWrap}>
            {bannedWords.length === 0 ? (
              <Text style={styles.emptyText}>No banned words added yet.</Text>
            ) : (
              bannedWords.map((word) => (
                <TouchableOpacity
                  key={word}
                  style={styles.wordChip}
                  onPress={() => handleRemoveWord(word)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.wordChipText}>{word} ×</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveBannedWords}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Banned Words"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 23,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(251, 233, 222, 0.8)",
    marginBottom: 14,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 14,
  },
  sectionCard: {
    borderRadius: 12,
    backgroundColor: "rgba(251, 233, 222, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#222",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: "#111",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  addButton: {
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  wordsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  wordChip: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wordChipText: {
    fontSize: 13,
    color: "#111",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
  },
  saveButton: {
    alignSelf: "flex-start",
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
