# Vault Data Grid: Virtualization Pattern

When implementing row virtualization with TanStack Virtual, follow this standardized pattern.

## Implementation Guide

### 1. Configure the Virtualizer
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

const parentRef = useRef<HTMLDivElement>(null);
const rowModel = table.getRowModel();

const virtualizer = useVirtualizer({
    count: rowModel.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // Estimated height of a table row
    overscan: 50, // Number of rows to render outside visible area
});
```

### 2. Implementation logic for Sticky Headers
To handle the "disappearing sticky header" issue when scrolling, use prefix and suffix padding rows:

```tsx
const virtualItems = virtualizer.getVirtualItems();
const totalSize = virtualizer.getTotalSize();

const getPrefixHeight = () => {
    const firstRow = virtualItems[0];
    return firstRow?.index > 0 ? firstRow.start : 0;
};

const getSuffixHeight = () => {
    const lastRow = virtualItems[virtualItems.length - 1];
    return lastRow?.index < rowModel.rows.length - 1 ? totalSize - lastRow.end : 0;
};
```

### 3. Render the Table Body
```tsx
<Table.Body>
    {/* Prefix Padding Row */}
    <Table.Row height={`${getPrefixHeight()}px`} border='none' />
    
    {virtualItems.map((virtualRow) => {
        const row = rowModel.rows[virtualRow.index];
        return (
            <Table.Row key={row.id}>
                {row.getVisibleCells().map((cell) => (
                    <Table.Cell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Cell>
                ))}
            </Table.Row>
        );
    })}

    {/* Suffix Padding Row */}
    <Table.Row height={`${getSuffixHeight()}px`} border='none' />
</Table.Body>
```

## When to use Virtualization
- Mandatory: For any list or table displaying over 50 items.
- Recommended: For tables with complex cell renderers (e.g., icons, buttons, or conditional logic) even at smaller counts (30+).
