import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Link } from "@react-navigation/native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

type ChatMessage = {
  _id: string;
  matchId: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: string;
};

type MessagesResponse = {
  messages: ChatMessage[];
};

type UserSummary = {
  userId: string;
  firstName: string | null;
  firstPhoto: string | null;
};

export default function ChatPage() {
  const { matchId, userId } = useLocalSearchParams<{
    matchId?: string | string[];
    userId?: string | string[];
  }>();
  const resolvedMatchId = Array.isArray(matchId) ? matchId[0] : matchId;
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>("Chat");

  useEffect(() => {
    async function fetchMessages() {
      if (!resolvedMatchId?.trim()) {
        setMessages([]);
        setError("Missing match id");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE_URL}/messages/match/${resolvedMatchId}`,
        );
        const data = (await res.json()) as MessagesResponse;

        if (!res.ok) {
          setError("Failed to load messages");
          setMessages([]);
          return;
        }

        const messagesList = Array.isArray(data.messages) ? data.messages : [];
        setMessages(messagesList);

        if (!resolvedUserId) {
          setOtherUserName("Chat");
          return;
        }

        const otherUserId = messagesList.find(
          (message) => message.senderId !== resolvedUserId,
        )?.senderId;

        if (!otherUserId) {
          setOtherUserName("Chat");
          return;
        }

        try {
          const summaryRes = await fetch(
            `${API_BASE_URL}/users/${otherUserId}/summary`,
          );

          if (!summaryRes.ok) {
            setOtherUserName("Chat");
            return;
          }

          const summaryData = (await summaryRes.json()) as UserSummary;
          setOtherUserName(summaryData.firstName?.trim() || "Chat");
        } catch {
          setOtherUserName("Chat");
        }
      } catch {
        setError("Network error while loading messages");
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [resolvedMatchId, resolvedUserId]);

  return (
    <ThemedView style={styles.container}>
      <Link screen="messages" params={{ userId: resolvedUserId }}>
        <ThemedText type="link">All Messages</ThemedText>
      </Link>
      <ThemedText type="title" style={styles.header}>
        {otherUserName}
      </ThemedText>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" />
            <ThemedText>Loading messages...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <ThemedText>{error}</ThemedText>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerState}>
            <ThemedText>No messages yet.</ThemedText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {messages.map((message) => (
              <View key={message._id} style={styles.messageRow}>
                <ThemedText type="defaultSemiBold">
                  {message.senderId === resolvedUserId ? "You" : "Them"}
                </ThemedText>
                <ThemedText>{message.text}</ThemedText>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 12,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 12,
  },
  messageRow: {
    borderWidth: 1,
    borderColor: "#D7D7D7",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
});
