import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RootStackParamList } from "@/types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "about">;

export default function AboutScreen({ navigation }: Props) {
  const logoImage = require("../../assets/images/logo.png");
  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <Image source={logoImage} />
        <View style={[styles.textContainer, styles.introText]}>
          <ThemedText type="subtitle" style={styles.introText}>
            Finally, a Space Just for Women.
          </ThemedText>
          <ThemedText type="default" style={styles.introText}>
            In a world of endless swipes and cluttered platforms, finding a
            genuine connection shouldn’t feel like an uphill battle. We built
            Violet because we believe the lesbian community deserves a digital
            home that is as safe as it is soulful. We aren&apos;t just another
            dating app; we are a dedicated space designed to protect your peace,
            your identity, and your time.
          </ThemedText>
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="subtitle">
            Authenticity is Our North Star
          </ThemedText>
          <ThemedText type="default">
            Tired of &quot;hey&quot; messages from bots or wondering if the
            person behind the profile is real? We’ve built a fortress around our
            community to ensure that when you see a face, there’s a real person
            behind it. Verified by Design: Every member undergoes ID
            verification that must match their profile photos. The Solo-Shot
            Standard: Our AI requires a mandatory solo picture to
            cross-reference with your ID. No more guessing games with group
            shots or outdated photos. Academic Accountability: We offer .edu
            email verification to help foster a community of peers.
          </ThemedText>
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="subtitle">
            A Space for Monogamous Connection
          </ThemedText>
          <ThemedText type="default">
            A Space for Monogamous Connection We respect every lifestyle, but we
            know how exhausting it is to navigate &quot;unicorn hunters&quot;
            and couples when you’re looking for a one-on-one connection. To keep
            our mission clear, we’ve implemented proactive monitoring for
            polyamorous and &quot;third-party&quot; keywords. We filter for
            certain terms to ensure our space remains dedicated to women seeking
            women.
          </ThemedText>
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="subtitle">Your Safety, Simplified</ThemedText>
          <ThemedText type="default">
            Digital safety shouldn&apos;t be a luxury. We’ve prioritized
            &quot;Cyber Safe&quot; architecture to keep your data private and
            your interactions secure. Account Pausing: Need a break? Instead of
            deleting your progress, you can pause your account to disappear from
            the stack while you focus on yourself (or a new connection). Age
            Gated: Strict age restrictions ensure that our community remains a
            mature, peer-to-peer environment. Always Free: We believe love and
            community shouldn&apos;t be hidden behind a paywall. Violet is a
            free resource.
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("landing")}
        >
          <Text style={styles.buttonText}>Let&apos;s Get Started!</Text>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  textContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  introText: {
    width: "100%",
    textAlign: "center",
  },
  button: {
    backgroundColor: "rgba(168, 147, 206, 1)",
    marginTop: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
