/**
 * Chay Theme Variants
 * Girly pink aesthetic with plant green accents and white base
 * Designed for a feminine, cozy vibe inspired by pink rooms with plants
 */

import type { Theme } from '../core-theme/themes';

export const chayLight: Theme = {
  id: 'chay-light',
  name: 'Chay Light',
  category: 'light',
  tags: ['pink', 'feminine', 'plants', 'cozy'],
  author: 'ChayCards',
  description: 'Soft pink and plant green on pristine white - girly and fresh',
  source: 'plugin',
  variables: {
    // Base System - Soft whites and creams
    '--background': '0 0% 98%',         // Near-white #fafafa
    '--foreground': '340 15% 25%',      // Warm dark gray #453940
    '--border': '330 20% 90%',          // Soft pink border #f2e5ec
    '--input': '0 0% 95%',              // Light gray input #f2f2f2
    '--ring': '330 70% 60%',            // Rose pink focus #e56b9d
    '--radius': '0.75rem',

    // Core Hierarchy - Pink dominance with green accents
    '--primary': '330 70% 60%',         // Rose pink #e56b9d
    '--primary-foreground': '0 0% 100%',
    '--secondary': '340 30% 92%',       // Blush pink #f5e8ed
    '--secondary-foreground': '340 15% 25%',
    '--tertiary': '130 50% 50%',        // Fresh plant green #40bf40
    '--tertiary-foreground': '0 0% 100%',

    // State Semantics - Green for success (plants!), pink for warnings
    '--success': '130 55% 45%',         // Vibrant plant green #349c34
    '--success-foreground': '0 0% 100%',
    '--warning': '35 90% 60%',          // Warm orange #f5a745
    '--warning-foreground': '340 15% 25%',
    '--destructive': '350 80% 55%',     // Soft red #e6385a
    '--destructive-foreground': '0 0% 100%',
    '--info': '200 70% 55%',            // Soft blue #4db8e6
    '--info-foreground': '0 0% 100%',

    // Neutral Variety - Warm grays with pink tint
    '--muted': '340 15% 94%',           // Very light blush #f7f2f4
    '--muted-foreground': '340 10% 45%', // Muted warm gray #7a6b73
    '--accent': '340 75% 65%',          // Coral pink #f07799
    '--accent-foreground': '0 0% 100%',

    // Surfaces - Layered whites with subtle pink
    '--card': '0 0% 100%',              // Pure white cards #ffffff
    '--card-foreground': '340 15% 25%',
    '--popover': '0 0% 100%',           // Pure white popover #ffffff
    '--popover-foreground': '340 15% 25%'
  }
};

export const chayDark: Theme = {
  id: 'chay-dark',
  name: 'Chay Dark',
  className: 'dark',
  category: 'dark',
  tags: ['pink', 'feminine', 'plants', 'cozy'],
  author: 'ChayCards',
  description: 'Glowing pink and vibrant green on deep charcoal - girly meets elegant',
  source: 'plugin',
  variables: {
    // Base System - Deep warm charcoal
    '--background': '240 8% 12%',       // Deep charcoal #1a1a1f
    '--foreground': '330 15% 90%',      // Soft pink-white #f0e5ec
    '--border': '240 8% 20%',           // Dark border #2e2e35
    '--input': '240 8% 18%',            // Slightly lighter input #292930
    '--ring': '330 75% 65%',            // Bright rose pink #f07799
    '--radius': '0.75rem',

    // Core Hierarchy - Vibrant pink and neon green pop
    '--primary': '330 75% 65%',         // Bright hot pink #f07799
    '--primary-foreground': '240 8% 12%',
    '--secondary': '240 8% 22%',        // Deep gray-purple #33333d
    '--secondary-foreground': '330 15% 90%',
    '--tertiary': '130 60% 55%',        // Vibrant neon green #47d147
    '--tertiary-foreground': '240 8% 12%',

    // State Semantics - Bright green success, glowing accents
    '--success': '130 65% 55%',         // Bright plant green #42d942
    '--success-foreground': '240 8% 12%',
    '--warning': '35 95% 65%',          // Bright orange #f7b559
    '--warning-foreground': '240 8% 12%',
    '--destructive': '350 85% 60%',     // Bright red #f04566
    '--destructive-foreground': '240 8% 12%',
    '--info': '200 75% 60%',            // Bright blue #52c9f7
    '--info-foreground': '240 8% 12%',

    // Neutral Variety - Muted with pink undertones
    '--muted': '240 8% 25%',            // Medium dark gray #39394a
    '--muted-foreground': '330 10% 65%', // Muted pink-gray #b89daa
    '--accent': '340 80% 70%',          // Vibrant coral pink #f58aa8
    '--accent-foreground': '240 8% 12%',

    // Surfaces - Layered darks
    '--card': '240 8% 16%',             // Slightly lighter than bg #26262e
    '--card-foreground': '330 15% 90%',
    '--popover': '240 8% 14%',          // Just above background #212126
    '--popover-foreground': '330 15% 90%'
  }
};
