import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useApp } from "@/src/context/AppContext";

type Props = {
  recording: boolean;
  onPress: () => void;
  size?: number;
  testID?: string;
};

export default function MicButton({ recording, onPress, size = 140, testID }: Props) {
  const { colors } = useApp();
  const pulse = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    if (recording) {
      pulse.value = 0;
      pulse.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [recording, pulse]);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: 0.4 - pulse.value * 0.4,
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: 0.3 - pulse.value * 0.3,
    transform: [{ scale: 1 + pulse.value * 1.1 }],
  }));
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const ringSize = size + 20;
  const ringSize2 = size + 60;

  return (
    <View style={[styles.wrap, { width: ringSize2, height: ringSize2 }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: ringSize2,
            height: ringSize2,
            borderRadius: ringSize2 / 2,
            backgroundColor: colors.primaryGlow,
          },
          ring2Style,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            backgroundColor: colors.primaryGlow,
          },
          ring1Style,
        ]}
      />
      <Animated.View style={[btnStyle]}>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={recording ? "Ferma registrazione" : "Avvia registrazione"}
          onPressIn={() => {
            press.value = withTiming(0.94, { duration: 80 });
          }}
          onPressOut={() => {
            press.value = withTiming(1, { duration: 120 });
          }}
          onPress={onPress}
          style={({ pressed }) => [
            styles.btn,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.95 : 1,
              shadowColor: colors.primary,
            },
          ]}
        >
          <Ionicons
            name={recording ? "stop" : "mic"}
            size={size * 0.42}
            color="#FFFFFF"
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});
