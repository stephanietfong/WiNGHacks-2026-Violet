import { BottomNav } from "@/components/bottom-nav";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function LikesPage() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text>This is the Likes Page</Text>
      </View>
      <BottomNav activeTab="likes" userId={resolvedUserId} />
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
