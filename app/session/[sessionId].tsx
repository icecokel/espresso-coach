import { useLocalSearchParams } from "expo-router";
import { SessionDetailScreen } from "../../src/native/screens/session-detail-screen";

export default function SessionDetailRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return <SessionDetailScreen sessionId={sessionId} />;
}
