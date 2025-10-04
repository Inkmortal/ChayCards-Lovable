/**
 * Core UI Plugin - Shared UI component library
 *
 * This plugin provides reusable UI primitives that other plugins can use
 * to maintain visual consistency across the ChayCards ecosystem.
 *
 * It has NO routes and won't appear in navigation - it's purely a component library.
 */

import type { Plugin } from '@/shared/plugin-system/types';
import { Card } from './components/Card';
import { PageHeader } from './components/PageHeader';
import { EmptyState } from './components/EmptyState';

export const CoreUIPlugin: Plugin = {
  id: 'core-ui',
  name: 'Core UI Components',
  version: '1.0.0',
  description: 'Shared UI component library for plugin ecosystem',

  // Can run on public pages (no user storage needed)
  publicSafe: true,

  // No dependencies - this is a base library
  requires: [],

  // Export components for other plugins to use
  components: {
    'Card': Card,
    'PageHeader': PageHeader,
    'EmptyState': EmptyState,
  },

  // NO routes - this plugin provides components only, not pages
  // This means it won't show up in navigation

  onLoad: async (manager) => {
    console.log('[CoreUIPlugin] Loaded - components available to all plugins');
  }
};

export default CoreUIPlugin;
