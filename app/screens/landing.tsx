import { ThemedText } from "@/components/themed-text";
import { RootStackParamList } from "@/types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "landing">;

export default function LandingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <ThemedText type="title">CampusConnect 💕</ThemedText>

      <ThemedText type="subtitle">Meet students at your university</ThemedText>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("login")}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => navigation.navigate("signup")}
      >
        <ThemedText type="default">Sign Up</ThemedText>
      </TouchableOpacity>
    </View>
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

  button: {
    backgroundColor: "#ff5a5f",
    padding: 15,
    width: "80%",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  outlineButton: {
    borderWidth: 2,
    borderColor: "#ff5a5f",
    padding: 15,
    width: "80%",
    borderRadius: 10,
    alignItems: "center",
  },

  outlineText: {
    color: "#ff5a5f",
    fontSize: 16,
    fontWeight: "bold",
  },
});
