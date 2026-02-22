import { useColorScheme } from "@/hooks/use-color-scheme";
import { RootStackParamList } from "@/types/navigation";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ForgotPasswordScreen from "./screens/(auth)/forgotpassword";
import LoginScreen from "./screens/(auth)/login";
import SignupScreen from "./screens/(auth)/signup";
import VerifyEmailScreen from "./screens/(auth)/verifyemail";
import DiscoveryPage from "./screens/(tabs)/discovery";
import LikesPage from "./screens/(tabs)/likes";
import MessagesPage from "./screens/(tabs)/messages";
import ProfilePage from "./screens/(tabs)/profile";
import AboutScreen from "./screens/about";
import LandingScreen from "./screens/landing";
import SetupScreen from "./screens/setup";
import PreferencesSetup from "./screens/setup2";
import Setup3Screen from "./screens/setup3";

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
        <Stack.Screen name="forgotpassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="verifyemail" component={VerifyEmailScreen} />
        <Stack.Screen name="about" component={AboutScreen} />
        <Stack.Screen name="setup" component={SetupScreen} />
        <Stack.Screen name="setup2" component={PreferencesSetup} />
        <Stack.Screen name="setup3" component={Setup3Screen} />
        <Stack.Screen name="discovery" component={DiscoveryPage} />
        <Stack.Screen name="likes" component={LikesPage} />
        <Stack.Screen name="messages" component={MessagesPage} />
        <Stack.Screen name="profile" component={ProfilePage} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
