import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.IP ? `http://${process.env.IP}:3000` : "http://localhost:3000");

interface Interest {
  name: string;
}

export default function PreferencesSetup() {
  const router = useRouter();
  const {
    userId,
    firstName: firstNameParam,
    phone: phoneParam,
    age: ageParam,
    selectedFeet: selectedFeetParam,
    selectedInches: selectedInchesParam,
    heightLabel: heightLabelParam,
    interests: interestsParam,
    minAge: minAgeParam,
    maxAge: maxAgeParam,
    distanceMiles: distanceMilesParam,
    relationshipType: relationshipTypeParam,
    locationPermission: locationPermissionParam,
    latitude: latitudeParam,
    longitude: longitudeParam,
    photos: photosParam,
  } = useLocalSearchParams();

  const readParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const parseNumberParam = (
    value: string | string[] | undefined,
    fallback: number,
  ) => {
    const raw = readParam(value);
    if (raw === undefined || raw === null || raw === "") {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const parseListParam = (value: string | string[] | undefined) => {
    const raw = readParam(value);
    if (!raw) return [] as string[];
    return raw
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const resolvedUserId = readParam(userId);
  const MIN_AGE = 18;
  const MAX_AGE = 100;
  const MIN_DISTANCE = 1;
  const MAX_DISTANCE = 1000;
  const thumbSize = 20;

  const initialLatitude = Number(readParam(latitudeParam));
  const initialLongitude = Number(readParam(longitudeParam));
  const hasInitialLocation =
    Number.isFinite(initialLatitude) && Number.isFinite(initialLongitude);

  // State
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    parseListParam(interestsParam),
  );
  const [interestQuery, setInterestQuery] = useState("");
  const [minAge, setMinAge] = useState(parseNumberParam(minAgeParam, 18));
  const [maxAge, setMaxAge] = useState(parseNumberParam(maxAgeParam, 100));
  const [distanceMiles, setDistanceMiles] = useState(
    parseNumberParam(distanceMilesParam, 50),
  );
  const [relationshipType, setRelationshipType] = useState(
    readParam(relationshipTypeParam) || "Casual",
  );
  const [locationPermission, setLocationPermission] = useState<string | null>(
    readParam(locationPermissionParam) || null,
  );
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    hasInitialLocation
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null,
  );
  const [showRelationshipDropdown, setShowRelationshipDropdown] =
    useState(false);
  const [relationshipDropdownAnchor, setRelationshipDropdownAnchor] = useState({
    x: 24,
    y: 260,
    width: 280,
  });
  const relationshipDropdownTriggerRef = useRef<View>(null);

  const openRelationshipDropdown = () => {
    relationshipDropdownTriggerRef.current?.measureInWindow(
      (x, y, width, height) => {
        setRelationshipDropdownAnchor({
          x,
          y: y + height + 4,
          width,
        });
        setShowRelationshipDropdown(true);
      },
    );
  };

  const ageSliderWidth = useRef(0);
  const distanceSliderWidth = useRef(0);
  const minAnimX = useRef(new Animated.Value(0)).current;
  const maxAnimX = useRef(new Animated.Value(0)).current;
  const distanceAnimX = useRef(new Animated.Value(0)).current;
  const minAgeRef = useRef(minAge);
  const maxAgeRef = useRef(maxAge);
  const distanceRef = useRef(distanceMiles);

  const relationshipOptions = [
    "Casual",
    "Short-term",
    "Long-term",
    "Hookup",
    "Friends with Benefits",
    "I don't know",
  ];

  const filteredInterests = interests
    .filter((interest) => {
      const query = interestQuery.trim().toLowerCase();
      if (!query) return false;

      const alreadySelected = selectedInterests.some(
        (selected) => selected.toLowerCase() === interest.name.toLowerCase(),
      );

      return !alreadySelected && interest.name.toLowerCase().includes(query);
    })
    .slice(0, 8);

  const valueToPosition = (
    value: number,
    minValue: number,
    maxValue: number,
    width: number,
  ) => {
    const usable = Math.max(0, width - thumbSize);
    if (usable <= 0) return 0;
    return ((value - minValue) / (maxValue - minValue)) * usable;
  };

  const positionToValue = (
    position: number,
    minValue: number,
    maxValue: number,
    width: number,
  ) => {
    const usable = Math.max(0, width - thumbSize);
    if (usable <= 0) return minValue;
    const ratio = position / usable;
    return Math.round(minValue + ratio * (maxValue - minValue));
  };

  useEffect(() => {
    minAgeRef.current = minAge;
  }, [minAge]);

  useEffect(() => {
    maxAgeRef.current = maxAge;
  }, [maxAge]);

  useEffect(() => {
    distanceRef.current = distanceMiles;
  }, [distanceMiles]);

  useEffect(() => {
    const minId = minAnimX.addListener(({ value }) => {
      const width = ageSliderWidth.current;
      if (width <= 0) return;
      const rawMin = positionToValue(value, MIN_AGE, MAX_AGE, width);
      const nextMin = Math.min(rawMin, maxAgeRef.current - 1);
      if (nextMin !== minAgeRef.current) {
        setMinAge(nextMin);
      }
    });

    const maxId = maxAnimX.addListener(({ value }) => {
      const width = ageSliderWidth.current;
      if (width <= 0) return;
      const rawMax = positionToValue(value, MIN_AGE, MAX_AGE, width);
      const nextMax = Math.max(rawMax, minAgeRef.current + 1);
      if (nextMax !== maxAgeRef.current) {
        setMaxAge(nextMax);
      }
    });

    const distanceId = distanceAnimX.addListener(({ value }) => {
      const width = distanceSliderWidth.current;
      if (width <= 0) return;
      const nextDistance = positionToValue(
        value,
        MIN_DISTANCE,
        MAX_DISTANCE,
        width,
      );
      if (nextDistance !== distanceRef.current) {
        setDistanceMiles(nextDistance);
      }
    });

    return () => {
      minAnimX.removeListener(minId);
      maxAnimX.removeListener(maxId);
      distanceAnimX.removeListener(distanceId);
    };
  }, [distanceAnimX, maxAnimX, minAnimX]);

  const ageMinPanRef = useRef<{ startX: number } | null>(null);
  const ageMaxPanRef = useRef<{ startX: number } | null>(null);
  const distancePanRef = useRef<{ startX: number } | null>(null);

  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        minAnimX.stopAnimation((value: number) => {
          ageMinPanRef.current = { startX: value };
        });
      },
      onPanResponderMove: (_, gs) => {
        if (!ageMinPanRef.current) return;
        const width = ageSliderWidth.current;
        const usable = Math.max(0, width - thumbSize);
        const maxAllowed = valueToPosition(
          maxAgeRef.current - 1,
          MIN_AGE,
          MAX_AGE,
          width,
        );
        const next = Math.min(
          Math.max(0, ageMinPanRef.current.startX + gs.dx),
          Math.min(usable, maxAllowed),
        );
        minAnimX.setValue(next);
      },
      onPanResponderRelease: () => {
        ageMinPanRef.current = null;
      },
    }),
  ).current;

  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        maxAnimX.stopAnimation((value: number) => {
          ageMaxPanRef.current = { startX: value };
        });
      },
      onPanResponderMove: (_, gs) => {
        if (!ageMaxPanRef.current) return;
        const width = ageSliderWidth.current;
        const usable = Math.max(0, width - thumbSize);
        const minAllowed = valueToPosition(
          minAgeRef.current + 1,
          MIN_AGE,
          MAX_AGE,
          width,
        );
        const next = Math.min(
          Math.max(minAllowed, ageMaxPanRef.current.startX + gs.dx),
          usable,
        );
        maxAnimX.setValue(next);
      },
      onPanResponderRelease: () => {
        ageMaxPanRef.current = null;
      },
    }),
  ).current;

  const distancePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        distanceAnimX.stopAnimation((value: number) => {
          distancePanRef.current = { startX: value };
        });
      },
      onPanResponderMove: (_, gs) => {
        if (!distancePanRef.current) return;
        const usable = Math.max(0, distanceSliderWidth.current - thumbSize);
        const next = Math.min(
          Math.max(0, distancePanRef.current.startX + gs.dx),
          usable,
        );
        distanceAnimX.setValue(next);
      },
      onPanResponderRelease: () => {
        distancePanRef.current = null;
      },
    }),
  ).current;

  const handleAgeSliderTap = (e: any) => {
    const width = ageSliderWidth.current;
    const usable = Math.max(0, width - thumbSize);
    if (usable <= 0) return;

    const tappedPosition = Math.min(
      Math.max(0, e.nativeEvent.locationX - thumbSize / 2),
      usable,
    );

    const minPos = valueToPosition(minAgeRef.current, MIN_AGE, MAX_AGE, width);
    const maxPos = valueToPosition(maxAgeRef.current, MIN_AGE, MAX_AGE, width);

    if (
      Math.abs(tappedPosition - minPos) <= Math.abs(tappedPosition - maxPos)
    ) {
      const maxAllowed = valueToPosition(
        maxAgeRef.current - 1,
        MIN_AGE,
        MAX_AGE,
        width,
      );
      minAnimX.setValue(Math.min(tappedPosition, maxAllowed));
      return;
    }

    const minAllowed = valueToPosition(
      minAgeRef.current + 1,
      MIN_AGE,
      MAX_AGE,
      width,
    );
    maxAnimX.setValue(Math.max(tappedPosition, minAllowed));
  };

  const handleDistanceTap = (e: any) => {
    const usable = Math.max(0, distanceSliderWidth.current - thumbSize);
    if (usable <= 0) return;
    const tappedPosition = Math.min(
      Math.max(0, e.nativeEvent.locationX - thumbSize / 2),
      usable,
    );
    distanceAnimX.setValue(tappedPosition);
  };

  // Fetch interests from server
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/interests`);
        const data = await response.json();
        const interestsList = data.interests.map((interest: string) => ({
          name: interest,
        }));
        setInterests(interestsList);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch interests");
      }
    };
    fetchInterests();
  }, []);

  const addInterest = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const normalized = trimmed.toLowerCase();
    if (
      selectedInterests.some(
        (selected) => selected.toLowerCase() === normalized,
      )
    ) {
      setInterestQuery("");
      return;
    }

    if (selectedInterests.length >= 9) {
      Alert.alert("Limit Reached", "You can select up to 9 interests");
      return;
    }

    const matchingInterest = interests.find(
      (interest) => interest.name.toLowerCase() === normalized,
    );

    setSelectedInterests((prev) => [
      ...prev,
      matchingInterest?.name || trimmed,
    ]);
    setInterestQuery("");
  };

  const removeInterest = (value: string) => {
    setSelectedInterests((prev) =>
      prev.filter((interest) => interest.toLowerCase() !== value.toLowerCase()),
    );
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
    if (!resolvedUserId) {
      Alert.alert(
        "Session Error",
        "Missing user information. Please create your account again.",
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
        `${API_BASE_URL}/setup/page-2/${resolvedUserId}`,
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
          params: {
            userId: resolvedUserId,
            firstName: readParam(firstNameParam) ?? "",
            phone: readParam(phoneParam) ?? "",
            age: readParam(ageParam) ?? "",
            selectedFeet: readParam(selectedFeetParam) ?? "",
            selectedInches: readParam(selectedInchesParam) ?? "",
            heightLabel: readParam(heightLabelParam) ?? "",
            interests: selectedInterests.join("|"),
            minAge: String(minAge),
            maxAge: String(maxAge),
            distanceMiles: String(distanceMiles),
            relationshipType,
            locationPermission: locationPermission ?? "",
            latitude: location ? String(location.latitude) : "",
            longitude: location ? String(location.longitude) : "",
            photos: readParam(photosParam) ?? "",
          },
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
    <LinearGradient colors={["#FE9FB8", "#FEB2AB"]} style={styles.gradient}>
      <Image
        source={require("../../assets/images/heart_b.png")}
        style={styles.heartTopLeft}
        resizeMode="contain"
      />
      <Image
        source={require("../../assets/images/heart_t.png")}
        style={styles.heartBottomRight}
        resizeMode="contain"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <Text style={styles.heading}>Your Preferences</Text>

        {/* Interests */}
        <Text style={styles.label}>Interests</Text>
        <View style={styles.interestInputWrapper}>
          <View style={styles.interestInputContainer}>
            <View style={styles.selectedInterestsRow}>
              {selectedInterests.map((interest) => (
                <View key={interest} style={styles.selectedInterestTag}>
                  <Text style={styles.selectedInterestText}>{interest}</Text>
                  <TouchableOpacity
                    style={styles.removeInterestButton}
                    onPress={() => removeInterest(interest)}
                  >
                    <Text style={styles.removeInterestText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TextInput
              style={styles.interestInput}
              placeholder="Type an interest"
              placeholderTextColor="#6b5a7f"
              value={interestQuery}
              onChangeText={setInterestQuery}
              onSubmitEditing={() => addInterest(interestQuery)}
              returnKeyType="done"
              blurOnSubmit={false}
            />
          </View>

          {filteredInterests.length > 0 && (
            <View style={styles.interestSuggestions}>
              {filteredInterests.map((interest, index) => (
                <TouchableOpacity
                  key={interest.name}
                  style={[
                    styles.interestSuggestionItem,
                    index === filteredInterests.length - 1 &&
                      styles.interestSuggestionLast,
                  ]}
                  onPress={() => addInterest(interest.name)}
                >
                  <Text style={styles.interestSuggestionText}>
                    {interest.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Age Range */}
        <Text style={styles.label}>Age Preference</Text>
        <View style={styles.ageRangeContainer}>
          <View style={styles.ageInputRow}>
            <Text style={styles.ageLabel}>Min: {minAge}</Text>
            <Text style={styles.ageLabel}>Max: {maxAge}</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.small}>18</Text>
            <TouchableOpacity
              style={styles.ageSlider}
              onLayout={(e) => {
                ageSliderWidth.current = e.nativeEvent.layout.width;
                minAnimX.setValue(
                  valueToPosition(
                    minAgeRef.current,
                    MIN_AGE,
                    MAX_AGE,
                    ageSliderWidth.current,
                  ),
                );
                maxAnimX.setValue(
                  valueToPosition(
                    maxAgeRef.current,
                    MIN_AGE,
                    MAX_AGE,
                    ageSliderWidth.current,
                  ),
                );
              }}
              onPress={handleAgeSliderTap}
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.animatedFill,
                  {
                    transform: [{ translateX: minAnimX }],
                    width: Animated.add(
                      Animated.subtract(maxAnimX, minAnimX),
                      new Animated.Value(thumbSize),
                    ) as any,
                  },
                ]}
              />

              <Animated.View
                {...minPanResponder.panHandlers}
                style={[
                  styles.animatedThumb,
                  {
                    transform: [{ translateX: minAnimX }],
                  },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              />

              <Animated.View
                {...maxPanResponder.panHandlers}
                style={[
                  styles.animatedThumb,
                  {
                    transform: [{ translateX: maxAnimX }],
                  },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              />

              <Animated.View
                style={[
                  styles.ageTooltip,
                  {
                    transform: [
                      {
                        translateX: Animated.add(
                          minAnimX,
                          new Animated.Value((thumbSize - 40) / 2),
                        ),
                      },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.ageTooltipText}>{minAge}</Text>
                <View style={styles.tooltipTriangle} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.ageTooltip,
                  {
                    transform: [
                      {
                        translateX: Animated.add(
                          maxAnimX,
                          new Animated.Value((thumbSize - 40) / 2),
                        ),
                      },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.ageTooltipText}>{maxAge}</Text>
                <View style={styles.tooltipTriangle} />
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.small}>100</Text>
          </View>
        </View>

        {/* Distance */}
        <Text style={styles.label}>Search Radius (Miles)</Text>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>{distanceMiles} miles</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.small}>1</Text>
            <TouchableOpacity
              style={styles.distanceSlider}
              onLayout={(e) => {
                distanceSliderWidth.current = e.nativeEvent.layout.width;
                distanceAnimX.setValue(
                  valueToPosition(
                    distanceRef.current,
                    MIN_DISTANCE,
                    MAX_DISTANCE,
                    distanceSliderWidth.current,
                  ),
                );
              }}
              onPress={handleDistanceTap}
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.distanceFill,
                  {
                    width: Animated.add(
                      distanceAnimX,
                      new Animated.Value(thumbSize / 2),
                    ) as any,
                  },
                ]}
              />

              <Animated.View
                {...distancePanResponder.panHandlers}
                style={[
                  styles.animatedThumb,
                  {
                    transform: [{ translateX: distanceAnimX }],
                  },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              />

              <Animated.View
                style={[
                  styles.ageTooltip,
                  {
                    transform: [
                      {
                        translateX: Animated.add(
                          distanceAnimX,
                          new Animated.Value((thumbSize - 40) / 2),
                        ),
                      },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.ageTooltipText}>{distanceMiles}</Text>
                <View style={styles.tooltipTriangle} />
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.small}>1000</Text>
          </View>
        </View>

        {/* Relationship Type */}
        <Text style={styles.label}>Looking For</Text>
        <View style={styles.dropdownContainer}>
          <View ref={relationshipDropdownTriggerRef}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                if (showRelationshipDropdown) {
                  setShowRelationshipDropdown(false);
                  return;
                }
                openRelationshipDropdown();
              }}
            >
              <Text style={styles.dropdownText}>{relationshipType}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Permission */}
        <Text style={styles.label}>Location Permission</Text>
        <View style={styles.permissionContainer}>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              locationPermission && styles.permissionButtonSelected,
            ]}
            onPress={() => handleLocationPermission("while-using")}
          >
            <Text
              style={[
                styles.permissionText,
                locationPermission && styles.permissionTextSelected,
              ]}
            >
              Set Location Permissions
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={showRelationshipDropdown}
        animationType="fade"
        onRequestClose={() => setShowRelationshipDropdown(false)}
      >
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setShowRelationshipDropdown(false)}
        >
          <View
            style={[
              styles.dropdownMenuInline,
              {
                left: relationshipDropdownAnchor.x,
                top: relationshipDropdownAnchor.y,
                width: relationshipDropdownAnchor.width,
              },
            ]}
          >
            {relationshipOptions.map((option, index) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownOption,
                  index === relationshipOptions.length - 1 &&
                    styles.dropdownOptionLast,
                ]}
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push({
              pathname: "/screens/setup" as any,
              params: {
                userId: resolvedUserId,
                firstName: readParam(firstNameParam) ?? "",
                phone: readParam(phoneParam) ?? "",
                age: readParam(ageParam) ?? "",
                selectedFeet: readParam(selectedFeetParam) ?? "",
                selectedInches: readParam(selectedInchesParam) ?? "",
                heightLabel: readParam(heightLabelParam) ?? "",
                interests: selectedInterests.join("|"),
                minAge: String(minAge),
                maxAge: String(maxAge),
                distanceMiles: String(distanceMiles),
                relationshipType,
                locationPermission: locationPermission ?? "",
                latitude: location ? String(location.latitude) : "",
                longitude: location ? String(location.longitude) : "",
              },
            })
          }
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextIcon}>→</Text>
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    minHeight: "100%",
    overflow: "visible",
  },
  scroll: { flex: 1, overflow: "visible", zIndex: 20 },
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
  interestInputWrapper: {
    marginTop: 12,
    position: "relative",
    zIndex: 25,
  },
  interestInputContainer: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    padding: 8,
    minHeight: 52,
  },
  selectedInterestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  selectedInterestTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CBA6E8",
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
  },
  selectedInterestText: {
    fontSize: 13,
    color: "#111",
    fontWeight: "600",
  },
  removeInterestButton: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  removeInterestText: {
    color: "#111",
    fontSize: 12,
    lineHeight: 12,
    fontWeight: "700",
  },
  interestInput: {
    height: 32,
    paddingHorizontal: 4,
    color: "#111",
    fontSize: 14,
  },
  interestSuggestions: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 56,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
    zIndex: 30,
    elevation: 7,
  },
  interestSuggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  interestSuggestionLast: {
    borderBottomWidth: 0,
  },
  interestSuggestionText: {
    color: "#111",
    fontSize: 14,
  },
  ageRangeContainer: { marginTop: 12 },
  ageInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ageLabel: { fontSize: 14, fontWeight: "600", color: "#111" },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ageSlider: {
    flex: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 8,
    marginHorizontal: 12,
    justifyContent: "center",
  },
  animatedFill: {
    position: "absolute",
    left: 0,
    height: 8,
    backgroundColor: "#E2A9DB",
    borderRadius: 6,
  },
  animatedThumb: {
    position: "absolute",
    left: 0,
    width: 20,
    height: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#A893CE",
    top: -4,
  },
  ageTooltip: {
    position: "absolute",
    top: -36,
    width: 32,
    height: 24,
    left: 5,
    backgroundColor: "#FBE9DE",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ageTooltipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },
  tooltipTriangle: {
    position: "absolute",
    bottom: -2,
    left: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FBE9DE",
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
    height: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 8,
    marginHorizontal: 12,
    justifyContent: "center",
  },
  distanceFill: {
    position: "absolute",
    left: 0,
    height: 8,
    backgroundColor: "#E2A9DB",
    borderRadius: 6,
  },
  dropdownContainer: {
    marginTop: 8,
    position: "relative",
    zIndex: 30,
  },
  dropdown: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: { color: "#111", fontSize: 16, fontWeight: "500" },
  dropdownArrow: { color: "#111", fontSize: 12 },
  dropdownMenuInline: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
    zIndex: 10,
    elevation: 10,
  },
  dropdownModalOverlay: {
    flex: 1,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
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
    position: "absolute",
    bottom: 96,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    elevation: 100,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "rgba(251, 233, 222, 0.5)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  dotActive: {
    backgroundColor: "#A893CE",
    width: 12,
    height: 12,
    borderRadius: 9,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A893CE",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 24,
    top: -65,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A893CE",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 24,
    top: -65,
  },
  nextIcon: { fontSize: 24, color: "#000000" },
  backIcon: { fontSize: 24, color: "#000000" },
  heartTopLeft: {
    position: "absolute",
    top: -50,
    left: 0,
    width: 250,
    height: 210,
    zIndex: 0,
  },
  heartBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 250,
    height: 250,
    zIndex: 0,
  },
});
