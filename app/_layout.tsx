import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getFontLoadState } from "../src/native/fontLoadState";
import {
  layout,
  radius,
  spacing,
  typography,
  useAppTheme,
  type AppColors,
} from "../src/native/theme";

const fontAssets = {
  "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
  "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
  "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.otf"),
  "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
  "Pretendard-ExtraBold": require("../assets/fonts/Pretendard-ExtraBold.otf"),
  "Pretendard-Black": require("../assets/fonts/Pretendard-Black.otf"),
};

export default function RootLayout() {
  const { colors, colorScheme } = useAppTheme();
  const [fontLoadAttempt, setFontLoadAttempt] = useState(0);

  return (
    <FontGate
      colorScheme={colorScheme}
      colors={colors}
      key={fontLoadAttempt}
      onRetry={() => setFontLoadAttempt((attempt) => attempt + 1)}
    />
  );
}

function FontGate({
  colorScheme,
  colors,
  onRetry,
}: {
  colorScheme: "light" | "dark";
  colors: AppColors;
  onRetry: () => void;
}) {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const fontLoadState = getFontLoadState(fontsLoaded, fontError);

  if (fontLoadState !== "ready") {
    return (
      <FontLoadingFallback
        colorScheme={colorScheme}
        colors={colors}
        onRetry={onRetry}
        state={fontLoadState}
      />
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: typography.navigationTitle,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sessions" options={{ title: "세션 목록" }} />
        <Stack.Screen name="shot/[shotId]" options={{ title: "샷 기록" }} />
        <Stack.Screen name="session/[sessionId]" options={{ title: "세션 기록" }} />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </>
  );
}

function FontLoadingFallback({
  colorScheme,
  colors,
  onRetry,
  state,
}: {
  colorScheme: "light" | "dark";
  colors: AppColors;
  onRetry: () => void;
  state: "loading" | "error";
}) {
  const styles = createFallbackStyles(colors);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {state === "loading" ? (
          <>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.title}>불러오는 중</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>글꼴을 불러오지 못했습니다.</Text>
            <Text style={styles.description}>
              네트워크 상태를 확인한 뒤 다시 시도해주세요.
            </Text>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
          </>
        )}
      </View>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </View>
  );
}

function createFallbackStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      alignItems: "center",
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: "center",
      padding: layout.screenPadding,
    },
    content: {
      alignItems: "center",
      gap: spacing.md,
      maxWidth: 320,
    },
    title: {
      color: colors.text,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    description: {
      color: colors.muted,
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      textAlign: "center",
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: colors.primaryDark,
      borderRadius: radius.sm,
      justifyContent: "center",
      marginTop: spacing.sm,
      minHeight: layout.minTouchSize,
      minWidth: 112,
      paddingHorizontal: spacing.lg,
    },
    retryButtonText: {
      color: colors.textInverse,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
    },
  });
}
