/**
 * Switch Component - Toggle control for settings
 * Provides consistent switches across plugins
 */

import { Switch as ShadcnSwitch } from '@/renderer/components/ui/switch';
import { Label } from '@/renderer/components/ui/label';

export interface SwitchProps {
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
 * Switch component for toggle controls
 *
 * @example Simple switch
 * ```tsx
 * <Switch
 *   label="Enable notifications"
 *   checked={notificationsEnabled}
 *   onCheckedChange={setNotificationsEnabled}
 * />
 * ```
 *
 * @example Switch with description
 * ```tsx
 * <Switch
 *   label="Dark mode"
 *   description="Use dark theme across the app"
 *   checked={isDarkMode}
 *   onCheckedChange={setIsDarkMode}
 * />
 * ```
 *
 * @example Standalone switch (no label)
 * ```tsx
 * <Switch
 *   checked={isEnabled}
 *   onCheckedChange={setIsEnabled}
 * />
 * ```
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  className,
  id,
}) => {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  if (!label) {
    return (
      <ShadcnSwitch
        id={switchId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className || ''}`}>
      <ShadcnSwitch
        id={switchId}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <div className="flex flex-col">
        <Label htmlFor={switchId} className="cursor-pointer">
          {label}
        </Label>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  );
};
