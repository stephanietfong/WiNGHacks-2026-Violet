import { BottomNav } from "@/components/bottom-nav";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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

type ChatItem = {
  matchId: string;
  users: string[];
  status: "matched" | "pending" | "blocked";
  matchedAt?: string | null;
  messages: ChatMessage[];
};

type ChatsResponse = {
  chats: ChatItem[];
};

type UserSummary = {
  userId: string;
  firstName: string | null;
  firstPhoto: string | null;
};

export default function MessagesPage() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [userSummaries, setUserSummaries] = useState<
    Record<string, UserSummary>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChats() {
      if (!resolvedUserId?.trim()) {
        setChats([]);
        setError("Missing user id");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE_URL}/messages/chats/${resolvedUserId}`,
        );
        const data = (await res.json()) as ChatsResponse;

        if (!res.ok) {
          setError("Failed to load chats");
          setChats([]);
          setUserSummaries({});
          return;
        }

        const chatsList = Array.isArray(data.chats) ? data.chats : [];
        setChats(chatsList);

        const otherUserIds = Array.from(
          new Set(
            chatsList
              .map((chat) =>
                chat.users.find((chatUserId) => chatUserId !== resolvedUserId),
              )
              .filter((value): value is string => Boolean(value)),
          ),
        );

        if (!otherUserIds.length) {
          setUserSummaries({});
          return;
        }

        const summaryEntries = await Promise.all(
          otherUserIds.map(async (otherUserId) => {
            try {
              const summaryRes = await fetch(
                `${API_BASE_URL}/users/${otherUserId}/summary`,
              );

              if (!summaryRes.ok) {
                return [
                  otherUserId,
                  { userId: otherUserId, firstName: null, firstPhoto: null },
                ] as const;
              }

              const summaryData = (await summaryRes.json()) as UserSummary;
              return [
                otherUserId,
                {
                  userId: summaryData.userId,
                  firstName: summaryData.firstName,
                  firstPhoto: summaryData.firstPhoto,
                },
              ] as const;
            } catch {
              return [
                otherUserId,
                { userId: otherUserId, firstName: null, firstPhoto: null },
              ] as const;
            }
          }),
        );

        setUserSummaries(Object.fromEntries(summaryEntries));
      } catch {
        setError("Network error while loading chats");
        setChats([]);
        setUserSummaries({});
      } finally {
        setIsLoading(false);
      }
    }

    fetchChats();
  }, [resolvedUserId]);

  const getChatTitle = (chat: ChatItem) => {
    if (!resolvedUserId) return "Lily";
    const otherUserId = chat.users.find((user) => user !== resolvedUserId);
    if (!otherUserId) return "Lily";

    const summary = userSummaries[otherUserId];
    return summary?.firstName?.trim() || `User ${otherUserId.slice(-4)}`;
  };

  const getChatPhoto = (chat: ChatItem) => {
    if (!resolvedUserId) return null;
    const otherUserId = chat.users.find((user) => user !== resolvedUserId);
    if (!otherUserId) return null;

    return userSummaries[otherUserId]?.firstPhoto ?? null;
  };

  const getLatestMessageText = (chat: ChatItem) => {
    if (!chat.messages.length) return "No messages yet";
    return chat.messages[chat.messages.length - 1]?.text ?? "No messages yet";
  };

  const shouldShowUnreadDot = (chat: ChatItem) => {
    if (!chat.messages.length || !resolvedUserId) return false;

    const latestMessage = chat.messages[chat.messages.length - 1];

    return (
      latestMessage.senderId !== resolvedUserId && latestMessage.read === false
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.centerText}>
        Your Messages
      </ThemedText>
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.stateText}>Loading chats...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <ThemedText style={styles.stateText}>{error}</ThemedText>
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.centerState}>
            <ThemedText style={styles.stateText}>No chats yet.</ThemedText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {chats.map((chat) => (
              <TouchableOpacity
                key={chat.matchId}
                activeOpacity={0.85}
                style={styles.chatRow}
                onPress={() =>
                  router.push({
                    pathname: "/screens/(tabs)/chat",
                    params: {
                      matchId: chat.matchId,
                      userId: resolvedUserId,
                    },
                  })
                }
              >
                <Image
                  source={
                    getChatPhoto(chat)
                      ? { uri: getChatPhoto(chat) as string }
                      : require("../../../assets/images/logo.png")
                  }
                  style={styles.avatar}
                />
                <View style={styles.rowTextContainer}>
                  <ThemedText type="defaultSemiBold">
                    {getChatTitle(chat)}
                  </ThemedText>
                  <ThemedText numberOfLines={1} type="default">
                    {getLatestMessageText(chat)}
                  </ThemedText>
                </View>
                {shouldShowUnreadDot(chat) && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <BottomNav activeTab="messages" userId={resolvedUserId} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    justifyContent: "flex-start",
    alignContent: "center",
    gap: 40,
  },
  content: {
    flex: 1,
    paddingBottom: 120,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: {
    fontSize: 16,
    color: "#222222",
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 20,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9c1c1",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#8f89e8",
    borderRadius: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  rowTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#8f89e8",
    marginLeft: 8,
  },
  centerText: {
    textAlign: "center",
  },
});
