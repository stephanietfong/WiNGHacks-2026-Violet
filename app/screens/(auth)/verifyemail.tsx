import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RootStackParamList } from "@/types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

type Props = NativeStackScreenProps<RootStackParamList, "verifyemail">;

export default function VerifyEmailScreen({ navigation }: Props) {
  const { userId } = useLocalSearchParams();
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;
  const [code, setCode] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const router = useRouter();

  const handleVerification = async () => {
    if (!resolvedUserId) {
      Alert.alert(
        "Session Error",
        "Missing user information. Please sign up again.",
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/verifyemail/${resolvedUserId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        router.push({
          pathname: "/screens/setup",
          params: { userId: data.userId ?? resolvedUserId },
        });
      } else {
        setStatus("Please try again.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Could not connect to the server.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.text}>
        Verify Email
      </ThemedText>
      <ThemedText type="default" style={styles.text}>
        We have sent a 6-digit verification code to your email. Please enter the
        code below.
      </ThemedText>
      <TextInput
        placeholder="Verification Code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <ThemedText style={styles.text}>{status}</ThemedText>
      <TouchableOpacity style={styles.button} onPress={handleVerification}>
        <Text style={styles.buttonText}>Verify Email</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    padding: 20,
    gap: 20,
  },
  text: {
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "rgba(168, 147, 206, 1)",
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
