/**
 * Demo Plugin
 * Demonstrates plugin system capabilities including:
 * - Data storage (own service)
 * - Cross-plugin communication (accessing other plugin's services)
 * - Routes and navigation
 * - Region components (header, sidebar)
 * - Theme integration
 * - EventBus messaging
 */

import type { Plugin } from '../../shared/plugin-system/types';
import { DemoPage } from './components/DemoPage';
import { HeaderStatus } from './components/HeaderStatus';
import { SidebarWidget } from './components/SidebarWidget';
import { DemoDataService } from './services/DemoDataService';

export const DemoPlugin: Plugin = {
  id: 'demo-plugin',
  name: 'Demo Plugin',
  version: '1.0.0',
  description: 'Demonstrates plugin system capabilities including data storage and cross-plugin communication',

  // Depends on theme system to demonstrate cross-plugin data access
  requires: ['core-theme'],

  // Register components
  components: {
    'DemoPage': DemoPage,
    'HeaderStatus': HeaderStatus,
    'SidebarWidget': SidebarWidget
  },

  // Register own service for data management
  services: {
    'dataService': new DemoDataService()
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

    // Initialize data service with storage adapter
    const dataService = manager.getService('demo-plugin/dataService');
    const storage = manager.getStorage();
    if (dataService && storage) {
      await dataService.initialize(storage);
      console.log('Demo data service initialized with storage adapter');
    }

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