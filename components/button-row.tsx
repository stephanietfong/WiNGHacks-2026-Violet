import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

type ButtonRowProps = {
  onReject: () => void;
  onMoreInfo: () => void;
  onCheck: () => void;
};

export const ButtonRow: React.FC<ButtonRowProps> = ({ onReject, onMoreInfo, onCheck }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "black" }]}
        onPress={onReject}
      >
        <Image
          source={require("../assets/images/reject-circle.png")}
          style={styles.icon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "white" }]}
        onPress={onMoreInfo}
      >
        <Image
          source={require("../assets/images/more-info-circle.png")}
          style={styles.icon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#A893CE" }]}
        onPress={onCheck}
      >
        <Image
          source={require("../assets/images/check-circle.png")}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    bottom: 30,
    position: "absolute",
    width: "100%",
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 30,
    height: 30,
  },
});