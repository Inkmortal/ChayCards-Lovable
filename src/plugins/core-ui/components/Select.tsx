/**
 * Select Component - Dropdown selection for forms
 * Provides consistent select inputs across plugins
 */

import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/renderer/components/ui/select';

// Re-export primitives for advanced usage
export { SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator };

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectOptionGroup[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Select component for dropdown selections
 *
 * @example Simple select
 * ```tsx
 * <Select
 *   placeholder="Choose status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'pending', label: 'Pending' },
 *     { value: 'archived', label: 'Archived' }
 *   ]}
 *   onValueChange={(value) => setStatus(value)}
 * />
 * ```
 *
 * @example Grouped select
 * ```tsx
 * <Select
 *   groups={[
 *     {
 *       label: 'Vegetables',
 *       options: [
 *         { value: 'carrot', label: 'Carrot' },
 *         { value: 'potato', label: 'Potato' }
 *       ]
 *     },
 *     {
 *       label: 'Fruits',
 *       options: [
 *         { value: 'apple', label: 'Apple' },
 *         { value: 'banana', label: 'Banana' }
 *       ]
 *     }
 *   ]}
 * />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  options = [],
  groups = [],
  placeholder = 'Select an option',
  disabled = false,
  className,
}) => {
  return (
    <ShadcnSelect value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {groups.length > 0 ? (
          groups.map((group, groupIdx) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.options.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
              {groupIdx < groups.length - 1 && <SelectSeparator />}
            </SelectGroup>
          ))
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </ShadcnSelect>
  );
};
