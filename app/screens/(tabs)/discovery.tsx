// app/screens/tabs/discovery.tsx
import { BottomNav } from "@/components/bottom-nav";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Discovery() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;

  return (
    <LinearGradient
      colors={["#FE9FB8", "#FFC198"]} // start → end colors
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        <Text style={styles.text}>Discovery</Text>

        {/* Semi-transparent box below the text */}
        <View style={styles.box}>
          <Text style={styles.name}>Sabrina</Text>
          <Text style={styles.age}>25</Text>
          <Image
            source={require("../../../assets/images/hearticon.png")}
            style={styles.mainHeartIcon}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <Image
              source={require("../../../assets/images/hearticon.png")}
              style={styles.actionHeartIcon}
            />
            <Image
              source={require("../../../assets/images/hearticon.png")}
              style={styles.actionHeartIcon}
            />
            <Image
              source={require("../../../assets/images/hearticon.png")}
              style={styles.actionHeartIcon}
            />
          </View>
        </View>
      </View>

      <BottomNav activeTab="discovery" userId={resolvedUserId} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
  },
  content: {
    flex: 1,
    paddingBottom: 120,
  },
  text: {
    fontSize: 35,
    fontWeight: "bold",
    marginBottom: 20,
    paddingLeft: 5,
  },
  box: {
    width: "98%",
    height: 620,
    backgroundColor: "rgba(251, 233, 222, 0.5)",
    borderRadius: 10,
    alignItems: "center",
  },
  name: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#333",
    alignSelf: "flex-start",
    paddingLeft: 10,
    paddingTop: 10,
  },
  age: {
    fontSize: 25,
    fontWeight: "500",
    color: "#333",
    alignSelf: "flex-start",
    paddingTop: 0,
    paddingLeft: 10,
    paddingBottom: 15,
  },
  mainHeartIcon: {
    width: 30,
    height: 30,
    marginBottom: 10,
  },
  actionHeartIcon: {
    width: 24,
    height: 24,
    margin: 8,
  },
});
