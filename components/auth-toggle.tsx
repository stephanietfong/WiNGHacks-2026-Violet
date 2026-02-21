import { Pressable, StyleSheet, Text, View } from "react-native";

type AuthToggleProps = {
  active: "login" | "signup";
  onLoginPress: () => void;
  onSignupPress: () => void;
};

export function AuthToggle({
  active,
  onLoginPress,
  onSignupPress,
}: AuthToggleProps) {
  return (
    <View style={styles.container}>
      {/* Login */}
      <Pressable
        style={[styles.tab, active === "login" && styles.activeTab]}
        onPress={onLoginPress}
      >
        <Text style={[styles.text, active === "login" && styles.activeText]}>
          Login
        </Text>
      </Pressable>

      {/* Sign Up */}
      <Pressable
        style={[styles.tab, active === "signup" && styles.activeTab]}
        onPress={onSignupPress}
      >
        <Text style={[styles.text, active === "signup" && styles.activeText]}>
          Sign Up
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#E6DDF5",
    borderRadius: 30,
    padding: 4,
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 120,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },

  activeTab: {
    backgroundColor: "#B8A8F0",
  },

  text: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },

  activeText: {
    fontWeight: "600",
  },
});
