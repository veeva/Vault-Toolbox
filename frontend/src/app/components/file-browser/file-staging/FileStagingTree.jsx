import { Box, Flex, IconButton, List, Text } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { ControlledTreeEnvironment, InteractionMode, Tree } from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';
import { PiCaretDownBold, PiCaretRightBold, PiDownloadSimple, PiFolder } from 'react-icons/pi';
import { Tooltip } from '../../shared/ui-components/tooltip';

export default function FileStagingTree({
    fileStagingTree,
    selectedFileStagingTreeItems,
    setSelectedFileStagingTreeItems,
    expandedFileStagingTreeItems,
    setExpandedFileStagingTreeItems,
    handleFileStagingFolderClick,
    handleExportFileStagingFolder,
    exportingFolderPath,
}) {
    const items = useMemo(() => fileStagingTree, [fileStagingTree]);
    const [hoveredFolderIndex, setHoveredFolderIndex] = useState(null);

    /**
     * Provides custom styling and sets the appropriate icon for expand/collapse options.
     */
    const itemArrowRenderer = ({ context }) => {
        return (
            <Flex
                align='center'
                justify='center'
                onClick={(e) => {
                    context.isExpanded ? context.collapseItem() : context.expandItem();
                    e.stopPropagation();
                }}
                width='28px'
                height='28px'
                _hover={{ cursor: 'pointer' }}
            >
                {context.isExpanded ? (
                    <PiCaretDownBold style={{ width: 20, height: 20 }} />
                ) : (
                    <PiCaretRightBold style={{ width: 20, height: 20 }} />
                )}
            </Flex>
        );
    };

    /**
     * Provides custom styling and dynamically sets the appropriate icon for each item.
     */
    const itemRenderer = ({ item, title, arrow, context, children, depth }) => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                handleFileStagingFolderClick(item);
            }
        };

        const isExporting = exportingFolderPath === item.data?.path?.slice(1);

        return (
            <>
                {item.isFolder ? (
                    <List.Item onClick={() => handleFileStagingFolderClick(item)} onKeyDown={handleKeyDown}>
                        <Flex
                            alignItems='center'
                            justifyContent='left'
                            width='100%'
                            minWidth='min-content'
                            borderRadius='6px'
                            paddingLeft={`${depth * 28}px`} // Adjust padding for folder depth
                            backgroundColor={context.isSelected ? 'veeva_orange_color_mode' : undefined}
                            color={context.isSelected ? 'white' : 'inherit'} // Set font color based on selection
                            _hover={{
                                cursor: 'pointer',
                                backgroundColor: context.isSelected ? undefined : 'light_gray_color_mode',
                            }}
                            onMouseEnter={() => setHoveredFolderIndex(item.index)}
                            onMouseLeave={() => setHoveredFolderIndex(null)}
                            {...context.itemContainerWithChildrenProps}
                            {...context.itemContainerWithoutChildrenProps}
                            {...context.interactiveElementProps}
                        >
                            <Box>{arrow}</Box>
                            <List.Indicator>
                                <PiFolder style={{ width: 28, height: 20 }} />
                            </List.Indicator>
                            <Text {...TextStyle}>{title}</Text>
                            <Flex alignItems='center' marginRight='4px'>
                                <Tooltip content='Export this folder to CSV' openDelay={0} positioning={{ placement: 'top' }}>
                                    <IconButton
                                        {...FolderActionButtonStyle}
                                        aria-label='Export folder listing'
                                        loading={isExporting}
                                        style={folderActionStyle(hoveredFolderIndex === item.index || isExporting)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExportFileStagingFolder(item.data?.path?.slice(1));
                                        }}
                                    >
                                        <PiDownloadSimple size={16} />
                                    </IconButton>
                                </Tooltip>
                            </Flex>
                        </Flex>
                    </List.Item>
                ) : null}
                {children}
            </>
        );
    };

    return (
        <>
            <style>
                {`
                :root {
                    --rct-color-tree-bg: #FFFFFF;
                    --rct-item-height: 20px;
                },
                .rct-tree-root {
                    font-family: system-ui,sans-serif;
                }
            `}
            </style>
            <Box ml='5px'>
                <ControlledTreeEnvironment
                    viewState={{
                        ['file-staging-tree']: {
                            selectedItems: selectedFileStagingTreeItems,
                            expandedItems: expandedFileStagingTreeItems,
                        },
                    }}
                    onSelectItems={(items) => {
                        setSelectedFileStagingTreeItems(items);
                    }}
                    onExpandItem={(item) =>
                        setExpandedFileStagingTreeItems([...expandedFileStagingTreeItems, item.index])
                    }
                    onCollapseItem={(item) =>
                        setExpandedFileStagingTreeItems(
                            expandedFileStagingTreeItems.filter(
                                (expandedItemIndex) => expandedItemIndex !== item.index,
                            ),
                        )
                    }
                    getItemTitle={(item) => item.data.name}
                    items={items}
                    canSearch={false}
                    canDragAndDrop={false}
                    canReorderItems={false}
                    canRename={false}
                    defaultInteractionMode={InteractionMode.ClickArrowToExpand}
                    renderItem={itemRenderer}
                    renderItemArrow={itemArrowRenderer}
                    renderTreeContainer={({ children, containerProps }) => <Box {...containerProps}>{children}</Box>}
                    renderItemsContainer={({ children, containerProps }) => (
                        <List.Root variant='plain' whiteSpace='nowrap' {...containerProps}>
                            {children}
                        </List.Root>
                    )}
                >
                    <Tree treeId='file-staging-tree' rootItem='root' treeLabel='File Staging Tree' />
                </ControlledTreeEnvironment>
            </Box>
        </>
    );
}

const TextStyle = {
    flex: '1', // Take up the remaining space in the Flex
    truncate: true, // Truncate text with ellipsis if it overflows
    marginY: 2,
    marginX: '5px',
    fontSize: '15px',
};

const folderActionStyle = (isVisible) => ({
    visibility: isVisible ? 'visible' : 'hidden',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out, visibility 0.2s',
});

const FolderActionButtonStyle = {
    variant: 'ghost',
    color: 'inherit',
    borderRadius: '6px',
    height: 'auto',
    minWidth: 'auto',
    padding: '4px',
    _hover: {
        backgroundColor: 'yellow_color_mode',
    },
};
