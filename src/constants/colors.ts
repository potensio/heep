// Brand Colors - BantuJual
export const colors = {
  // Primary
  primary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#9AE600',  // Main lime
    600: '#BBF451',  // Gradient start
    700: '#7CCF00',
  },
  
  // Accent Colors
  accent: {
    blue: '#155DFC',
    red: '#FB2C36',
    orange: '#F54802',
    yellow: '#F9F906',
  },
  
  // Neutral
  neutral: {
    900: '#0A0A0A',
    800: '#101828',
    700: '#364153',
    600: '#666666',
    400: '#9CA3AF',
    300: '#D1D5DB',
    200: '#E5E7EB',
    100: '#F3F4F6',
    0: '#FFFFFF',
  },
  
  // Tab Bar
  tabBar: {
    active: '#101828',
    inactive: '#666666',
    background: '#FFFFFF',
    border: '#E5E7EB',
  },
} as const;

export type Colors = typeof colors;
