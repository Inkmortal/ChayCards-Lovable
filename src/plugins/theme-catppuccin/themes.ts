/**
 * Catppuccin Theme Variants
 * Popular warm and cozy color scheme with semantic variable mapping
 * Official colors from https://catppuccin.com/palette
 */

import type { Theme, ThemeVariables } from '../core-theme/themes';

export const catppuccinLatte: Theme = {
  id: 'catppuccin-latte',
  name: 'Catppuccin Latte',
  variables: {
    // Base System - Catppuccin Latte
    '--background': '220 23% 95%',    // Base #eff1f5
    '--foreground': '234 16% 35%',    // Text #4c4f69
    '--border': '228 24% 88%',        // Surface 1 #bcc0cc
    '--input': '228 24% 88%',         // Surface 1 #bcc0cc
    '--ring': '266 85% 58%',          // Mauve #8839ef
    '--radius': '0.75rem',

    // Core Hierarchy (using authentic Catppuccin colors)
    '--primary': '266 85% 58%',       // Mauve #8839ef
    '--primary-foreground': '220 23% 95%',
    '--secondary': '228 24% 88%',     // Surface 1 #bcc0cc
    '--secondary-foreground': '234 16% 35%',
    '--tertiary': '316 73% 52%',      // Pink #ea76cb
    '--tertiary-foreground': '220 23% 95%',

    // State Semantics (using official Catppuccin colors)
    '--success': '109 58% 40%',       // Green #40a02b
    '--success-foreground': '220 23% 95%',
    '--warning': '35 88% 72%',        // Yellow #df8e1d (converted to HSL)
    '--warning-foreground': '220 23% 95%',
    '--destructive': '347 87% 44%',   // Red #d20f39
    '--destructive-foreground': '220 23% 95%',
    '--info': '220 91% 54%',          // Blue #1e66f5
    '--info-foreground': '220 23% 95%',

    // Neutral Variety
    '--muted': '228 24% 88%',         // Surface 1 #bcc0cc
    '--muted-foreground': '233 13% 54%',  // Subtext 0 #6c6f85
    '--accent': '35 77% 49%',         // Peach #fe640b (converted to HSL)
    '--accent-foreground': '220 23% 95%',

    // Surfaces
    '--card': '220 23% 98%',          // Mantle #e6e9ef
    '--card-foreground': '234 16% 35%',
    '--popover': '220 23% 95%',       // Base #eff1f5
    '--popover-foreground': '234 16% 35%'
  }
};

export const catppuccinFrappe: Theme = {
  id: 'catppuccin-frappe',
  name: 'Catppuccin Frappé',
  className: 'dark',
  variables: {
    // Base System - Catppuccin Frappé
    '--background': '229 19% 23%',    // Base #303446
    '--foreground': '227 68% 88%',    // Text #c6d0f5
    '--border': '230 19% 26%',        // Surface 0 #414559
    '--input': '230 19% 26%',         // Surface 0 #414559
    '--ring': '267 84% 81%',          // Mauve #ca9ee6
    '--radius': '0.75rem',

    // Core Hierarchy (using authentic Catppuccin Frappé colors)
    '--primary': '267 84% 81%',       // Mauve #ca9ee6
    '--primary-foreground': '229 19% 23%',
    '--secondary': '230 19% 26%',     // Surface 0 #414559
    '--secondary-foreground': '227 68% 88%',
    '--tertiary': '316 73% 69%',      // Pink #f4b8e4
    '--tertiary-foreground': '229 19% 23%',

    // State Semantics (using official Catppuccin Frappé colors)
    '--success': '115 54% 76%',       // Green #a6d189
    '--success-foreground': '229 19% 23%',
    '--warning': '35 88% 72%',        // Yellow #e5c890 (converted to HSL)
    '--warning-foreground': '229 19% 23%',
    '--destructive': '0 69% 67%',     // Red #e78284
    '--destructive-foreground': '229 19% 23%',
    '--info': '217 92% 76%',          // Blue #8caaee
    '--info-foreground': '229 19% 23%',

    // Neutral Variety
    '--muted': '230 19% 26%',         // Surface 0 #414559
    '--muted-foreground': '228 39% 80%',  // Subtext 0 #a5adce
    '--accent': '35 88% 72%',         // Peach #ef9f76 (converted to HSL)
    '--accent-foreground': '229 19% 23%',

    // Surfaces
    '--card': '230 19% 26%',          // Surface 0 #414559
    '--card-foreground': '227 68% 88%',
    '--popover': '229 19% 23%',       // Base #303446
    '--popover-foreground': '227 68% 88%'
  }
};
