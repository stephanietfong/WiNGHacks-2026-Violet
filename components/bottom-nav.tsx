import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "discovery" | "likes" | "messages" | "profile";

interface BottomNavProps {
  activeTab: TabKey;
}

type TabRoute =
  | "/screens/(tabs)/discovery"
  | "/screens/(tabs)/likes"
  | "/screens/(tabs)/messages"
  | "/screens/(tabs)/profile";

const tabs: Array<{
  key: TabKey;
  route: TabRoute;
  icon: any;
}> = [
  {
    key: "discovery",
    route: "/screens/(tabs)/discovery",
    icon: require("../assets/images/homeicon.png"),
  },
  {
    key: "likes",
    route: "/screens/(tabs)/likes",
    icon: require("../assets/images/hearticon.png"),
  },
  {
    key: "messages",
    route: "/screens/(tabs)/messages",
    icon: require("../assets/images/mailicon.png"),
  },
  {
    key: "profile",
    route: "/screens/(tabs)/profile",
    icon: require("../assets/images/profileicon.png"),
  },
];

export function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: 5, // Moved slightly lower
          alignItems: "center",
          justifyContent: "space-between",
        },
      ]}
    >
      <View style={styles.bar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.button}
            onPress={() => {
              if (tab.key !== activeTab) {
                router.replace(tab.route as any);
              }
            }}
            activeOpacity={0.8}
          >
            <Image
              source={tab.icon}
              style={[
                styles.icon,
                tab.key !== activeTab && styles.iconInactive,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 24,
    right: 24,
    zIndex: 100,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around", // Changed to space-around for equal spacing around buttons
    backgroundColor: "rgba(251, 233, 222, 0.5)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 15, // Added horizontal margin to increase spacing between buttons
  },
  icon: {
    width: 24,
    height: 24,
  },
  iconInactive: {
    opacity: 0.55,
  },
});
