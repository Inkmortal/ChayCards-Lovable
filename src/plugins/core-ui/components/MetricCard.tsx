/**
 * MetricCard Component - Display stats and KPIs
 * Provides consistent metric visualization across plugins
 */

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number; // Percentage change
    isPositive: boolean;
  };
  className?: string;
}

/**
 * Metric Card component for displaying stats and KPIs
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Documents"
 *   value={127}
 *   description="Active documents"
 *   icon={FileText}
 *   trend={{ value: 12, isPositive: true }}
 * />
 * ```
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>

      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>

          {(description || trend) && (
            <div className="flex items-center gap-2 text-xs">
              {trend && (
                <span
                  className={`font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
              )}

              {description && (
                <span className="text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
