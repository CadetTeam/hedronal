export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    error: string;
    success: string;
    warning: string;
    border: string;
    borderLight: string;
    shadow: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    h1: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
    };
    h2: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
    };
    h3: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
    };
    body: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
    };
    caption: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
    };
  };
}

export const lightTheme: Theme = {
  colors: {
    background: '#F5F5DC', // Beige
    surface: '#F0E6D2', // Light beige
    surfaceVariant: '#E8DDC4', // Slightly darker beige
    text: '#3E2723', // Dark brown
    textSecondary: '#5D4037', // Medium brown
    textTertiary: '#8D6E63', // Light brown
    primary: '#8D6E63', // Brown
    primaryDark: '#5D4037', // Dark brown
    primaryLight: '#A1887F', // Light brown
    secondary: '#6B4423', // Coffee brown
    accent: '#8B6914', // Earthy gold
    error: '#C62828', // Deep red
    success: '#558B2F', // Forest green
    warning: '#F57C00', // Amber
    border: '#BCAAA4', // Light brown border
    borderLight: '#D7CCC8', // Very light brown border
    shadow: 'rgba(62, 39, 35, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
  },
};

export const darkTheme: Theme = {
  colors: {
    background: '#1B1B1B', // Very dark gray
    surface: '#2D2D2D', // Dark gray
    surfaceVariant: '#3E3E3E', // Medium dark gray
    text: '#F5F5DC', // Beige
    textSecondary: '#D7CCC8', // Light gray-beige
    textTertiary: '#BCAAA4', // Medium gray-beige
    primary: '#8D6E63', // Brown (same as light)
    primaryDark: '#5D4037', // Dark brown
    primaryLight: '#A1887F', // Light brown
    secondary: '#6B4423', // Coffee brown
    accent: '#D4AF37', // Gold
    error: '#EF5350', // Light red
    success: '#81C784', // Light green
    warning: '#FFB74D', // Light amber
    border: '#424242', // Dark gray border
    borderLight: '#616161', // Medium gray border
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
  },
};
