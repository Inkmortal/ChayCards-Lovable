/**
 * Core UI Components - Shared UI primitives for plugin ecosystem
 */

// Layout Components
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export { PageHeader } from './PageHeader';
export { EmptyState } from './EmptyState';

// Data Display Components
export { DataTable } from './DataTable';
export type { Column, DataTableProps } from './DataTable';

// Form Components
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';

// Status Components
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

// Loading Components
export { LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';

// Phase 2: Layout Components
export { SplitView } from './SplitView';
export type { SplitViewProps } from './SplitView';

export { GridLayout } from './GridLayout';
export type { GridLayoutProps } from './GridLayout';

export { List } from './List';
export type { ListProps, ListItemProps } from './List';

// Phase 3: Feedback & Utility Components
export { ErrorMessage } from './ErrorMessage';
export type { ErrorMessageProps } from './ErrorMessage';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { MetricCard } from './MetricCard';
export type { MetricCardProps } from './MetricCard';

export { FormSection } from './FormSection';
export type { FormSectionProps } from './FormSection';

// Phase 4: Interactive Components
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
export type { DialogProps } from './Dialog';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from './DropdownMenu';
export type { DropdownMenuProps } from './DropdownMenu';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export type { TabsProps, Tab } from './Tabs';

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { Separator } from './Separator';
export type { SeparatorProps } from './Separator';

// Phase 5: Form & Feedback Components
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from './Select';
export type { SelectProps, SelectOption, SelectOptionGroup } from './Select';

export { Popover, PopoverContent, PopoverTrigger } from './Popover';
export type { PopoverProps } from './Popover';

export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { Alert, AlertTitle, AlertDescription } from './Alert';
export type { AlertProps, AlertVariant } from './Alert';

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
export type { AccordionProps, AccordionSection } from './Accordion';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { RadioGroup, RadioGroupItem } from './RadioGroup';
export type { RadioGroupProps, RadioOption } from './RadioGroup';
