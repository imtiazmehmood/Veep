import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, type ThemeColors, type ThemeMode } from "../theme/Colors";

const THEME_STORAGE_KEY = "lotlogic.theme.mode";

type ThemeContextValue = {
  colors: ThemeColors;
  mode: ThemeMode;
  isDarkMode: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
          setMode(stored);
        }
      } catch (error) {
        console.warn("Failed to hydrate theme mode", error);
      } finally {
        // no-op
      }
    };

    hydrate();
  }, []);

  const persistMode = useCallback(async (nextMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (error) {
      console.warn("Failed to persist theme mode", error);
    }
  }, []);

  const setThemeMode = useCallback(
    (nextMode: ThemeMode) => {
      setMode(nextMode);
      persistMode(nextMode);
    },
    [persistMode]
  );

  const value = useMemo<ThemeContextValue>(() => {
    const isDarkMode = mode === "dark";
    return {
      mode,
      isDarkMode,
      colors: Colors[mode],
      setMode: setThemeMode,
      toggleMode: () => setThemeMode(isDarkMode ? "light" : "dark"),
    };
  }, [mode, setThemeMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

