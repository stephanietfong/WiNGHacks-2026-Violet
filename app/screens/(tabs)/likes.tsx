import { BottomNav } from "@/components/bottom-nav";
import { StyleSheet, Text, View } from "react-native";

export default function LikesPage() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text>This is the Likes Page</Text>
      </View>
      <BottomNav activeTab="likes" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 120,
  },
});
