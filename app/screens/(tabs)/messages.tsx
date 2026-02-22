import { BottomNav } from "@/components/bottom-nav";
import { StyleSheet, Text, View } from "react-native";

export default function MessagesPage() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text>This is the Messages Page</Text>
      </View>
      <BottomNav activeTab="messages" />
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
