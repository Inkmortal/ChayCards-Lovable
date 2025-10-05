/**
 * ErrorMessage Component - Display errors with icons and optional actions
 * Provides consistent error messaging across plugins
 */

import { AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning';
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Error Message component with optional retry/dismiss actions
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   title="Failed to load documents"
 *   message="Unable to connect to the server. Please try again."
 *   variant="error"
 *   onRetry={() => fetchDocuments()}
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  variant = 'error',
  onRetry,
  onDismiss,
  className = '',
}) => {
  const isError = variant === 'error';
  const Icon = isError ? XCircle : AlertCircle;

  return (
    <div
      className={`
        rounded-lg border p-4
        ${isError ? 'border-destructive bg-destructive/10' : 'border-yellow-500 bg-yellow-500/10'}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`h-5 w-5 flex-shrink-0 ${isError ? 'text-destructive' : 'text-yellow-600'}`}
        />

        <div className="flex-1 space-y-2">
          {title && (
            <h4 className={`font-semibold ${isError ? 'text-destructive' : 'text-yellow-700'}`}>
              {title}
            </h4>
          )}

          <p className={`text-sm ${isError ? 'text-destructive' : 'text-yellow-700'}`}>
            {message}
          </p>

          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-2 mt-3">
              {onRetry && (
                <Button
                  variant="3d-primary"
                  size="sm"
                  onClick={onRetry}
                  className="h-8"
                >
                  Try Again
                </Button>
              )}

              {onDismiss && (
                <Button
                  variant="3d-outline"
                  size="sm"
                  onClick={onDismiss}
                  className="h-8"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
