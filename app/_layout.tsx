import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: "빠른 진단" }} />
        <Stack.Screen name="sessions" options={{ title: "세션 목록" }} />
        <Stack.Screen name="shot/[shotId]" options={{ title: "샷 기록" }} />
        <Stack.Screen name="session/[sessionId]" options={{ title: "세션 기록" }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
