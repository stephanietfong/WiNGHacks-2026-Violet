import { AuthToggle } from "@/components/auth-toggle";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

export default function SignupScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const router = useRouter();

  const handleSignup = async () => {
    if (!email.endsWith(".edu")) {
      Alert.alert(
        "Authentication Error",
        "Please use a valid university (.edu) email.",
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert("Security", "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          verificationCode: code,
          verificationCodeExpires: expires,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success!");

        router.push({
          pathname: "/screens/(auth)/verifyemail",
          params: { userId: data.userId },
        });
      } else {
        Alert.alert("Signup Failed", data.message || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Could not connect to the server.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <AuthToggle
        active="signup"
        onLoginPress={() => router.push("/screens/(auth)/login")}
        onSignupPress={() => {}}
      />

      <View style={styles.inputContainerAndButton}>
        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">Email address *</ThemedText>
          <TextInput
            placeholder="School Email (.edu)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">Password</ThemedText>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">Confirm Password</ThemedText>

          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
      <ThemedText type="default" style={styles.link}>
        *Email addresses must be .edu emails
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignContent: "center",
    padding: 20,
  },
  inputContainerAndButton: {
    flex: 1,
    gap: 20,
  },
  inputContainer: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  link: {
    textAlign: "center",
  },
  button: {
    backgroundColor: "rgba(0, 0, 0, 1)",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
