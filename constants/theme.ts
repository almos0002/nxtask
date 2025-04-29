import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const theme = {
  colors: {
    light: {
      primary: '#007AFF',
      secondary: '#5856D6',
      accent: '#FF9500',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
      background: '#FFFFFF',
      backgroundSecondary: '#F2F2F7',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#C6C6C8',
      card: '#FFFFFF',
      shadow: 'rgba(0, 0, 0, 0.1)',
      placeholder: '#C7C7CD',
      
      priority: {
        high: '#FF3B30',
        medium: '#FF9500',
        low: '#34C759',
      }
    },
    dark: {
      primary: '#0A84FF',
      secondary: '#5E5CE6',
      accent: '#FF9F0A',
      success: '#30D158',
      warning: '#FF9F0A',
      error: '#FF453A',
      background: '#000000',
      backgroundSecondary: '#1C1C1E',
      text: '#FFFFFF',
      textSecondary: '#8E8E93',
      border: '#38383A',
      card: '#1C1C1E',
      shadow: 'rgba(0, 0, 0, 0.3)',
      placeholder: '#48484A',
      
      priority: {
        high: '#FF453A',
        medium: '#FF9F0A',
        low: '#30D158',
      }
    }
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 4,
    m: 8,
    l: 12,
    xl: 16,
    xxl: 24,
    round: 9999,
  },
  typography: {
    fontFamily: {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semiBold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
    },
    fontSize: {
      xs: 12,
      s: 14,
      m: 16,
      l: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    },
    lineHeight: {
      body: 1.5,
      heading: 1.2,
    },
  },
  dimensions: {
    width,
    height,
    maxWidth: 500,
  },
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
  },
};