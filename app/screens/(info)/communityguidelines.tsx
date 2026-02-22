import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const guidelines = [
  {
    title: "Authenticity is Key",
    desc: "Only use your own photos. Catfishing or impersonating others results in an immediate ban.",
  },
  {
    title: ".edu Verified Only",
    desc: "Our community is for university students. Keep the space safe for peers; no outside solicitation.",
  },
  {
    title: "Respect & Kindness",
    desc: "We have a zero-tolerance policy for hate speech, bullying, or harassment based on identity.",
  },
  {
    title: "Consent Matters",
    desc: "Respect boundaries both in chat and in person. 'No' means 'No', and 'Maybe' also means 'No'.",
  },
  {
    title: "Keep it Safe",
    desc: "Don't share sensitive personal info (like your exact dorm address) too early. Meet in public campus spots.",
  },
  {
    title: "What happens on Violet stays on Violet",
    desc: "Respect the privacy of others. Sharing screenshots of profiles or private conversations outside of the app is strictly prohibited.",
  },
  {
    title: "One account per student",
    desc: "Users are allowed one verified account linked to their .edu email. Multi-accounting or sharing login credentials compromises the security of the whole campus network.",
  },
  {
    title: "Zero Tolerance for Commercial Content",
    desc: "Violet is for making connections, not sales. Profiles used for advertising, solicitation, or commercial promotion will be removed.",
  },
];

export default function CommunityGuidelinesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

        <Text style={styles.title}>Community guidelines</Text>

        <View style={styles.listContainer}>
          {guidelines.map((item) => (
            <View key={item.title} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
          ))}
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
  listContainer: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "rgba(251, 233, 222, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: "#222",
  },
});
