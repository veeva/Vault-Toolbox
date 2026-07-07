# Vault Data Grid: Table Logic Templates

## Column Definition Pattern

When defining columns for TanStack Table, follow this structure:

```tsx
import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';

interface RowData {
    id: string;
    name: string;
    type: string;
}

const columnHelper = createColumnHelper<RowData>();

export const useColumns = () => {
    return useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Name',
            cell: (info) => <Text fontWeight='bold'>{info.getValue()}</Text>,
        }),
        columnHelper.accessor('type', {
            header: 'Type',
            cell: (info) => <Badge colorScheme='blue'>{info.getValue()}</Badge>,
        }),
    ], []);
};
```

## Table Hook Pattern

Use this template in your use[Feature]Table.ts hook:

```tsx
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table';

export const useFeatureTable = ({ data, columns }) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return { table };
};
```
