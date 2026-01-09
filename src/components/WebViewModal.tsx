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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
