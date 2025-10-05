/**
 * Badge Component - Wrapper around shadcn Badge with ChayCards styling
 * Provides consistent status indicators and labels across all plugins
 */

import { Badge as ShadcnBadge } from "@/renderer/components/ui/badge";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Badge component for status indicators and labels
 *
 * @example
 * ```tsx
 * <Badge variant="default">Active</Badge>
 * <Badge variant="secondary">Draft</Badge>
 * <Badge variant="destructive">Archived</Badge>
 * <Badge variant="outline">Pending</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  className = "",
}) => {
  return (
    <ShadcnBadge variant={variant} className={className}>
      {children}
    </ShadcnBadge>
  );
};
