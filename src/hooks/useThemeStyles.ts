import { useMemo } from "react";
import type { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import type { ThemeColors, ThemeMode } from "../theme/Colors";

type StyleFactory<T> = (colors: ThemeColors, mode: ThemeMode) => T;

export const useThemeStyles = <
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(
  factory: StyleFactory<T>
): T => {
  const { colors, mode } = useTheme();
  return useMemo(() => factory(colors, mode), [colors, mode, factory]);
};

