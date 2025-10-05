/**
 * FormField Component - Wrapper around shadcn Input with label and validation
 * Provides consistent form field styling with error handling across all plugins
 */

import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { Textarea } from "@/renderer/components/ui/textarea";
import { AlertCircle } from "lucide-react";

export interface FormFieldProps {
  label: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  value?: string | number;
  onChange?: (value: string | number) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number; // For textarea
  children?: React.ReactNode; // Support custom input elements
}

/**
 * Form Field component with label, input, and error display
 *
 * Can be used in two ways:
 * 1. With built-in input (provide name, value, onChange)
 * 2. As a label wrapper (provide children)
 *
 * @example Built-in input
 * ```tsx
 * <FormField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   error={emailError}
 *   required
 * />
 * ```
 *
 * @example Custom input as children
 * ```tsx
 * <FormField label="Theme Name" required>
 *   <input type="text" value={name} onChange={e => setName(e.target.value)} />
 * </FormField>
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  rows = 4,
  children,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) : e.target.value;
    onChange?.(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* If children provided, use custom input; otherwise render built-in input */}
      {children ? (
        children
      ) : type === 'textarea' ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
