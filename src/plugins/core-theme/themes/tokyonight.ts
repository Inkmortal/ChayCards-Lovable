/**
 * Tokyo Night Theme
 * Popular dark blue theme inspired by Tokyo's neon nights
 */

import type { Theme } from './catppuccin';

export const tokyoNightStorm: Theme = {
  id: 'tokyo-night-storm',
  name: 'Tokyo Night Storm',
  className: 'dark',
  variables: {
    // Core colors - Tokyo Night Storm palette
    '--background': '222 16% 16%',
    '--foreground': '215 14% 86%',
    '--card': '220 13% 18%',
    '--card-foreground': '215 14% 86%',
    '--popover': '222 16% 16%',
    '--popover-foreground': '215 14% 86%',
    '--primary': '199 89% 48%',
    '--primary-foreground': '222 16% 16%',
    '--secondary': '220 13% 18%',
    '--secondary-foreground': '215 14% 86%',
    '--muted': '220 13% 18%',
    '--muted-foreground': '220 9% 55%',
    '--accent': '267 84% 81%',
    '--accent-foreground': '222 16% 16%',
    '--destructive': '0 72% 60%',
    '--destructive-foreground': '215 14% 86%',
    '--border': '220 13% 18%',
    '--input': '220 13% 18%',
    '--ring': '199 89% 48%',
    '--radius': '0.75rem',

    // Tokyo Night vibrant colors
    '--blue': '199 89% 48%',
    '--blue-foreground': '222 16% 16%',
    '--green': '158 64% 52%',
    '--green-foreground': '222 16% 16%',
    '--orange': '32 93% 66%',
    '--orange-foreground': '222 16% 16%',
    '--purple': '267 84% 81%',
    '--purple-foreground': '222 16% 16%',
    '--pink': '316 87% 65%',
    '--pink-foreground': '222 16% 16%',
    '--teal': '187 47% 55%',
    '--teal-foreground': '222 16% 16%',

    // Dark blue 3D shadows
    '--shadow-sm': '0 2px 4px hsl(222 16% 12% / 0.4)',
    '--shadow-md': '0 4px 12px hsl(222 16% 12% / 0.5), 0 2px 4px hsl(222 16% 12% / 0.3)',
    '--shadow-lg': '0 8px 25px hsl(222 16% 12% / 0.6), 0 4px 10px hsl(222 16% 12% / 0.4)',
    '--shadow-3d': '0 6px 0 hsl(222 16% 12% / 0.5), 0 10px 20px hsl(222 16% 12% / 0.6)',
    '--shadow-3d-thick': '0 8px 0 hsl(222 16% 12% / 0.6), 0 12px 25px hsl(222 16% 12% / 0.7)',
    '--shadow-3d-chunky': '0 10px 0 hsl(222 16% 12% / 0.7), 0 15px 30px hsl(222 16% 12% / 0.8)'
  }
};

export const tokyoNightLight: Theme = {
  id: 'tokyo-night-light',
  name: 'Tokyo Night Day',
  variables: {
    // Core colors - Tokyo Night Light palette
    '--background': '230 20% 98%',
    '--foreground': '343 13% 20%',
    '--card': '230 20% 100%',
    '--card-foreground': '343 13% 20%',
    '--popover': '230 20% 98%',
    '--popover-foreground': '343 13% 20%',
    '--primary': '213 93% 54%',
    '--primary-foreground': '230 20% 98%',
    '--secondary': '230 14% 89%',
    '--secondary-foreground': '343 13% 20%',
    '--muted': '230 14% 89%',
    '--muted-foreground': '343 13% 41%',
    '--accent': '262 83% 58%',
    '--accent-foreground': '230 20% 98%',
    '--destructive': '354 84% 57%',
    '--destructive-foreground': '230 20% 98%',
    '--border': '230 14% 89%',
    '--input': '230 14% 89%',
    '--ring': '213 93% 54%',
    '--radius': '0.75rem',

    // Tokyo Night Day vibrant colors
    '--blue': '213 93% 54%',
    '--blue-foreground': '230 20% 98%',
    '--green': '166 100% 37%',
    '--green-foreground': '230 20% 98%',
    '--orange': '40 65% 52%',
    '--orange-foreground': '230 20% 98%',
    '--purple': '262 83% 58%',
    '--purple-foreground': '230 20% 98%',
    '--pink': '336 84% 57%',
    '--pink-foreground': '230 20% 98%',
    '--teal': '180 100% 25%',
    '--teal-foreground': '230 20% 98%',

    // Light 3D shadows
    '--shadow-sm': '0 2px 4px hsl(343 13% 20% / 0.1)',
    '--shadow-md': '0 4px 12px hsl(343 13% 20% / 0.15), 0 2px 4px hsl(343 13% 20% / 0.1)',
    '--shadow-lg': '0 8px 25px hsl(343 13% 20% / 0.2), 0 4px 10px hsl(343 13% 20% / 0.1)',
    '--shadow-3d': '0 6px 0 hsl(343 13% 20% / 0.2), 0 8px 15px hsl(343 13% 20% / 0.15)',
    '--shadow-3d-thick': '0 8px 0 hsl(343 13% 20% / 0.3), 0 12px 20px hsl(343 13% 20% / 0.2)',
    '--shadow-3d-chunky': '0 10px 0 hsl(343 13% 20% / 0.4), 0 15px 25px hsl(343 13% 20% / 0.25)'
  }
};