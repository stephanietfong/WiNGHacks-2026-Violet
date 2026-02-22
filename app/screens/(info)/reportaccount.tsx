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

export default function ReportAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <LinearGradient
      colors={["#FE9FB8", "#FFC198"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text selectable style={styles.title}>
            How to report an account
          </Text>

          <Text selectable style={styles.paragraph}>
            If you encounter a profile or message that violates our safety
            standards, please follow these steps to ensure our moderation team
            can take swift action:
          </Text>

          <Text selectable style={styles.stepTitle}>
            Document the Evidence:
          </Text>
          <Text selectable style={styles.paragraph}>
            Take a clear screenshot of the profile, bio, or message that
            violates our guidelines (especially for "Unicorn Hunting" or
            Harassment).
          </Text>

          <Text selectable style={styles.stepTitle}>
            Identify the User:
          </Text>
          <Text selectable style={styles.paragraph}>
            Note the user's First Name and any specific details (like their
            university or age) shown on their profile.
          </Text>

          <Text selectable style={styles.stepTitle}>
            Send the Report:
          </Text>
          <Text selectable style={styles.paragraph}>
            Email our safety team at:
          </Text>
          <Text selectable style={styles.email}>
            winghacks2026violet@gmail.com
          </Text>

          <Text selectable style={styles.stepTitle}>
            Use a Clear Subject Line:
          </Text>
          <Text selectable style={styles.paragraph}>
            To help us sort reports by urgency, please use this format:
          </Text>
          <Text selectable style={styles.subjectLine}>
            REPORT - [Guideline Violated] - [User Name]
          </Text>
          <Text selectable style={styles.paragraph}>
            Example: REPORT - Unicorn Hunter - Sarah
          </Text>

          <Text selectable style={styles.stepTitle}>
            What Happens Next?
          </Text>
          <Text selectable style={styles.paragraph}>
            Our team reviews every email. If a violation is confirmed, the
            account will be permanently removed within 24 hours.
          </Text>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 23,
    paddingHorizontal: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
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
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#222",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  subjectLine: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
});
