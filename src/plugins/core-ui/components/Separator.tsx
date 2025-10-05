/**
 * Separator Component - Visual divider for content sections
 * Provides consistent visual hierarchy across plugins
 */

import { Separator as ShadcnSeparator } from '@/renderer/components/ui/separator';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  className?: string;
}

/**
 * Separator component for dividing content sections
 *
 * @example Horizontal separator (default)
 * ```tsx
 * <div>
 *   <p>Section 1 content</p>
 *   <Separator />
 *   <p>Section 2 content</p>
 * </div>
 * ```
 *
 * @example Vertical separator in flex layout
 * ```tsx
 * <div className="flex items-center gap-4">
 *   <Button>Action 1</Button>
 *   <Separator orientation="vertical" className="h-8" />
 *   <Button>Action 2</Button>
 * </div>
 * ```
 *
 * @example Decorative separator (no semantic meaning)
 * ```tsx
 * <Separator decorative />
 * ```
 */
export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  decorative = true,
  className,
}) => {
  return (
    <ShadcnSeparator
      orientation={orientation}
      decorative={decorative}
      className={className}
    />
  );
};
