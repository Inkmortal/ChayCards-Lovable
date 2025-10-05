/**
 * Checkbox Component - Multi-select control for forms
 * Provides consistent checkboxes across plugins
 */

import { Checkbox as ShadcnCheckbox } from '@/renderer/components/ui/checkbox';
import { Label } from '@/renderer/components/ui/label';

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
  id?: string;
}

/**
 * Checkbox component for multi-select controls
 *
 * @example Simple checkbox
 * ```tsx
 * <Checkbox
 *   label="Accept terms and conditions"
 *   checked={accepted}
 *   onCheckedChange={setAccepted}
 * />
 * ```
 *
 * @example Checkbox with description
 * ```tsx
 * <Checkbox
 *   label="Enable notifications"
 *   description="Receive email notifications for new messages"
 *   checked={notificationsEnabled}
 *   onCheckedChange={setNotificationsEnabled}
 * />
 * ```
 *
 * @example Standalone checkbox (no label)
 * ```tsx
 * <Checkbox
 *   checked={isSelected}
 *   onCheckedChange={setIsSelected}
 * />
 * ```
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  className,
  id,
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  if (!label) {
    return (
      <ShadcnCheckbox
        id={checkboxId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <div className={`flex items-start space-x-2 ${className || ''}`}>
      <ShadcnCheckbox
        id={checkboxId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="flex flex-col">
        <Label htmlFor={checkboxId} className="cursor-pointer">
          {label}
        </Label>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  );
};
