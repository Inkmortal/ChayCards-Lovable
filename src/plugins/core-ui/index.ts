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
import { DataTable } from './components/DataTable';
import { FormField } from './components/FormField';
import { Badge } from './components/Badge';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SplitView } from './components/SplitView';
import { GridLayout } from './components/GridLayout';
import { List } from './components/List';
import { ErrorMessage } from './components/ErrorMessage';
import { ProgressBar } from './components/ProgressBar';
import { MetricCard } from './components/MetricCard';
import { FormSection } from './components/FormSection';
import { Dialog } from './components/Dialog';
import { DropdownMenu } from './components/DropdownMenu';
import { Tabs } from './components/Tabs';
import { Tooltip } from './components/Tooltip';
import { Separator } from './components/Separator';
import { Select } from './components/Select';
import { Popover } from './components/Popover';
import { Switch } from './components/Switch';
import { Alert } from './components/Alert';
import { Accordion } from './components/Accordion';
import { Checkbox } from './components/Checkbox';
import { RadioGroup } from './components/RadioGroup';

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
    'DataTable': DataTable,
    'FormField': FormField,
    'Badge': Badge,
    'LoadingSpinner': LoadingSpinner,
    'SplitView': SplitView,
    'GridLayout': GridLayout,
    'List': List,
    'ErrorMessage': ErrorMessage,
    'ProgressBar': ProgressBar,
    'MetricCard': MetricCard,
    'FormSection': FormSection,
    'Dialog': Dialog,
    'DropdownMenu': DropdownMenu,
    'Tabs': Tabs,
    'Tooltip': Tooltip,
    'Separator': Separator,
    'Select': Select,
    'Popover': Popover,
    'Switch': Switch,
    'Alert': Alert,
    'Accordion': Accordion,
    'Checkbox': Checkbox,
    'RadioGroup': RadioGroup,
  },

  // NO routes - this plugin provides components only, not pages
  // This means it won't show up in navigation

  onLoad: async (manager) => {
    console.log('[CoreUIPlugin] Loaded - components available to all plugins');
  }
};

export default CoreUIPlugin;
