import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AppConfirmationModal from "../components/AppConfirmationModal";

type AlertButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: "default" | "cancel" | "destructive";
};

type AlertOptions = {
  title?: string;
  message: string;
  buttons?: AlertButton[];
};

type AlertContextType = {
  showAlert: (options: AlertOptions) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Global alert manager for use outside React components
let globalAlertManager: ((options: AlertOptions) => void) | null = null;

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
};

// Global alert function that can be called from anywhere
export const showGlobalAlert = (options: AlertOptions) => {
  if (globalAlertManager) {
    globalAlertManager(options);
  } else {
    console.warn("AlertProvider not initialized. Cannot show alert.");
  }
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options);
    setIsVisible(true);
  }, []);

  // Register global alert manager
  useEffect(() => {
    globalAlertManager = showAlert;
    return () => {
      globalAlertManager = null;
    };
  }, [showAlert]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    const cancelButton = alertOptions?.buttons?.find(
      (btn) => btn.style === "cancel"
    );
    if (cancelButton?.onPress) {
      cancelButton.onPress();
    }
    // Clear options after a delay to allow animation to complete
    setTimeout(() => {
      setAlertOptions(null);
    }, 300);
  }, [alertOptions]);

  const handleConfirm = useCallback(async () => {
    setIsVisible(false);
    
    // Find the confirm/OK button (non-cancel button, or first button if only one)
    const buttons = alertOptions?.buttons || [];
    const effectiveButtons = buttons.length === 0 
      ? [{ text: "OK", style: "default" as const }]
      : buttons;
    let confirmButton: AlertButton | undefined;
    
    if (effectiveButtons.length === 1) {
      // Single button (usually OK)
      confirmButton = effectiveButtons[0];
    } else {
      // Multiple buttons - find the non-cancel button
      confirmButton = effectiveButtons.find((btn) => btn.style !== "cancel") || effectiveButtons[0];
    }
    
    if (confirmButton?.onPress) {
      try {
        await confirmButton.onPress();
      } catch (error) {
        console.error("Error in alert button handler:", error);
      }
    }
    
    // Clear options after a delay to allow animation to complete
    setTimeout(() => {
      setAlertOptions(null);
    }, 300);
  }, [alertOptions]);

  // Determine button configuration
  const buttons = alertOptions?.buttons || [];
  const hasNoButtons = buttons.length === 0;
  const hasSingleButton = buttons.length === 1;
  const hasMultipleButtons = buttons.length > 1;
  
  // Default to single "OK" button if no buttons provided
  const effectiveButtons = hasNoButtons 
    ? [{ text: "OK", style: "default" as const }]
    : buttons;
  
  const singleButton = hasSingleButton ? effectiveButtons[0] : null;
  
  // For single button (OK), show it as primary
  // For multiple buttons, show confirm as primary and cancel as secondary
  const yesButtonText =
    singleButton?.text || effectiveButtons.find((btn) => btn.style !== "cancel")?.text || "OK";
  const cancelButton = effectiveButtons.find((btn) => btn.style === "cancel");
  const noButtonText = cancelButton?.text || "Cancel";
  
  // Determine primary button color based on style
  const confirmButton = effectiveButtons.find((btn) => btn.style !== "cancel") || effectiveButtons[0];
  const isDestructive = confirmButton?.style === "destructive";
  const yesButtonColor = isDestructive ? "#EF5350" : undefined;
  
  // If only one button, don't show the cancel button
  const showCancelButton = hasMultipleButtons;

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertOptions && (
        <AppConfirmationModal
          isVisible={isVisible}
          onClose={handleClose}
          onConfirm={handleConfirm}
          message={alertOptions.message}
          yesButtonText={yesButtonText}
          noButtonText={noButtonText}
          primaryButton="yes"
          reverseButtons={false}
          yesButtonColor={yesButtonColor}
          yesButtonOutline={false}
          noButtonOutline={true}
          showCancelButton={showCancelButton}
        />
      )}
    </AlertContext.Provider>
  );
};

