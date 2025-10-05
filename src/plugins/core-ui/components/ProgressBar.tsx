/**
 * ProgressBar Component - Visual progress indicator
 * Provides consistent progress visualization across plugins
 */

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantClasses = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-destructive',
};

/**
 * Progress Bar component for visualizing completion
 *
 * @example
 * ```tsx
 * <ProgressBar value={65} showLabel variant="success" />
 * <ProgressBar value={uploadProgress} max={100} size="lg" />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  // Clamp value between 0 and max
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div className={`w-full bg-secondary rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
