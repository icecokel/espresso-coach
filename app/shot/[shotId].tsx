import { useLocalSearchParams } from "expo-router";
import { ShotDetailScreen } from "../../src/native/screens/shot-detail-screen";

export default function ShotDetailRoute() {
  const { shotId } = useLocalSearchParams<{ shotId: string }>();
  return <ShotDetailScreen shotId={shotId} />;
}
