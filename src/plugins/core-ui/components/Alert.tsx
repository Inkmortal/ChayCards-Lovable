/**
 * Alert Component - User notifications and feedback
 * Provides consistent alerts across plugins
 */

import {
  Alert as ShadcnAlert,
  AlertTitle,
  AlertDescription,
} from '@/renderer/components/ui/alert';
import { AlertCircle, CheckCircle, InfoIcon, AlertTriangle } from 'lucide-react';

// Re-export primitives for advanced usage
export { AlertTitle, AlertDescription };

export type AlertVariant = 'default' | 'destructive' | 'success' | 'info' | 'warning';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

const variantIcons = {
  default: InfoIcon,
  destructive: AlertCircle,
  success: CheckCircle,
  info: InfoIcon,
  warning: AlertTriangle,
};

/**
 * Alert component for user notifications
 *
 * @example Simple alert
 * ```tsx
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved.
 * </Alert>
 * ```
 *
 * @example Alert without icon
 * ```tsx
 * <Alert variant="destructive" title="Error" showIcon={false}>
 *   Failed to save changes.
 * </Alert>
 * ```
 *
 * @example Custom icon
 * ```tsx
 * <Alert
 *   variant="info"
 *   title="Did you know?"
 *   icon={<Sparkles className="h-4 w-4" />}
 * >
 *   You can use keyboard shortcuts.
 * </Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  title,
  children,
  icon,
  showIcon = true,
  className,
}) => {
  const Icon = icon ? null : variantIcons[variant];

  return (
    <ShadcnAlert variant={variant === 'success' || variant === 'info' || variant === 'warning' ? 'default' : variant} className={className}>
      {showIcon && (icon || (Icon && <Icon className="h-4 w-4" />))}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </ShadcnAlert>
  );
};
