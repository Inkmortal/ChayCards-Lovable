/**
 * Gruvbox Theme
 * Retro groove color scheme with warm earth tones
 */

import type { Theme } from './catppuccin';

export const gruvboxDark: Theme = {
  id: 'gruvbox-dark',
  name: 'Gruvbox Dark',
  className: 'dark',
  variables: {
    // Core colors - Gruvbox Dark palette
    '--background': '36 6% 15%',
    '--foreground': '40 14% 92%',
    '--card': '36 5% 18%',
    '--card-foreground': '40 14% 92%',
    '--popover': '36 6% 15%',
    '--popover-foreground': '40 14% 92%',
    '--primary': '45 85% 54%',
    '--primary-foreground': '36 6% 15%',
    '--secondary': '36 5% 18%',
    '--secondary-foreground': '40 14% 92%',
    '--muted': '36 5% 18%',
    '--muted-foreground': '40 11% 74%',
    '--accent': '142 60% 60%',
    '--accent-foreground': '36 6% 15%',
    '--destructive': '4 69% 67%',
    '--destructive-foreground': '40 14% 92%',
    '--border': '36 5% 18%',
    '--input': '36 5% 18%',
    '--ring': '45 85% 54%',
    '--radius': '0.75rem',

    // Gruvbox vibrant colors
    '--blue': '205 82% 66%',
    '--blue-foreground': '36 6% 15%',
    '--green': '142 60% 60%',
    '--green-foreground': '36 6% 15%',
    '--orange': '28 100% 71%',
    '--orange-foreground': '36 6% 15%',
    '--purple': '288 75% 84%',
    '--purple-foreground': '36 6% 15%',
    '--pink': '315 100% 79%',
    '--pink-foreground': '36 6% 15%',
    '--teal': '166 73% 58%',
    '--teal-foreground': '36 6% 15%',

    // Warm earth tone shadows
    '--shadow-sm': '0 2px 4px hsl(36 6% 10% / 0.4)',
    '--shadow-md': '0 4px 12px hsl(36 6% 10% / 0.5), 0 2px 4px hsl(36 6% 10% / 0.3)',
    '--shadow-lg': '0 8px 25px hsl(36 6% 10% / 0.6), 0 4px 10px hsl(36 6% 10% / 0.4)',
    '--shadow-3d': '0 6px 0 hsl(36 6% 10% / 0.5), 0 10px 20px hsl(36 6% 10% / 0.6)',
    '--shadow-3d-thick': '0 8px 0 hsl(36 6% 10% / 0.6), 0 12px 25px hsl(36 6% 10% / 0.7)',
    '--shadow-3d-chunky': '0 10px 0 hsl(36 6% 10% / 0.7), 0 15px 30px hsl(36 6% 10% / 0.8)'
  }
};

export const gruvboxLight: Theme = {
  id: 'gruvbox-light',
  name: 'Gruvbox Light',
  variables: {
    // Core colors - Gruvbox Light palette
    '--background': '36 67% 97%',
    '--foreground': '40 6% 20%',
    '--card': '36 67% 100%',
    '--card-foreground': '40 6% 20%',
    '--popover': '36 67% 97%',
    '--popover-foreground': '40 6% 20%',
    '--primary': '45 60% 38%',
    '--primary-foreground': '36 67% 97%',
    '--secondary': '36 47% 89%',
    '--secondary-foreground': '40 6% 20%',
    '--muted': '36 47% 89%',
    '--muted-foreground': '40 6% 41%',
    '--accent': '142 25% 40%',
    '--accent-foreground': '36 67% 97%',
    '--destructive': '4 68% 42%',
    '--destructive-foreground': '36 67% 97%',
    '--border': '36 47% 89%',
    '--input': '36 47% 89%',
    '--ring': '45 60% 38%',
    '--radius': '0.75rem',

    // Gruvbox Light vibrant colors
    '--blue': '205 100% 36%',
    '--blue-foreground': '36 67% 97%',
    '--green': '142 25% 40%',
    '--green-foreground': '36 67% 97%',
    '--orange': '28 100% 42%',
    '--orange-foreground': '36 67% 97%',
    '--purple': '288 75% 25%',
    '--purple-foreground': '36 67% 97%',
    '--pink': '315 100% 35%',
    '--pink-foreground': '36 67% 97%',
    '--teal': '166 73% 28%',
    '--teal-foreground': '36 67% 97%',

    // Warm light shadows
    '--shadow-sm': '0 2px 4px hsl(40 6% 20% / 0.1)',
    '--shadow-md': '0 4px 12px hsl(40 6% 20% / 0.15), 0 2px 4px hsl(40 6% 20% / 0.1)',
    '--shadow-lg': '0 8px 25px hsl(40 6% 20% / 0.2), 0 4px 10px hsl(40 6% 20% / 0.1)',
    '--shadow-3d': '0 6px 0 hsl(40 6% 20% / 0.2), 0 8px 15px hsl(40 6% 20% / 0.15)',
    '--shadow-3d-thick': '0 8px 0 hsl(40 6% 20% / 0.3), 0 12px 20px hsl(40 6% 20% / 0.2)',
    '--shadow-3d-chunky': '0 10px 0 hsl(40 6% 20% / 0.4), 0 15px 25px hsl(40 6% 20% / 0.25)'
  }
};