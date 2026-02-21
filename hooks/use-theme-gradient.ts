import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";

type Gradient = readonly [string, string, ...string[]];

export function useThemeGradient(name: "backgroundGradient"): Gradient {
  const theme = useColorScheme() ?? "light";

  return Colors[theme][name] as Gradient;
}
