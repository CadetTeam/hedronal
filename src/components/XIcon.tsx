import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface XIconProps {
  size?: number;
  style?: any;
}

// X.com logo SVG content from assets
// x-logo-light.svg: white X (for dark backgrounds)
// x-logo-dark.svg: black X (for light backgrounds)
const xLogoSvgLight = `<svg width="1200" height="1227" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="white"/>
</svg>`;

const xLogoSvgDark = `<svg width="1200" height="1227" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="black"/>
</svg>`;

export function XIcon({ size = 20, style }: XIconProps) {
  const { isDark } = useTheme();

  // Dark mode (dark background) → use white X (xLogoSvgLight)
  // Light mode (light background) → use black X (xLogoSvgDark)
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <SvgXml xml={isDark ? xLogoSvgLight : xLogoSvgDark} width={size} height={size} />
    </View>
  );
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
