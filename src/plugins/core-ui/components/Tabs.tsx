/**
 * Tabs Component - Organize content into switchable views
 * Provides consistent tabbed interfaces across plugins
 */

import {
  Tabs as ShadcnTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/renderer/components/ui/tabs';

// Re-export all primitives for advanced usage
export { TabsList, TabsTrigger, TabsContent };

export interface Tab {
  value: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Tabs component for organizing content into switchable views
 *
 * @example
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { value: 'overview', label: 'Overview', content: <OverviewPanel /> },
 *     { value: 'settings', label: 'Settings', content: <SettingsPanel /> },
 *     { value: 'advanced', label: 'Advanced', content: <AdvancedPanel />, disabled: true }
 *   ]}
 *   defaultValue="overview"
 * />
 * ```
 *
 * @example Advanced usage with primitives
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Custom Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Custom Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Custom content 1</TabsContent>
 *   <TabsContent value="tab2">Custom content 2</TabsContent>
 * </Tabs>
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  orientation = 'horizontal',
}) => {
  const initialValue = value || defaultValue || tabs[0]?.value;

  return (
    <ShadcnTabs
      value={value}
      defaultValue={initialValue}
      onValueChange={onValueChange}
      orientation={orientation}
      className={className}
    >
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
};
