/**
 * Popover Component - Lightweight contextual overlay
 * Provides consistent popovers across plugins
 */

import {
  Popover as ShadcnPopover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';

// Re-export primitives for advanced usage
export { PopoverContent, PopoverTrigger };

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Popover component for lightweight overlays
 *
 * @example
 * ```tsx
 * <Popover trigger={<Button variant="outline">More info</Button>}>
 *   <div className="space-y-2">
 *     <h4 className="font-medium">Quick Info</h4>
 *     <p className="text-sm text-muted-foreground">
 *       Additional details appear here without a heavy modal.
 *     </p>
 *   </div>
 * </Popover>
 * ```
 *
 * @example Controlled popover
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Popover
 *   trigger={<Button>Toggle</Button>}
 *   open={open}
 *   onOpenChange={setOpen}
 * >
 *   <p>Controlled content</p>
 * </Popover>
 * ```
 */
export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  align = 'center',
  side = 'bottom',
  open,
  onOpenChange,
  className,
}) => {
  return (
    <ShadcnPopover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} side={side} className={className}>
        {children}
      </PopoverContent>
    </ShadcnPopover>
  );
};
