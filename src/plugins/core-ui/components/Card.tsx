/**
 * Card Component - Wrapper around shadcn Card with ChayCards styling
 * Provides consistent card styling across all plugins
 */

import { Card as ShadcnCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/renderer/components/ui/card";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Base Card component with ChayCards styling
 */
export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <ShadcnCard className={`${className}`}>
      {children}
    </ShadcnCard>
  );
};

/**
 * Card sub-components - re-export from shadcn for consistency
 */
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
