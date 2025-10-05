/**
 * LoadingSpinner Component - Loading indicator with ChayCards styling
 * Provides consistent loading states across all plugins
 */

import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * Loading Spinner component with optional text
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" text="Loading documents..." />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = "",
  text,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};
