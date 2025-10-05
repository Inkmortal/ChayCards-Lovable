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
  confirmVariant?: 'default' | 'destructive';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
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
  confirmVariant = 'default',
  maxWidth = 'md',
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
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">{children}</div>

        {(footer || showCancel || showConfirm) && (
          <DialogFooter>
            {footer || (
              <>
                {showCancel && (
                  <Button variant="outline" onClick={handleCancel}>
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
