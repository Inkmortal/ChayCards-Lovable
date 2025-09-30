/**
 * Dracula Theme
 * Popular dark theme with purple accents
 */

import type { Theme } from './catppuccin';

export const draculaDark: Theme = {
  id: 'dracula-dark',
  name: 'Dracula',
  className: 'dark',
  variables: {
    // Core colors - Dracula palette
    '--background': '230 15% 15%',
    '--foreground': '60 30% 96%',
    '--card': '231 15% 18%',
    '--card-foreground': '60 30% 96%',
    '--popover': '230 15% 15%',
    '--popover-foreground': '60 30% 96%',
    '--primary': '265 89% 78%',
    '--primary-foreground': '230 15% 15%',
    '--secondary': '231 15% 18%',
    '--secondary-foreground': '60 30% 96%',
    '--muted': '231 15% 18%',
    '--muted-foreground': '226 14% 71%',
    '--accent': '326 100% 74%',
    '--accent-foreground': '230 15% 15%',
    '--destructive': '0 62% 68%',
    '--destructive-foreground': '60 30% 96%',
    '--border': '231 15% 18%',
    '--input': '231 15% 18%',
    '--ring': '265 89% 78%',
    '--radius': '0.75rem',

    // Dracula vibrant colors
    '--blue': '191 97% 77%',
    '--blue-foreground': '230 15% 15%',
    '--green': '135 94% 65%',
    '--green-foreground': '230 15% 15%',
    '--orange': '31 100% 71%',
    '--orange-foreground': '230 15% 15%',
    '--purple': '265 89% 78%',
    '--purple-foreground': '230 15% 15%',
    '--pink': '326 100% 74%',
    '--pink-foreground': '230 15% 15%',
    '--teal': '170 100% 70%',
    '--teal-foreground': '230 15% 15%',

    // Dark 3D shadows
    '--shadow-sm': '0 2px 4px hsl(230 15% 10% / 0.4)',
    '--shadow-md': '0 4px 12px hsl(230 15% 10% / 0.5), 0 2px 4px hsl(230 15% 10% / 0.3)',
    '--shadow-lg': '0 8px 25px hsl(230 15% 10% / 0.6), 0 4px 10px hsl(230 15% 10% / 0.4)',
    '--shadow-3d': '0 6px 0 hsl(230 15% 10% / 0.5), 0 10px 20px hsl(230 15% 10% / 0.6)',
    '--shadow-3d-thick': '0 8px 0 hsl(230 15% 10% / 0.6), 0 12px 25px hsl(230 15% 10% / 0.7)',
    '--shadow-3d-chunky': '0 10px 0 hsl(230 15% 10% / 0.7), 0 15px 30px hsl(230 15% 10% / 0.8)'
  }
};