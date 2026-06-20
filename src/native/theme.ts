export const colors = {
  background: "#f3f6f8",
  backgroundAlt: "#e8eef2",
  surface: "#ffffff",
  surfaceAlt: "#eef6f4",
  surfaceStrong: "#d6dee3",
  border: "#d6dee3",
  borderDark: "#27313d",
  text: "#162027",
  textInverse: "#f7f9f6",
  muted: "#68747d",
  mutedInverse: "#c9d3d8",
  primary: "#0b6f78",
  primaryDark: "#095b63",
  accent: "#2454d6",
  accentDark: "#1d45b7",
  steel: "#7fa7b5",
  ink: "#111820",
  inkSoft: "#22303a",
  keep: "#2f7d5c",
  danger: "#c24135",
  warning: "#b7791f",
};

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
};

export const fontFamily = {
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
