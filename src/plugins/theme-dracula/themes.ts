/**
 * Dracula Theme
 * Popular dark theme with purple accents and semantic variable mapping
 * Official colors from https://draculatheme.com/spec
 */

import type { Theme } from '../core-theme/themes';

export const draculaDark: Theme = {
  id: 'dracula-dark',
  name: 'Dracula',
  className: 'dark',
  variables: {
    // Base System - Dracula
    '--background': '230 15% 15%',    // Background #282A36
    '--foreground': '60 30% 96%',     // Foreground #F8F8F2
    '--border': '231 15% 18%',        // Current Line #44475A
    '--input': '231 15% 18%',         // Current Line #44475A
    '--ring': '265 89% 78%',          // Purple #BD93F9
    '--radius': '0.75rem',

    // Core Hierarchy (using authentic Dracula colors)
    '--primary': '265 89% 78%',       // Purple #BD93F9
    '--primary-foreground': '230 15% 15%',
    '--secondary': '231 15% 18%',     // Current Line #44475A
    '--secondary-foreground': '60 30% 96%',
    '--tertiary': '326 100% 74%',     // Pink #FF79C6
    '--tertiary-foreground': '230 15% 15%',

    // State Semantics (using official Dracula colors)
    '--success': '135 94% 65%',       // Green #50FA7B
    '--success-foreground': '230 15% 15%',
    '--warning': '65 92% 76%',        // Yellow #F1FA8C
    '--warning-foreground': '230 15% 15%',
    '--destructive': '0 100% 67%',    // Red #FF5555
    '--destructive-foreground': '230 15% 15%',
    '--info': '191 97% 77%',          // Cyan #8BE9FD
    '--info-foreground': '230 15% 15%',

    // Neutral Variety
    '--muted': '231 15% 18%',         // Current Line #44475A
    '--muted-foreground': '226 14% 71%',  // Comment #6272A4
    '--accent': '31 100% 71%',        // Orange #FFB86C
    '--accent-foreground': '230 15% 15%',

    // Surfaces
    '--card': '231 15% 18%',          // Current Line #44475A
    '--card-foreground': '60 30% 96%',
    '--popover': '230 15% 15%',       // Background #282A36
    '--popover-foreground': '60 30% 96%'
  }
};
