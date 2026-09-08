import {
    Box,
    type BoxProps,
    Icon,
    IconButton,
    type IconButtonProps,
    type SystemStyleObject,
    Table,
    type TableColumnHeaderProps,
    type TableRootProps,
} from '@chakra-ui/react';
import {
    CellContext,
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Dispatch, SetStateAction, useMemo, useRef, useEffect, useState } from 'react';
import { PiFolder, PiFileText, PiDownloadSimple, PiCopy, PiTrash } from 'react-icons/pi';
import { formatBytesToUserFriendlyFormat, formatDateTime, isProductionVault } from '../../../services/SharedServices';
import { FileStagingItem } from '../../../utils/file-browser/FileBrowserHelper';
import { toaster } from '../../shared/ui-components/toaster';
import { Tooltip } from '../../shared/ui-components/tooltip';

// A rendered row carries the shared node shape plus the original list index used
// to scroll to / highlight search results.
type FileStagingRow = FileStagingItem & { index?: number };

interface FileStagingVirtualizedTableProps {
    headers: string[];
    data: FileStagingRow[];
    handleFileStagingFolderClick: (folder: FileStagingRow) => void;
    tableHeight: string | number;
    handleDownloadFileStagingItemClick: (
        item: FileStagingRow,
        setIsFileDownloadModalOpen: Dispatch<SetStateAction<boolean>>,
    ) => void;
    setIsConfirmDeleteModalOpen: Dispatch<SetStateAction<boolean>>;
    setDeletedItem: Dispatch<SetStateAction<FileStagingRow | null>>;
    selectedFileStagingSearchResult: FileStagingRow | null;
    selectedFileStagingFolder: FileStagingItem | null;
    setIsFileDownloadModalOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Renders a high-performance table with row virtualization
 */
export default function FileStagingVirtualizedTable({
    headers,
    data,
    handleFileStagingFolderClick,
    tableHeight,
    handleDownloadFileStagingItemClick,
    setIsConfirmDeleteModalOpen,
    setDeletedItem,
    selectedFileStagingSearchResult,
    selectedFileStagingFolder,
    setIsFileDownloadModalOpen,
}: FileStagingVirtualizedTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);

    // Memoized table configuration
    const tableColumns = useMemo<ColumnDef<FileStagingRow>[]>(() => {
        const dataColumns = headers.map((header) => {
            if (header.toLowerCase() === 'size') {
                return {
                    header: header,
                    accessorKey: `data.${header}`,
                    cell: (info: CellContext<FileStagingRow, unknown>) => {
                        const value = info.getValue();
                        return value ? formatBytesToUserFriendlyFormat(value as number) : '-';
                    },
                };
            } else if (header.toLowerCase() === 'modified_date') {
                return {
                    header: header,
                    accessorKey: `data.${header}`,
                    cell: (info: CellContext<FileStagingRow, unknown>) => {
                        const value = info.getValue();
                        return value ? formatDateTime(value as string) : '-';
                    },
                };
            }

            return {
                header: header,
                accessorKey: `data.${header}`,
            };
        });

        return [
            ...dataColumns,
            {
                id: 'actions',
                header: '',
                size: 80,
                cell: (info: CellContext<FileStagingRow, unknown>) => {
                    const originalRowData = info.row.original;
                    const item = info.row.original;

                    const isFolder = originalRowData.isFolder;

                    return (
                        <>
                            <Tooltip
                                content={isProductionVault() ? 'This feature is not available in Production.' : 'Delete item'}
                                openDelay={0}
                                positioning={{ placement: 'top' }}
                            >
                                <IconButton
                                    disabled={isProductionVault()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsConfirmDeleteModalOpen(true);
                                        setDeletedItem(item);
                                    }}
                                    {...IconButtonStyle}
                                    style={{
                                        visibility: hoveredRow === info.row.id ? 'visible' : 'hidden',
                                        opacity: hoveredRow === info.row.id ? 1 : 0,
                                        transition: 'opacity 0.2s ease-in-out, visibility 0.2s',
                                    }}
                                    aria-label='Delete item'
                                >
                                    <PiTrash size={20} style={{ margin: '4px' }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip showArrow content='Copy full path' positioning={{ placement: 'top' }}>
                                <IconButton
                                    {...IconButtonStyle}
                                    style={{
                                        visibility: hoveredRow === info.row.id ? 'visible' : 'hidden',
                                        opacity: hoveredRow === info.row.id ? 1 : 0,
                                        transition: 'opacity 0.2s ease-in-out, visibility 0.2s',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(item.data?.path ?? '');
                                        toaster.success({
                                            title: 'Path Copied!',
                                            duration: 2000,
                                        });
                                    }}
                                    aria-label='Copy path'
                                >
                                    <PiCopy />
                                </IconButton>
                            </Tooltip>
                            {!isFolder && (
                                <Tooltip showArrow content='Download file' positioning={{ placement: 'top' }}>
                                    <IconButton
                                        {...IconButtonStyle}
                                        style={{
                                            visibility: hoveredRow === info.row.id ? 'visible' : 'hidden',
                                            opacity: hoveredRow === info.row.id ? 1 : 0,
                                            transition: 'opacity 0.2s ease-in-out, visibility 0.2s',
                                        }}
                                        onClick={() =>
                                            handleDownloadFileStagingItemClick(
                                                originalRowData,
                                                setIsFileDownloadModalOpen,
                                            )
                                        }
                                        aria-label='Download file'
                                    >
                                        <PiDownloadSimple />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Box flexGrow={1} />
                        </>
                    );
                },
            },
        ] as ColumnDef<FileStagingRow>[];
    }, [
        headers,
        handleDownloadFileStagingItemClick,
        hoveredRow,
        setDeletedItem,
        setIsConfirmDeleteModalOpen,
        setIsFileDownloadModalOpen,
    ]);

    const table = useReactTable<FileStagingRow>({
        data: data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
    });
    const { rows } = table.getRowModel();

    // Configure virtualization
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 65, // Estimated row height
        overscan: 50, // Number of rows to render beyond visible area
    });

    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    /**
     * Add prefix and suffix paddingrows to handle sticky header disappearing when scrolling
     * @see {@link https://github.com/TanStack/virtual/issues/640}
     */
    const getPrefixHeight = () => {
        const firstRow = virtualItems[0];
        return firstRow?.index > 0 ? firstRow.start : 0;
    };

    const getSuffixHeight = () => {
        const lastRow = virtualItems[virtualItems.length - 1];
        return lastRow?.index < rows.length - 1 ? totalSize - lastRow.end : 0;
    };

    useEffect(() => {
        if (virtualizer && selectedFileStagingSearchResult) {
            const rowIndex = rows.findIndex((row) => row.original.index === selectedFileStagingSearchResult.index);

            if (rowIndex !== -1) {
                virtualizer.scrollToIndex(rowIndex, { align: 'start', behavior: 'smooth' });
                setHighlightedRowId(rows[rowIndex].id);
            }
        }
    }, [selectedFileStagingSearchResult, virtualizer, rows]);

    useEffect(() => {
        if (highlightedRowId != null) {
            const timer = setTimeout(() => {
                setHighlightedRowId(null);
            }, 3000);

            return () => clearTimeout(timer); // Cleanup function
        }
    }, [highlightedRowId]);

    useEffect(() => {
        setHighlightedRowId(null);
    }, [selectedFileStagingFolder]);

    return (
        <Box ref={parentRef} height={tableHeight} {...BoxStyle}>
            <Box height={`${virtualizer.getTotalSize()}px`}>
                <Table.Root
                    {...TableStyle}
                    backgroundColor='veeva_sunset_yellow.five_percent_opacity'
                    size='md'
                    // previously had variant='simple' (which is invalid in Chakra v3) 
                    css={{ '& tbody tr': { bg: 'transparent' }, '& th': { borderBottomWidth: 0 } }}
                    stickyHeader
                >
                    <Table.Header>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <Table.Row key={headerGroup.id} backgroundColor='veeva_sandbox_green.500'>
                                {headerGroup.headers.map((header) => (
                                    <Table.ColumnHeader
                                        {...ThStyle}
                                        key={header.id}
                                        width={`${header.getSize()}px`}
                                        color='white'
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </Table.ColumnHeader>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Header>
                    <Table.Body>
                        {data.length === 0 ? (
                            <Table.Row>
                                <Table.Cell {...TdStyle} colSpan={5} textAlign='center'>
                                    NO ITEMS FOUND
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            <>
                                <Table.Row height={`${getPrefixHeight()}px`} />
                                {virtualizer.getVirtualItems().map((virtualRow) => {
                                    const row = rows[virtualRow.index];

                                    const isHighlighted = row.id === highlightedRowId;

                                    return (
                                        <Table.Row
                                            key={row.id}
                                            onClick={
                                                row.original.isFolder
                                                    ? () => handleFileStagingFolderClick(row.original)
                                                    : undefined
                                            }
                                            onMouseEnter={() => setHoveredRow(row.id)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                            {...TdStyle}
                                            backgroundColor={isHighlighted ? 'veeva_orange_color_mode' : undefined}
                                            transition='background-color 0.5s ease-in-out'
                                            _hover={{
                                                bg: isHighlighted ? 'veeva_orange_color_mode' : 'beige_color_mode',
                                                cursor: row.original.isFolder ? 'pointer' : 'default',
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <Table.Cell
                                                    {...TdStyle}
                                                    height='40px'
                                                    key={cell.id}
                                                    whiteSpace='nowrap'
                                                    overflow='hidden'
                                                    textOverflow='ellipsis'
                                                    textAlign={cell.column.id === 'actions' ? 'right' : 'left'}
                                                    width={cell.column.columnDef.size === 0 ? 'min-content' : undefined}
                                                >
                                                    {cell.column.id === 'data_kind' ? (
                                                        <Icon
                                                            as={row.original.isFolder ? PiFolder : PiFileText}
                                                            boxSize='6'
                                                        />
                                                    ) : (
                                                        flexRender(cell.column.columnDef.cell, cell.getContext())
                                                    )}
                                                </Table.Cell>
                                            ))}
                                        </Table.Row>
                                    );
                                })}
                                <Table.Row height={`${getSuffixHeight()}px`} />
                            </>
                        )}
                    </Table.Body>
                </Table.Root>
            </Box>
        </Box>
    );
}

const BoxStyle: BoxProps = {
    overflow: 'auto',
    width: '100%',
    border: 'none',
    fontSize: 'md',
};

const TableStyle: TableRootProps = {
    width: '100%',
};

const TdStyle: SystemStyleObject = {
    borderBottom: 'solid thin',
    borderColor: 'gray.300',
    verticalAlign: 'middle',
    fontSize: '16px',
    whiteSpace: 'nowrap',
};

const IconButtonStyle: IconButtonProps = {
    _hover: {
        backgroundColor: 'yellow_color_mode',
    },
    size: 'md',
    marginLeft: '8px',
    variant: 'ghost',
};

const ThStyle: TableColumnHeaderProps = {
    color: 'white',
    textAlign: 'left',
    width: '1%',
    whiteSpace: 'nowrap',
    _last: { width: '100%' },
    top: 0,
    border: 'none',
    textTransform: 'lowercase',
    fontSize: 'md',
};
