import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useSocket } from "@/hooks/use-socket";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";

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

type CreateMessageResponse = {
  message: ChatMessage;
};

type UserSummary = {
  userId: string;
  firstName: string | null;
  firstPhoto: string | null;
};

export default function ChatPage() {
  const socket = useSocket();
  const { matchId, userId, otherUserId } = useLocalSearchParams<{
    matchId?: string | string[];
    userId?: string | string[];
    otherUserId?: string | string[];
  }>();
  const resolvedMatchId = Array.isArray(matchId) ? matchId[0] : matchId;
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;
  const resolvedOtherUserId = Array.isArray(otherUserId)
    ? otherUserId[0]
    : otherUserId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>("Chat");
  const [draftMessage, setDraftMessage] = useState<string>("");

  // Fetch messages and set up socket listeners
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

        const inferredOtherUserId = resolvedOtherUserId
          ? resolvedOtherUserId
          : messagesList.find((message) => message.senderId !== resolvedUserId)
              ?.senderId;

        if (!inferredOtherUserId) {
          setOtherUserName("Chat");
          return;
        }

        try {
          const summaryRes = await fetch(
            `${API_BASE_URL}/users/${inferredOtherUserId}/summary`,
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

    // Join the match room when component mounts
    if (socket && resolvedMatchId) {
      socket.emit("join-match", resolvedMatchId);
      console.log(`Joined match room: ${resolvedMatchId}`);
    }

    // Listen for new messages from other users
    const handleNewMessage = (data: { message: ChatMessage }) => {
      console.log("Received new message via socket:", data.message);
      setMessages((prev) => [...prev, data.message]);
    };

    if (socket) {
      socket.on("new-message", handleNewMessage);
    }

    return () => {
      if (socket) {
        socket.off("new-message", handleNewMessage);
      }
    };
  }, [resolvedMatchId, resolvedUserId, resolvedOtherUserId, socket]);

  const handleSendMessage = async () => {
    if (!resolvedMatchId || !resolvedUserId || isSending) return;

    const trimmed = draftMessage.trim();
    if (!trimmed) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: resolvedMatchId,
          senderId: resolvedUserId,
          text: trimmed,
        }),
      });

      const data = (await res.json()) as CreateMessageResponse;

      if (!res.ok) {
        setError("Failed to send message");
        return;
      }

      if (data?.message) {
        setMessages((prev) => [...prev, data.message]);
      }

      setDraftMessage("");
    } catch {
      setError("Network error while sending message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}
    >
      <ThemedView style={styles.container}>
        <Link
          href={{
            pathname: "/screens/(tabs)/messages",
            params: { userId: resolvedUserId },
          }}
        >
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
              {messages.map((message) => {
                const isMine = message.senderId === resolvedUserId;

                return (
                  <View
                    key={message._id}
                    style={[
                      styles.messageRow,
                      isMine ? styles.messageRowMine : styles.messageRowTheirs,
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">
                      {isMine ? "You" : "Them"}
                    </ThemedText>
                    <ThemedText style={styles.messageText}>
                      {message.text}
                    </ThemedText>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.composer}>
          <TextInput
            value={draftMessage}
            onChangeText={setDraftMessage}
            placeholder="Type a message"
            style={styles.composerInput}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            activeOpacity={0.8}
            disabled={isSending || !draftMessage.trim()}
          >
            <ThemedText type="defaultSemiBold" style={styles.sendButtonText}>
              Send
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
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
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 10,
    padding: 12,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#d8cfc6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  sendButton: {
    backgroundColor: "#c8a3ff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#1b0f2f",
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
    maxWidth: "75%",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  messageRowMine: {
    alignSelf: "flex-end",
    backgroundColor: "#f0d7ff",
    borderWidth: 1,
    borderColor: "#c8a3ff",
  },
  messageRowTheirs: {
    alignSelf: "flex-start",
    backgroundColor: "#f6f0e8",
    borderWidth: 1,
    borderColor: "#d8cfc6",
  },
  messageText: {
    textAlign: "left",
  },
});
