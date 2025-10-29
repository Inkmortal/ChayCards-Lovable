/**
 * Dialog Component - Modal dialog for forms and confirmations
 * Provides consistent modal dialogs across plugins
 */

import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCancel?: boolean;
  showConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: '3d' | '3d-primary' | '3d-outline' | '3d-destructive' | 'destructive';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  showBackButton?: boolean;
  onBack?: () => void;
  headerActions?: React.ReactNode;
}

const maxWidthClasses = {
  sm: 'max-w-sm',      // 384px (24rem)
  md: 'max-w-md',      // 448px (28rem)
  lg: 'max-w-lg',      // 512px (32rem)
  xl: 'max-w-xl',      // 576px (36rem)
  '2xl': 'max-w-2xl',  // 672px (42rem)
  '3xl': 'max-w-3xl',  // 768px (48rem)
  '4xl': 'max-w-4xl',  // 896px (56rem)
  '5xl': 'max-w-5xl',  // 1024px (64rem)
  '6xl': 'max-w-6xl',  // 1152px (72rem)
  '7xl': 'max-w-7xl',  // 1280px (80rem)
};

/**
 * Dialog component for modal interactions
 *
 * @example
 * ```tsx
 * <Dialog
 *   trigger={<Button>Open Dialog</Button>}
 *   title="Create Document"
 *   description="Enter document details"
 *   showConfirm
 *   onConfirm={() => createDocument()}
 * >
 *   <FormField label="Title" ... />
 * </Dialog>
 * ```
 */
export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  showCancel = true,
  showConfirm = false,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = '3d-primary',
  maxWidth = 'md',
  showBackButton = false,
  onBack,
  headerActions,
}) => {
  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className={maxWidthClasses[maxWidth]}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2 mr-8">
                {headerActions}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="py-4 flex-1 min-h-0 flex flex-col">{children}</div>

        {(footer || showCancel || showConfirm) && (
          <DialogFooter>
            {footer || (
              <>
                {showCancel && (
                  <Button variant="3d-outline" onClick={handleCancel}>
                    {cancelText}
                  </Button>
                )}
                {showConfirm && (
                  <Button variant={confirmVariant} onClick={handleConfirm}>
                    {confirmText}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </ShadcnDialog>
  );
};

// Also export the primitives for advanced usage
export { DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
