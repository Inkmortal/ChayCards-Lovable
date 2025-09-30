/**
 * Demo Plugin
 * Demonstrates plugin system capabilities including:
 * - Routes and navigation
 * - Region components (header, sidebar)
 * - Theme integration
 * - EventBus communication
 */

import type { Plugin } from '../../shared/plugin-system/types';
import { DemoPage } from './components/DemoPage';
import { HeaderStatus } from './components/HeaderStatus';
import { SidebarWidget } from './components/SidebarWidget';

export const DemoPlugin: Plugin = {
  id: 'demo-plugin',
  name: 'Demo Plugin',
  version: '1.0.0',
  description: 'Demonstrates plugin system capabilities and region integration',

  // Depends on theme system to show theme switching
  requires: ['core-theme'],

  // Register components
  components: {
    'DemoPage': DemoPage,
    'HeaderStatus': HeaderStatus,
    'SidebarWidget': SidebarWidget
  },

  // Register route with navigation
  routes: [
    {
      path: '/app/demo',
      component: 'demo-plugin/DemoPage',
      label: 'Demo',
      showInNav: true,
      order: 10  // Show first in navigation
    }
  ],

  onLoad: async (manager) => {
    console.log('Demo Plugin loaded');

    // Add header component
    manager.addToRegion('header', {
      id: 'demo-header-status',
      component: 'demo-plugin/HeaderStatus',
      order: 50  // middle position
    });

    // Add sidebar component
    manager.addToRegion('sidebar', {
      id: 'demo-sidebar-widget',
      component: 'demo-plugin/SidebarWidget',
      order: 10  // top of sidebar components
    });

    // Listen for demo events
    const eventBus = manager.getEventBus();
    eventBus.on('demo:test-event', (data) => {
      console.log('Demo event received:', data);
    });

    // Announce plugin ready
    eventBus.emit('demo:ready', {
      message: 'Demo plugin is ready to showcase the plugin system!'
    });
  }
};

export default DemoPlugin;