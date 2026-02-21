import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    Modal, PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity, useWindowDimensions, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountSetup() {
  const insets = useSafeAreaInsets();
  const MIN_AGE = 18;
  const MAX_AGE = 100;

  const [age, setAge] = useState(MIN_AGE);
  const sliderWidth = useRef(0);
  const leftPadding = 8; // matches fakeFill left offset in styles
  const thumbSize = 20;

  const animX = useRef(new Animated.Value(0)).current; // 0 .. usableWidth

  // Height picker state
  const { height: windowHeight } = useWindowDimensions();
  const pickerHeight = Math.round(windowHeight / 2);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const feetOptions = Array.from({ length: 5 }, (_, i) => 3 + i); // 3..7
  const inchesOptions = Array.from({ length: 12 }, (_, i) => i); // 0..11
  const itemHeight = 44;
  const headerHeight = 44;
  const saveAreaHeight = 72;
  const wheelsHeight = Math.max(itemHeight * 3, pickerHeight - headerHeight - saveAreaHeight);
  const centerOffset = Math.round(wheelsHeight / 2 - itemHeight / 2);
  const [selectedFeet, setSelectedFeet] = useState(3);
  const [selectedInches, setSelectedInches] = useState(0);
  const feetRef = useRef<ScrollView | null>(null);
  const inchesRef = useRef<ScrollView | null>(null);
  const [heightLabel, setHeightLabel] = useState(`${selectedFeet}' ${selectedInches}"`);

  const [phone, setPhone] = useState("");

  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, "").substring(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  useEffect(() => {
    const id = animX.addListener(({ value }) => {
      const usable = Math.max(0, sliderWidth.current - thumbSize);
      if (usable <= 0) return;
      const ratio = value / usable;
      const newAge = Math.round(MIN_AGE + ratio * (MAX_AGE - MIN_AGE));
      setAge(newAge);
    });
    return () => animX.removeListener(id);
  }, [animX]);

  useEffect(() => {
    // set initial position once slider size known
    if (sliderWidth.current > 0) {
      const usable = Math.max(0, sliderWidth.current - thumbSize);
      const initial = ((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * usable;
      animX.setValue(initial);
    }
  }, [animX, age]);

  const panRef = useRef<{ startX: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        animX.stopAnimation((value: number) => {
          panRef.current = { startX: value };
        });
      },
      onPanResponderMove: (_, gs) => {
        if (!panRef.current) return;
        const usable = Math.max(0, sliderWidth.current - thumbSize);
        const next = Math.min(Math.max(0, panRef.current.startX + gs.dx), usable);
        animX.setValue(next);
      },
      onPanResponderRelease: () => {
        panRef.current = null;
      },
    })
  ).current;

  const handleSliderTap = (e: any) => {
    const { locationX } = e.nativeEvent;
    const usable = Math.max(0, sliderWidth.current - thumbSize);
    const tapPosition = Math.min(Math.max(0, locationX - thumbSize / 2), usable);
    animX.setValue(tapPosition);
  };

  return (
    <LinearGradient
      colors={["#FE9FB8", "#FEB2AB"]}
      style={[styles.gradient, { paddingTop: insets.top }]}
    >
      {/* decorative corner images (fixed, non-interactive) */}
      <View style={styles.cornerTopRight} pointerEvents="none">
        <Image source={require("../../assets/images/corner.png")} style={{ width: "100%", height: "100%", resizeMode: "contain" }} />
      </View>
      <View style={styles.squiggleBottomLeft} pointerEvents="none">
        <Image source={require("../../assets/images/squiggle.png")} style={{ width: "100%", height: "100%", resizeMode: "contain" }} />
      </View>

      <View style={[styles.scroll, styles.content]}>
        <Text style={styles.heading}>Account Setup</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput placeholder="First" style={styles.input} />

        <Text style={styles.label}>Age</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.small}>{MIN_AGE}</Text>
          <TouchableOpacity
            style={styles.ageSlider}
            onLayout={(e) => {
              sliderWidth.current = e.nativeEvent.layout.width;
              const usable = Math.max(0, sliderWidth.current - thumbSize);
              const initial = ((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * usable;
              animX.setValue(initial);
            }}
            onPress={handleSliderTap}
            activeOpacity={1}
          >
            <Animated.View
              style={[
                styles.animatedFill,
                {
                  width: Animated.add(animX, new Animated.Value(thumbSize / 2)) as any,
                },
              ]}
            />

            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.animatedThumb,
                {
                  transform: [
                    {
                      translateX: animX,
                    },
                  ],
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
                      translateX: Animated.add(animX, new Animated.Value((thumbSize - 40) / 2)),
                    },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.ageTooltipText}>{age}</Text>
              <View style={styles.tooltipTriangle} />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.small}>{MAX_AGE}</Text>
        </View>

        <Text style={styles.label}>Height</Text>
        <TouchableOpacity
          onPress={() => {
            setShowHeightPicker(true);
            // scroll to current selection after a tick
            setTimeout(() => {
              const fi = feetOptions.indexOf(selectedFeet);
              feetRef.current?.scrollTo({ y: fi * itemHeight, animated: false });
              inchesRef.current?.scrollTo({ y: selectedInches * itemHeight, animated: false });
            }, 50);
          }}
          style={[styles.input, styles.heightInput]}
        >
          <Text style={{ color: "#111" }}>{heightLabel}</Text>
        </TouchableOpacity>

        <Modal visible={showHeightPicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowHeightPicker(false)} />
            <View style={[styles.pickerContainer, { height: pickerHeight }]}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Height</Text>
              </View>
              <View style={[styles.wheelsWrapper, { height: wheelsHeight }]}> 
                <View style={styles.wheelsRow}>
                  <ScrollView
                    ref={feetRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    onScroll={(e) => {
                      const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
                      const val = feetOptions[Math.min(Math.max(0, idx), feetOptions.length - 1)];
                      if (val !== selectedFeet) {
                        setSelectedFeet(val);
                        setHeightLabel(`${val}' ${selectedInches}\"`);
                      }
                    }}
                    onMomentumScrollEnd={(e) => {
                      // ensure exact snap after momentum
                      const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
                      feetRef.current?.scrollTo({ y: idx * itemHeight, animated: true });
                      const val = feetOptions[Math.min(Math.max(0, idx), feetOptions.length - 1)];
                      setSelectedFeet(val);
                      setHeightLabel(`${val}' ${selectedInches}\"`);
                    }}
                    contentContainerStyle={{ paddingTop: centerOffset, paddingBottom: centerOffset }}
                    style={{ height: wheelsHeight, width: '45%', zIndex: 1 }}
                  >
                    {feetOptions.map((f) => (
                      <View key={f} style={[styles.wheelItem, { height: itemHeight }]}>
                        <Text style={f === selectedFeet ? styles.wheelItemActive : styles.wheelItemText}>{f}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.middleBarWrapper} pointerEvents="none">
                    <View style={styles.middleBar} />
                  </View>

                  <ScrollView
                    ref={inchesRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    onScroll={(e) => {
                      const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
                      const val = inchesOptions[Math.min(Math.max(0, idx), inchesOptions.length - 1)];
                      if (val !== selectedInches) {
                        setSelectedInches(val);
                        setHeightLabel(`${selectedFeet}' ${val}\"`);
                      }
                    }}
                    onMomentumScrollEnd={(e) => {
                      const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
                      inchesRef.current?.scrollTo({ y: idx * itemHeight, animated: true });
                      const val = inchesOptions[Math.min(Math.max(0, idx), inchesOptions.length - 1)];
                      setSelectedInches(val);
                      setHeightLabel(`${selectedFeet}' ${val}\"`);
                    }}
                    contentContainerStyle={{ paddingTop: centerOffset, paddingBottom: centerOffset }}
                    style={{ height: wheelsHeight, width: '45%', zIndex: 1 }}
                  >
                    {inchesOptions.map((inch) => (
                      <View key={inch} style={[styles.wheelItem, { height: itemHeight }]}>
                        <Text style={inch === selectedInches ? styles.wheelItemActive : styles.wheelItemText}>{inch}</Text>
                      </View>
                    ))}
                  </ScrollView>

                </View>

                {/* center highlight overlay placed behind wheels so item borders show */}
                <View pointerEvents="none" style={[styles.centerHighlight, { top: centerOffset, zIndex: 0 }]} />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  setHeightLabel(`${selectedFeet}' ${selectedInches}\"`);
                  setShowHeightPicker(false);
                }}
              >
                <Text style={styles.saveText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          placeholder="(xxx) xxx-xxxx"
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={14}
          value={phone}
          onChangeText={handlePhoneChange}
        />
        {phone.length > 0 && phone.replace(/\D/g, "").length < 10 && (
          <Text style={[styles.small, { color: "#FF4E85", marginTop: 4 }]}>Please enter 10 digits</Text>
        )}

        <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.nextButton}>
                <Text style={styles.nextIcon}>→</Text>
            </TouchableOpacity>
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    minHeight: "100%",
    overflow: "visible",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    zIndex: 1,
  },
  heading: {
    fontSize: 34,
    fontWeight: "700",
    marginTop: 36,
    marginBottom: 18,
    color: "#000",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    color: "#111",
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fbe9de90",
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#5b5071",
  },
  small: { fontSize: 12, color: "#111" },
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
  bottomRow: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  nextIcon: { fontSize: 24, color: "#000000" },

  cornerTopRight: {
    position: "absolute",
    top: -34,
    right: -14,
    width: 160,
    height: 160,
    zIndex: 0,
  },
  squiggleBottomLeft: {
    position: "absolute",
    bottom: -18,
    left: -36,
    width: 240,
    height: 240,
    zIndex: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    backgroundColor: "#FBE9DE",
    opacity:0.95,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  pickerHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  pickerTitle: { fontSize: 16, fontWeight: "700", color: "#000000" },
  wheelsRow: { flexDirection: "row", justifyContent: "space-between" },
  wheelItem: { alignItems: "center", justifyContent: "center" },
  wheelItemText: { fontSize: 18, color: "#000" },
  wheelItemActive: { fontSize: 22, color: "#000000", fontWeight: "700" },
  wheelsWrapper: { position: "relative", width: "100%", alignItems: "center", justifyContent: "center" },
  middleBarWrapper: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 32, alignItems: "center", justifyContent: "center", transform: [{ translateX: -16 }] },
  middleBar: { width: 6, height: 44, borderRadius: 3, backgroundColor: "#E2A9DB", opacity: 0.95 },
  saveButton: {
    marginTop: 12,
    backgroundColor: "#A893CE",
    paddingVertical: 12,
    borderRadius: 28,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  heightInput: { justifyContent: "center" },
  centerHighlight: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(123,77,225,0.25)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
