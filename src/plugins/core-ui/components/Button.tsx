/**
 * Button - Core UI button component with 3D styling as default
 *
 * This wraps the shadcn/ui Button component and makes the 3D variant
 * the default style for visual consistency across ChayCards.
 *
 * @example
 * ```tsx
 * // Default 3D button
 * <Button onClick={handleClick}>Click Me</Button>
 *
 * // Primary 3D button
 * <Button variant="3d-primary">Save</Button>
 *
 * // Outline 3D button
 * <Button variant="3d-outline">Cancel</Button>
 *
 * // Use non-3D variants when needed
 * <Button variant="ghost">Ghost</Button>
 * ```
 */

import React from 'react';
import { Button as ShadcnButton, ButtonProps } from '@/renderer/components/ui/button';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = '3d', ...props }, ref) => {
    return <ShadcnButton ref={ref} variant={variant} {...props} />;
  }
);

Button.displayName = 'Button';
