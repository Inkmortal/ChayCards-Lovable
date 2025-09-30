/**
 * Gruvbox Theme
 * Retro groove color scheme with warm earth tones and semantic variable mapping
 * Official colors from https://github.com/morhetz/gruvbox
 */

import type { Theme } from './catppuccin';

export const gruvboxDark: Theme = {
  id: 'gruvbox-dark',
  name: 'Gruvbox Dark',
  className: 'dark',
  variables: {
    // Base System - Gruvbox Dark
    '--background': '36 6% 15%',      // dark0 #282828
    '--foreground': '40 14% 92%',     // light0 #fbf1c7
    '--border': '36 5% 18%',          // dark1 #3c3836
    '--input': '36 5% 18%',           // dark1 #3c3836
    '--ring': '45 85% 54%',           // bright_yellow #fabd2f
    '--radius': '0.75rem',

    // Core Hierarchy (using authentic Gruvbox colors)
    '--primary': '45 85% 54%',        // bright_yellow #fabd2f
    '--primary-foreground': '36 6% 15%',
    '--secondary': '36 5% 18%',       // dark1 #3c3836
    '--secondary-foreground': '40 14% 92%',
    '--tertiary': '28 100% 71%',      // bright_orange #fe8019
    '--tertiary-foreground': '36 6% 15%',

    // State Semantics (using official Gruvbox bright colors)
    '--success': '142 60% 60%',       // bright_green #b8bb26
    '--success-foreground': '36 6% 15%',
    '--warning': '45 85% 58%',        // bright_yellow #fabd2f (slightly adjusted)
    '--warning-foreground': '36 6% 15%',
    '--destructive': '4 69% 67%',     // bright_red #fb4934
    '--destructive-foreground': '36 6% 15%',
    '--info': '205 82% 66%',          // bright_blue #83a598
    '--info-foreground': '36 6% 15%',

    // Neutral Variety
    '--muted': '36 5% 18%',           // dark1 #3c3836
    '--muted-foreground': '40 11% 74%',   // gray_245 #928374
    '--accent': '166 73% 58%',        // bright_aqua #8ec07c
    '--accent-foreground': '36 6% 15%',

    // Surfaces
    '--card': '36 5% 18%',            // dark1 #3c3836
    '--card-foreground': '40 14% 92%',
    '--popover': '36 6% 15%',         // dark0 #282828
    '--popover-foreground': '40 14% 92%'
  }
};

export const gruvboxLight: Theme = {
  id: 'gruvbox-light',
  name: 'Gruvbox Light',
  variables: {
    // Base System - Gruvbox Light
    '--background': '36 67% 97%',     // light0 #fbf1c7
    '--foreground': '40 6% 20%',      // dark0 equivalent for light theme
    '--border': '36 47% 89%',         // light2 #d5c4a1
    '--input': '36 47% 89%',          // light2 #d5c4a1
    '--ring': '45 60% 38%',           // neutral_yellow #d79921
    '--radius': '0.75rem',

    // Core Hierarchy (using authentic Gruvbox neutral colors for light theme)
    '--primary': '45 60% 38%',        // neutral_yellow #d79921
    '--primary-foreground': '36 67% 97%',
    '--secondary': '36 47% 89%',      // light2 #d5c4a1
    '--secondary-foreground': '40 6% 20%',
    '--tertiary': '28 100% 42%',      // neutral_orange #d65d0e
    '--tertiary-foreground': '36 67% 97%',

    // State Semantics (using Gruvbox neutral colors for light theme)
    '--success': '142 25% 40%',       // neutral_green #98971a
    '--success-foreground': '36 67% 97%',
    '--warning': '45 60% 38%',        // neutral_yellow #d79921
    '--warning-foreground': '36 67% 97%',
    '--destructive': '4 68% 42%',     // neutral_red #cc241d
    '--destructive-foreground': '36 67% 97%',
    '--info': '205 100% 36%',         // neutral_blue #458588
    '--info-foreground': '36 67% 97%',

    // Neutral Variety
    '--muted': '36 47% 89%',          // light2 #d5c4a1
    '--muted-foreground': '40 6% 41%',    // gray equivalent
    '--accent': '166 73% 28%',        // neutral_aqua #689d6a
    '--accent-foreground': '36 67% 97%',

    // Surfaces
    '--card': '36 67% 100%',          // Pure white surface
    '--card-foreground': '40 6% 20%',
    '--popover': '36 67% 97%',        // light0 #fbf1c7
    '--popover-foreground': '40 6% 20%'
  }
};