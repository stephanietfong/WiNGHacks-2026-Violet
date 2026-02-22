import { AuthToggle } from "@/components/auth-toggle";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "@react-navigation/native";
import { router } from "expo-router";
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

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Invalid credentials, please try again");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Invalid credentials, please try again");
        return;
      }

      // Save token
      console.log("JWT:", data.token);

      // Navigate to discovery
      router.replace({
        pathname: "/screens/(tabs)/discovery",
        params: { userId: String(data.userId) },
      });
    } catch {
      Alert.alert("Network error");
    }
  }

  return (
    <ThemedView style={styles.container}>
      <AuthToggle
        active="login"
        onLoginPress={() => {}}
        onSignupPress={() => router.push("/screens/(auth)/signup")}
      />

      <View style={styles.inputContainerAndButton}>
        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold">Email address</ThemedText>
          <TextInput
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
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
        <Link screen="forgotpassword" params={{}} style={styles.link}>
          <ThemedText type="link">Forgot your password?</ThemedText>
        </Link>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
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
