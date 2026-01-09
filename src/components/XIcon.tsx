import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface XIconProps {
  size?: number;
  style?: any;
}

// X.com logo SVG - white version for dark backgrounds
const xLogoSvgWhite = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/>
</svg>`;

// X.com logo SVG - black version for light backgrounds
const xLogoSvgBlack = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="black"/>
</svg>`;

export function XIcon({ size = 20, style }: XIconProps) {
  const { isDark } = useTheme();

  // Use inline SVG (X.com official logo shape)
  // If you have custom SVG files, place them in assets/ as x-logo-light.svg and x-logo-dark.svg
  // and uncomment the try/catch block below
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <SvgXml
        xml={isDark ? xLogoSvgWhite : xLogoSvgBlack}
        width={size}
        height={size}
      />
    </View>
  );

  // Uncomment this block if you add x-logo-light.svg and x-logo-dark.svg to assets/
  /*
  try {
    const xLogoLight = require('../../assets/x-logo-light.svg');
    const xLogoDark = require('../../assets/x-logo-dark.svg');
    
    return (
      <Image
        source={isDark ? xLogoDark : xLogoLight}
        style={[styles.icon, { width: size, height: size }, style]}
        resizeMode="contain"
      />
    );
  } catch (error) {
    // Fallback to inline SVG
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <SvgXml
          xml={isDark ? xLogoSvgWhite : xLogoSvgBlack}
          width={size}
          height={size}
        />
      </View>
    );
  }
  */
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    tintColor: undefined, // Let the image use its natural colors
  },
});
