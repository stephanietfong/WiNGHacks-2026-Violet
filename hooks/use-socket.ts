import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

/**
 * Hook to manage Socket.IO connection for real-time messaging
 * Maintains a singleton connection and auto-reconnects on network change
 */
export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    if (!socketRef.current) {
      socketRef.current = io(API_BASE_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected:", socketRef.current?.id);
      });

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    }

    return () => {
      // Keep socket alive for the entire app lifecycle
      // Cleanup is handled by socket.io's auto-reconnection
    };
  }, []);

  return socketRef.current;
};
