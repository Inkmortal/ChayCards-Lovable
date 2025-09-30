/**
 * Tokyo Night Theme
 * Popular dark blue theme inspired by Tokyo's neon nights with semantic variable mapping
 * Official colors from Tokyo Night VS Code theme specifications
 */

import type { Theme } from './catppuccin';

export const tokyoNightStorm: Theme = {
  id: 'tokyo-night-storm',
  name: 'Tokyo Night Storm',
  className: 'dark',
  variables: {
    // Base System - Tokyo Night Storm
    '--background': '222 16% 16%',    // Background #24283b
    '--foreground': '215 14% 86%',    // Foreground #cfc9c2
    '--border': '220 13% 18%',        // Terminal Black #414868
    '--input': '220 13% 18%',         // Terminal Black #414868
    '--ring': '199 89% 48%',          // Blue #7aa2f7
    '--radius': '0.75rem',

    // Core Hierarchy (using authentic Tokyo Night colors)
    '--primary': '199 89% 48%',       // Blue #7aa2f7
    '--primary-foreground': '222 16% 16%',
    '--secondary': '220 13% 18%',     // Terminal Black #414868
    '--secondary-foreground': '215 14% 86%',
    '--tertiary': '267 84% 81%',      // Purple #bb9af7
    '--tertiary-foreground': '222 16% 16%',

    // State Semantics (using official Tokyo Night syntax colors)
    '--success': '158 64% 52%',       // Green #9ece6a
    '--success-foreground': '222 16% 16%',
    '--warning': '40 65% 64%',        // Yellow #e0af68
    '--warning-foreground': '222 16% 16%',
    '--destructive': '347 87% 76%',   // Red #f7768e
    '--destructive-foreground': '222 16% 16%',
    '--info': '199 89% 73%',          // Cyan #7dcfff
    '--info-foreground': '222 16% 16%',

    // Neutral Variety
    '--muted': '220 13% 18%',         // Terminal Black #414868
    '--muted-foreground': '220 9% 55%',   // Inactive text #565f89
    '--accent': '32 93% 66%',         // Orange #ff9e64
    '--accent-foreground': '222 16% 16%',

    // Surfaces
    '--card': '220 13% 18%',          // Terminal Black #414868
    '--card-foreground': '215 14% 86%',
    '--popover': '222 16% 16%',       // Background #24283b
    '--popover-foreground': '215 14% 86%'
  }
};

export const tokyoNightLight: Theme = {
  id: 'tokyo-night-light',
  name: 'Tokyo Night Day',
  variables: {
    // Base System - Tokyo Night Light
    '--background': '230 20% 98%',    // Light background
    '--foreground': '343 13% 20%',    // Dark text
    '--border': '230 14% 89%',        // Light border
    '--input': '230 14% 89%',         // Light input
    '--ring': '213 93% 54%',          // Blue focus
    '--radius': '0.75rem',

    // Core Hierarchy (adapted for light theme)
    '--primary': '213 93% 54%',       // Blue
    '--primary-foreground': '230 20% 98%',
    '--secondary': '230 14% 89%',     // Light secondary
    '--secondary-foreground': '343 13% 20%',
    '--tertiary': '262 83% 58%',      // Purple
    '--tertiary-foreground': '230 20% 98%',

    // State Semantics (adapted for light theme)
    '--success': '166 100% 37%',      // Green
    '--success-foreground': '230 20% 98%',
    '--warning': '40 65% 52%',        // Yellow
    '--warning-foreground': '230 20% 98%',
    '--destructive': '347 87% 57%',   // Red
    '--destructive-foreground': '230 20% 98%',
    '--info': '180 100% 25%',         // Cyan (darker for light theme)
    '--info-foreground': '230 20% 98%',

    // Neutral Variety
    '--muted': '230 14% 89%',         // Light muted
    '--muted-foreground': '343 13% 41%',  // Darker muted text
    '--accent': '40 65% 52%',         // Orange accent
    '--accent-foreground': '230 20% 98%',

    // Surfaces
    '--card': '230 20% 100%',         // White card
    '--card-foreground': '343 13% 20%',
    '--popover': '230 20% 98%',       // Light popover
    '--popover-foreground': '343 13% 20%'
  }
};