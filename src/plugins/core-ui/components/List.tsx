/**
 * List Component - Compound component for displaying lists
 * Provides consistent list styling with clickable items
 */

export interface ListProps {
  children: React.ReactNode;
  className?: string;
}

export interface ListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * List container component
 *
 * @example
 * ```tsx
 * <List>
 *   <List.Item onClick={() => navigate('/doc/1')}>Document 1</List.Item>
 *   <List.Item active>Document 2</List.Item>
 *   <List.Item disabled>Document 3</List.Item>
 * </List>
 * ```
 */
export const List: React.FC<ListProps> & { Item: React.FC<ListItemProps> } = ({
  children,
  className = '',
}) => {
  return (
    <div className={`divide-y divide-border ${className}`}>
      {children}
    </div>
  );
};

/**
 * List Item component - must be used within List
 */
const ListItem: React.FC<ListItemProps> = ({
  children,
  onClick,
  active = false,
  disabled = false,
  className = '',
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        px-4 py-3 transition-colors
        ${onClick && !disabled ? 'cursor-pointer hover:bg-accent' : ''}
        ${active ? 'bg-accent border-l-4 border-l-primary' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Attach Item as a compound component
List.Item = ListItem;
