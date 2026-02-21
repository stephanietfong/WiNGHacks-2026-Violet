import { useColorScheme } from "@/hooks/use-color-scheme";
import { RootStackParamList } from "@/types/navigation";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/(auth)/login";
import SignupScreen from "./screens/(auth)/signup";
import Discovery from "./screens/(tabs)/discovery";
import LikesPage from "./screens/(tabs)/likes";
import MessagesPage from "./screens/(tabs)/messages";
import ProfilePage from "./screens/(tabs)/profile";
import LandingScreen from "./screens/landing";

export const unstable_settings = {
  anchor: "(tabs)",
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        initialRouteName="landing"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="landing" component={LandingScreen} />
        <Stack.Screen name="login" component={LoginScreen} />
        <Stack.Screen name="signup" component={SignupScreen} />
        <Stack.Screen name="discovery" component={Discovery} />
        <Stack.Screen name="likes" component={LikesPage} />
        <Stack.Screen name="messages" component={MessagesPage} />
        <Stack.Screen name="profile" component={ProfilePage} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
