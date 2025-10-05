/**
 * GridLayout Component - Responsive grid system
 * Provides consistent responsive grid layouts across plugins
 */

export interface GridLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-12',
};

/**
 * Responsive Grid Layout component
 *
 * @example
 * ```tsx
 * <GridLayout columns={3} gap="md">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </GridLayout>
 * ```
 */
export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}) => {
  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};
