import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

export default function EditProfileScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#FE9FB8", "#FFC198"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
        <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/screens/(tabs)/viewprofile")}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Select up to six images for your profile!</Text>
      </View>
      
      <View style={styles.photoGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.placeholderRectangle}>
            {index === 1 && (
              <View style={styles.circleWithPlus}>
                <Text style={styles.plusSign}>+</Text>
              </View>
            )}
          </View>
        ))}
      </View>
        <Text style={styles.aboutMe}>About me</Text>
        <TextInput
        style={styles.purpleTextBox}
        placeholder="Write something about yourself..."
        placeholderTextColor="#FFFFFF"
        multiline
      />
      <Text style={styles.aboutMe}>Conversation Prompts</Text>
        <TextInput
        style={styles.purpleTextBox}
        placeholder="Q: In my free time I love to..."
        placeholderTextColor="#FFFFFF"
        multiline
      />
      <TouchableOpacity style={styles.circleButton} onPress={() => console.log("Button Pressed")}> 
        <Text style={styles.plusSign}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveButton} onPress={() => console.log("Save Profile")}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
        </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#000", // Changed to black
    fontWeight: "600", // Made the text thicker
    marginTop: 20, // Added margin to push it lower
    marginBottom: 30, // Increased margin to lower the text
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#A893CE",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(251, 233, 222, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  backButtonText: {
    color: "#222",
    fontWeight: "600",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  placeholderRectangle: {
    width: "31%", // Adjusted width to fit within the grid
    height: 145, // Explicit height for longer rectangles
    borderRadius: 12,
    backgroundColor: "rgba(251, 233, 222, 0.5)",
    marginBottom: 12,
  },
  circleWithPlus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#A893CE", // Updated to the requested color
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  plusSign: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
    aboutMe: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#000", // Changed to black
  },
  purpleTextBox: {
    height: 100,
    backgroundColor: "#A893CE", // Purple color
    borderRadius: 12,
    padding: 10,
    color: "#FFFFFF", // White text color
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: "top", // Ensures text starts at the top
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2A9DB", // Same purple color as before
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center", // Center the button horizontally
    marginTop: 0,
    marginBottom: 20,
  },
});
