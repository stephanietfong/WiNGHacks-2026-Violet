import { useColorScheme } from "@/hooks/use-color-scheme";
import { RootStackParamList } from "@/types/navigation";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LandingScreen from "./screens/landing";
import LoginScreen from "./screens/login";
import SetupScreen from "./screens/setup";
import SignupScreen from "./screens/signup";
import DiscoveryPage from "./screens/tabs/discovery";
import LikesPage from "./screens/tabs/likes";
import MessagesPage from "./screens/tabs/messages";
import ProfilePage from "./screens/tabs/profile";

export const unstable_settings = {
  anchor: "(tabs)",
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        initialRouteName="setup"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="landing" component={LandingScreen} />
        <Stack.Screen name="login" component={LoginScreen} />
        <Stack.Screen name="signup" component={SignupScreen} />
        <Stack.Screen name="setup" component={SetupScreen} />
        <Stack.Screen name="discovery" component={DiscoveryPage} />
        <Stack.Screen name="likes" component={LikesPage} />
        <Stack.Screen name="messages" component={MessagesPage} />
        <Stack.Screen name="profile" component={ProfilePage} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
