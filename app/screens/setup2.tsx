import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Interest {
  name: string;
  selected: boolean;
}

export default function PreferencesSetup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  // State
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(100);
  const [distanceMiles, setDistanceMiles] = useState(50);
  const [relationshipType, setRelationshipType] = useState("casual");
  const [locationPermission, setLocationPermission] = useState<string | null>(
    null,
  );
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showRelationshipDropdown, setShowRelationshipDropdown] =
    useState(false);
  const [ageSliderWidth, setAgeSliderWidth] = useState(0);
  const [distanceSliderWidth, setDistanceSliderWidth] = useState(0);

  const relationshipOptions = [
    "casual",
    "long-term",
    "hookup",
    "i dont know",
    "friends with benefits",
  ];

  // Fetch interests from server
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await fetch("http://10.136.197.71:3000/interests");
        const data = await response.json();
        const interestsList = data.interests.map((interest: string) => ({
          name: interest,
          selected: false,
        }));
        setInterests(interestsList);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch interests");
      }
    };
    fetchInterests();
  }, []);

  // Handle interest selection
  const toggleInterest = (index: number) => {
    const updated = [...interests];
    updated[index].selected = !updated[index].selected;
    setInterests(updated);

    const selected = updated.filter((i) => i.selected).map((i) => i.name);
    setSelectedInterests(selected);
  };

  // Handle location permission
  const handleLocationPermission = async (
    permissionType: "deny" | "once" | "while-using" | "always",
  ) => {
    try {
      let permission;

      if (permissionType === "deny") {
        setLocationPermission("denied");
        setLocation(null);
        return;
      }

      if (permissionType === "once" || permissionType === "while-using") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        permission = status;
      } else if (permissionType === "always") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        permission = status;
      }

      if (permission === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setLocationPermission(permissionType);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
    }
  };

  // Submit preferences
  const handleNext = async () => {
    if (selectedInterests.length < 3 || selectedInterests.length > 9) {
      Alert.alert(
        "Invalid Selection",
        "Please select between 3 and 9 interests",
      );
      return;
    }

    if (!location && locationPermission !== "denied") {
      Alert.alert(
        "Location Required",
        "Please allow location access or choose 'Don't Allow'",
      );
      return;
    }

    try {
      const response = await fetch(
        `http://10.136.197.71:3000/setup/page-2/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interests: selectedInterests,
            minAge,
            maxAge,
            distanceMiles,
            relationshipType,
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
            locationPermission,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        router.push({
          pathname: "/screens/setup3" as any,
          params: { userId },
        });
      } else {
        Alert.alert("Error", data.message || "Failed to save preferences");
      }
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Check if your server is running and IP is correct",
      );
    }
  };

  return (
    <LinearGradient
      colors={["#FE9FB8", "#FEB2AB"]}
      style={[styles.gradient, { paddingTop: insets.top }]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Your Preferences</Text>

        {/* Interests */}
        <Text style={styles.label}>Interests (Select 3-9)</Text>
        <View style={styles.interestsGrid}>
          {interests.map((interest, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.interestTag,
                interest.selected && styles.interestTagSelected,
              ]}
              onPress={() => toggleInterest(index)}
            >
              <Text
                style={[
                  styles.interestText,
                  interest.selected && styles.interestTextSelected,
                ]}
              >
                {interest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.small}>Selected: {selectedInterests.length}/9</Text>

        {/* Age Range */}
        <Text style={styles.label}>Age Preference</Text>
        <View style={styles.ageRangeContainer}>
          <View style={styles.ageInputRow}>
            <Text style={styles.ageLabel}>Min: {minAge}</Text>
            <Text style={styles.ageLabel}>Max: {maxAge}</Text>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={styles.small}>18</Text>
            <View style={styles.doubleSlider}>
              <TouchableOpacity
                style={[styles.ageSliderTrack, { flex: 1 }]}
                onLayout={(e) => setAgeSliderWidth(e.nativeEvent.layout.width)}
                onPress={(e) => {
                  if (ageSliderWidth > 0) {
                    const newMin = Math.round(
                      18 +
                        (e.nativeEvent.locationX / ageSliderWidth) * (100 - 18),
                    );
                    if (newMin < maxAge) setMinAge(newMin);
                  }
                }}
              >
                <View
                  style={[
                    styles.ageSliderFill,
                    {
                      left: `${((minAge - 18) / (100 - 18)) * 100}%`,
                      right: `${100 - ((maxAge - 18) / (100 - 18)) * 100}%`,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ageSliderThumb,
                    { left: `${((minAge - 18) / (100 - 18)) * 100}%` },
                  ]}
                />
                <View
                  style={[
                    styles.ageSliderThumb,
                    { left: `${((maxAge - 18) / (100 - 18)) * 100}%` },
                  ]}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.small}>100</Text>
          </View>
        </View>

        {/* Distance */}
        <Text style={styles.label}>Search Radius (Miles)</Text>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>{distanceMiles} miles</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.small}>1</Text>
            <TouchableOpacity
              style={styles.distanceSlider}
              onLayout={(e) =>
                setDistanceSliderWidth(e.nativeEvent.layout.width)
              }
              onPress={(e) => {
                if (distanceSliderWidth > 0) {
                  const newDistance = Math.round(
                    1 +
                      (e.nativeEvent.locationX / distanceSliderWidth) *
                        (1000 - 1),
                  );
                  setDistanceMiles(newDistance);
                }
              }}
            >
              <View
                style={[
                  styles.distanceFill,
                  {
                    width: `${((distanceMiles - 1) / (1000 - 1)) * 100}%`,
                  },
                ]}
              />
              <View
                style={[
                  styles.distanceThumb,
                  {
                    left: `${((distanceMiles - 1) / (1000 - 1)) * 100}%`,
                  },
                ]}
              />
            </TouchableOpacity>
            <Text style={styles.small}>1000</Text>
          </View>
        </View>

        {/* Relationship Type */}
        <Text style={styles.label}>Looking For</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowRelationshipDropdown(true)}
        >
          <Text style={styles.dropdownText}>{relationshipType}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        {/* Location Permission */}
        <Text style={styles.label}>Location Permission</Text>
        <View style={styles.permissionContainer}>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              locationPermission === "denied" &&
                styles.permissionButtonSelected,
            ]}
            onPress={() => handleLocationPermission("deny")}
          >
            <Text
              style={[
                styles.permissionText,
                locationPermission === "denied" &&
                  styles.permissionTextSelected,
              ]}
            >
              Don't Allow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              locationPermission === "once" && styles.permissionButtonSelected,
            ]}
            onPress={() => handleLocationPermission("once")}
          >
            <Text
              style={[
                styles.permissionText,
                locationPermission === "once" && styles.permissionTextSelected,
              ]}
            >
              Allow Once
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              locationPermission === "while-using" &&
                styles.permissionButtonSelected,
            ]}
            onPress={() => handleLocationPermission("while-using")}
          >
            <Text
              style={[
                styles.permissionText,
                locationPermission === "while-using" &&
                  styles.permissionTextSelected,
              ]}
            >
              While Using
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              locationPermission === "always" &&
                styles.permissionButtonSelected,
            ]}
            onPress={() => handleLocationPermission("always")}
          >
            <Text
              style={[
                styles.permissionText,
                locationPermission === "always" &&
                  styles.permissionTextSelected,
              ]}
            >
              Always
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Modal */}
        <Modal
          visible={showRelationshipDropdown}
          transparent
          animationType="fade"
        >
          <TouchableOpacity
            style={styles.dropdownOverlay}
            onPress={() => setShowRelationshipDropdown(false)}
          >
            <View style={styles.dropdownMenu}>
              {relationshipOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setRelationshipType(option);
                    setShowRelationshipDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.bottomRow}>
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  heading: {
    fontSize: 34,
    fontWeight: "700",
    marginTop: 36,
    marginBottom: 18,
    color: "#000",
  },
  label: { fontSize: 18, fontWeight: "600", marginTop: 18, color: "#111" },
  small: { fontSize: 12, color: "#111", marginTop: 6 },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  interestTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  interestTagSelected: {
    backgroundColor: "#A893CE",
    borderColor: "#7B4DE1",
  },
  interestText: { fontSize: 14, color: "#111", fontWeight: "500" },
  interestTextSelected: { color: "#fff" },
  ageRangeContainer: { marginTop: 12 },
  ageInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ageLabel: { fontSize: 14, fontWeight: "600", color: "#111" },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  doubleSlider: { flex: 1, height: 40, justifyContent: "center" },
  ageSliderTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 4,
    position: "relative",
  },
  ageSliderFill: {
    position: "absolute",
    height: 8,
    backgroundColor: "#E2A9DB",
    borderRadius: 4,
  },
  ageSliderThumb: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#A893CE",
    marginLeft: -9,
    marginTop: -5,
  },
  distanceContainer: { marginTop: 12 },
  distanceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  distanceSlider: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 4,
    justifyContent: "center",
    position: "relative",
  },
  distanceFill: {
    position: "absolute",
    height: 8,
    backgroundColor: "#E2A9DB",
    borderRadius: 4,
  },
  distanceThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#A893CE",
    marginLeft: -10,
    marginTop: -6,
  },
  dropdown: {
    height: 48,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: { color: "#111", fontSize: 16, fontWeight: "500" },
  dropdownArrow: { color: "#111", fontSize: 12 },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "80%",
    maxHeight: 300,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownOptionText: { color: "#111", fontSize: 14 },
  permissionContainer: {
    marginTop: 12,
    gap: 8,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
  },
  permissionButtonSelected: {
    backgroundColor: "#A893CE",
    borderColor: "#7B4DE1",
  },
  permissionText: { color: "#111", fontWeight: "500", fontSize: 14 },
  permissionTextSelected: { color: "#fff" },
  bottomRow: {
    marginTop: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.71)",
  },
  dotActive: { backgroundColor: "#7B4DE1" },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A893CE",
    alignItems: "center",
    justifyContent: "center",
  },
  nextIcon: { fontSize: 24, color: "#000" },
});
