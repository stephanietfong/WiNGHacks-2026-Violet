import { LinearGradient } from "expo-linear-gradient";
import { ViewProps } from "react-native";

import { useThemeGradient } from "@/hooks/use-theme-gradient";

export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  const gradient = useThemeGradient("backgroundGradient");

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[{ flex: 1 }, style]}
      {...otherProps}
    />
  );
}
