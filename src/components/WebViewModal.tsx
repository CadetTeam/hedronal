import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../context/ThemeContext';

interface WebViewModalProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  title?: string;
}

export function WebViewModal({ visible, url, onClose, title }: WebViewModalProps) {
  const { theme } = useTheme();

  React.useEffect(() => {
    if (visible && url) {
      // Open URL in full-screen browser using expo-web-browser
      // This works with Expo Go and provides a native full-screen experience
      // For a true in-app webview, you'll need to rebuild with react-native-webview
      WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: theme.colors.primary,
        toolbarColor: theme.colors.surface,
        enableBarCollapsing: false,
      })
        .then(() => {
          // Browser closed, call onClose
          onClose();
        })
        .catch((error) => {
          console.error('[WebViewModal] Error opening browser:', error);
          onClose();
        });
    }
  }, [visible, url, theme.colors.primary, theme.colors.surface, onClose]);

  // Return null since we're opening external browser
  // The modal UI isn't needed when using expo-web-browser
  return null;
}
