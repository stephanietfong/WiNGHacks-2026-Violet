import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RootStackParamList } from "@/types/navigation";
import { Link } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "landing">;

export default function LandingScreen({ navigation }: Props) {
  const logoImage = require("../../assets/images/logo.png");
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    Animated.sequence([
      // 1. Fade logo in
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),

      // 2. Pause
      Animated.delay(1500),

      // 3. Move logo up
      Animated.timing(logoTranslateY, {
        toValue: -30,
        duration: 700,
        useNativeDriver: true,
      }),

      // 4. Show content
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowContent(true);
    });
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }],
          },
        ]}
      >
        <Image source={logoImage} style={styles.image} />
        <ThemedText type="default" style={styles.tagline}>
          Finally, a space just for women.
        </ThemedText>
      </Animated.View>

      <Animated.View
        style={[{ opacity: contentOpacity }]}
        pointerEvents={showContent ? "auto" : "none"}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("login")}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("signup")}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Link screen="about" params={{}} style={styles.aboutContainer}>
          <ThemedText type="link">About Us</ThemedText>
        </Link>

       
      </Animated.View>
    </ThemedView>
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
  tagline: {
    textAlign: "center",
    fontStyle: "italic",
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    marginBottom: 20,
    gap: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  aboutContainer: {
    textAlign: "center",
  },
  image: {
    paddingLeft: 80,
    paddingRight: 80,
    marginBottom: -20,
    resizeMode: "contain",
  }
});
