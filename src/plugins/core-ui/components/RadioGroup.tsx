/**
 * RadioGroup Component - Single-choice selection for forms
 * Provides consistent radio groups across plugins
 */

import {
  RadioGroup as ShadcnRadioGroup,
  RadioGroupItem,
} from '@/renderer/components/ui/radio-group';
import { Label } from '@/renderer/components/ui/label';

// Re-export primitives for advanced usage
export { RadioGroupItem };

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * RadioGroup component for single-choice selections
 *
 * @example Simple radio group
 * ```tsx
 * <RadioGroup
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *     { value: 'option3', label: 'Option 3' }
 *   ]}
 *   value={selectedOption}
 *   onValueChange={setSelectedOption}
 * />
 * ```
 *
 * @example Radio group with descriptions
 * ```tsx
 * <RadioGroup
 *   options={[
 *     {
 *       value: 'free',
 *       label: 'Free Plan',
 *       description: 'Basic features for personal use'
 *     },
 *     {
 *       value: 'pro',
 *       label: 'Pro Plan',
 *       description: 'Advanced features for professionals'
 *     },
 *     {
 *       value: 'enterprise',
 *       label: 'Enterprise Plan',
 *       description: 'Full features for organizations',
 *       disabled: true
 *     }
 *   ]}
 *   defaultValue="free"
 * />
 * ```
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
}) => {
  return (
    <ShadcnRadioGroup
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      className={className}
    >
      {options.map((option) => {
        const optionId = `radio-${option.value}`;

        return (
          <div key={option.value} className="flex items-start space-x-2">
            <RadioGroupItem
              value={option.value}
              id={optionId}
              disabled={option.disabled || disabled}
              className="mt-0.5"
            />
            <div className="flex flex-col">
              <Label htmlFor={optionId} className="cursor-pointer">
                {option.label}
              </Label>
              {option.description && (
                <span className="text-sm text-muted-foreground">
                  {option.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </ShadcnRadioGroup>
  );
};
