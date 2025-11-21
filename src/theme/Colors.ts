export type ThemeMode = "light" | "dark";

const lightColors = {
  white: "#FFFFFF",
  black: "#1E1E1E",
  red: "#E95744",
  primary: "#2F66B8",
  green: "#00A02DB2",
  grey: "#505C67",
  title: "#444444",
  darkGrey: "#172533",
  liteGrey: "#ADADAD",
  mediumGrey: "#757575",
  liteBlue: "#3F72B8",
  primaryBlue: "#5280BF",
  primaryGrey: "#5A6684",
  secondaryGrey: "#1F2A37",
  dustGrey: "#D9D9D9",
  purple: "#303F9F",
  AthensGray: "#F3F4F6",
  EbonyClay: "#1F2937",
  Nevada: "#6C7278",
  Shark: "#1A1C1E",
  background: "#FFFFFF",
  card: "#FFFFFF",
  surface: "#FAFAFA",
  border: "#E5E7EB",
  text: "#1E1E1E",
  secondaryText: "#4B5563",
  inputBackground: "#F5F6F8",
  placeholder: "#9CA3AF",
};

export type ThemeColors = typeof lightColors;

const darkColors: ThemeColors = {
  ...lightColors,
  background: "#050608",
  card: "#0F1117",
  surface: "#161A23",
  border: "#2A2F3A",
  text: "#F5F6F8",
  secondaryText: "#D1D5DB",
  title: "#E5E7EB",
  inputBackground: "#11131A",
  placeholder: "#6B7280",
};

export const Colors: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
