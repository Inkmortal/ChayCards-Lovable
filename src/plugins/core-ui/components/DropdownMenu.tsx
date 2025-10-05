/**
 * DropdownMenu Component - Context menus and action menus
 * Provides consistent dropdown menus across plugins
 */

import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/renderer/components/ui/dropdown-menu';

// Re-export all primitives for advanced usage
export {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
};

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Dropdown Menu component for action menus and context menus
 *
 * @example
 * ```tsx
 * <DropdownMenu trigger={<Button variant="ghost">Actions</Button>}>
 *   <DropdownMenuItem onClick={() => edit()}>
 *     <Edit className="mr-2 h-4 w-4" />
 *     Edit
 *   </DropdownMenuItem>
 *   <DropdownMenuItem onClick={() => duplicate()}>
 *     <Copy className="mr-2 h-4 w-4" />
 *     Duplicate
 *   </DropdownMenuItem>
 *   <DropdownMenuSeparator />
 *   <DropdownMenuItem onClick={() => delete()} className="text-destructive">
 *     <Trash className="mr-2 h-4 w-4" />
 *     Delete
 *   </DropdownMenuItem>
 * </DropdownMenu>
 * ```
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  align = 'end',
  side = 'bottom',
}) => {
  return (
    <ShadcnDropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        {children}
      </DropdownMenuContent>
    </ShadcnDropdownMenu>
  );
};
