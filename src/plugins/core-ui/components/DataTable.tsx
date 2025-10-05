/**
 * DataTable Component - Wrapper around shadcn Table with ChayCards styling
 * Provides sortable, filterable tables for displaying data across all plugins
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/renderer/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}

/**
 * DataTable component with sorting and custom rendering
 *
 * @example
 * ```tsx
 * const columns = [
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
 * ];
 *
 * <DataTable columns={columns} data={items} onRowClick={(item) => navigate(item.id)} />
 * ```
 */
export function DataTable<T>({ columns, data, onRowClick, className = "" }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      })
    : data;

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={column.sortable ? 'cursor-pointer select-none hover:bg-muted/50' : ''}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortKey === column.key && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No results found
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={onRowClick ? 'cursor-pointer' : ''}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
