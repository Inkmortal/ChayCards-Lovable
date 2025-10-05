/**
 * Tooltip Component - Contextual help and information
 * Provides consistent tooltips across plugins
 */

import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/renderer/components/ui/tooltip';

// Re-export primitives for advanced usage
export { TooltipContent, TooltipProvider, TooltipTrigger };

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  disabled?: boolean;
}

/**
 * Tooltip component for providing contextual help
 *
 * @example
 * ```tsx
 * <Tooltip content="Delete this item permanently">
 *   <Button variant="destructive">
 *     <Trash className="h-4 w-4" />
 *   </Button>
 * </Tooltip>
 * ```
 *
 * @example With custom side and delay
 * ```tsx
 * <Tooltip
 *   content="This feature is experimental"
 *   side="right"
 *   delayDuration={100}
 * >
 *   <Badge>Beta</Badge>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  disabled = false,
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <ShadcnTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  );
};
