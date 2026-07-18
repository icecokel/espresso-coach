import { useColorScheme } from "react-native";

const lightColors = {
  background: "#f3f4f1",
  backgroundAlt: "#e9efe9",
  surface: "#fcfcf8",
  surfaceAlt: "#e9efe9",
  surfaceStrong: "#d6dad3",
  border: "#d6dad3",
  borderDark: "#303832",
  text: "#151a17",
  textInverse: "#fbfcf8",
  muted: "#6d746e",
  mutedInverse: "#d7ded8",
  primary: "#174d43",
  primaryDark: "#103a33",
  accent: "#8c7a54",
  accentDark: "#6d5c3d",
  steel: "#7b8b80",
  ink: "#111614",
  inkSoft: "#26302b",
  keep: "#2f6a50",
  danger: "#aa4a3d",
  warning: "#8c6b35",
};

const darkColors: AppColors = {
  background: "#111614",
  backgroundAlt: "#1a211d",
  surface: "#171d1a",
  surfaceAlt: "#202922",
  surfaceStrong: "#303832",
  border: "#303832",
  borderDark: "#48524b",
  text: "#f1f3ee",
  textInverse: "#fbfcf8",
  muted: "#a0aaa2",
  mutedInverse: "#cfd8d1",
  primary: "#5f9a88",
  primaryDark: "#3f7869",
  accent: "#c2a56a",
  accentDark: "#a58c59",
  steel: "#82948a",
  ink: "#0b0f0d",
  inkSoft: "#202822",
  keep: "#80b89b",
  danger: "#df8a7e",
  warning: "#d0ad68",
};

export type AppColors = typeof lightColors;
export type AppTheme = {
  colors: AppColors;
  colorScheme: "light" | "dark";
};

export function useAppTheme(): AppTheme {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  return {
    colors: colorScheme === "dark" ? darkColors : lightColors,
    colorScheme,
  };
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  pill: 999,
};

export const layout = {
  screenPadding: spacing.lg,
  scrollBottomPadding: 40,
  minTouchSize: 44,
  contentMaxWidth: 1120,
};

const fontFamily = {
  regular: "Pretendard-Regular",
  medium: "Pretendard-Medium",
  semiBold: "Pretendard-SemiBold",
  bold: "Pretendard-Bold",
  extraBold: "Pretendard-ExtraBold",
  black: "Pretendard-Black",
} as const;

export const typography = {
  screenTitle: {
    fontFamily: fontFamily.extraBold,
    fontSize: 22,
    lineHeight: 28,
  },
  screenSubtitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: fontFamily.extraBold,
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 21,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 17,
  },
  meta: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  strongMeta: {
    fontFamily: fontFamily.extraBold,
    fontSize: 12,
    lineHeight: 16,
  },
  numeric: {
    fontFamily: fontFamily.extraBold,
    fontSize: 18,
    lineHeight: 24,
  },
  button: {
    fontFamily: fontFamily.extraBold,
    fontSize: 16,
    lineHeight: 22,
  },
  resultAction: {
    fontFamily: fontFamily.black,
    fontSize: 28,
    lineHeight: 34,
  },
  navigationTitle: {
    fontFamily: fontFamily.extraBold,
  },
} as const;
