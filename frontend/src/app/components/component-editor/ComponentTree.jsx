import { List, ListItem, Flex, Text, Icon } from '@chakra-ui/react';
import { useMemo } from 'react';
import { UncontrolledTreeEnvironment, Tree, StaticTreeDataProvider, InteractionMode } from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';
import { PiFolder, PiCaretDownBold, PiCaretRightBold, PiGear, PiCode } from 'react-icons/pi';

export default function ComponentTree({ componentTree, onSelect }) {
    const handleItemClick = (item) => {
        onSelect(item.index)
    };

    const dataProvider = useMemo(() => new StaticTreeDataProvider(componentTree, (item, data) => ({
        ...item,
        data
    })), [componentTree]);

    /**
     * Provides custom syling and sets the appropriate icon for expand/collapse options.
     */
    const itemArrowRenderer = ({ item, context }) => (item.children.length > 0
        ? (
            <Icon
                as={context.isExpanded ? PiCaretDownBold : PiCaretRightBold}
                marginRight='5px'
                width='20px'
                height='20px'
            />
        )
        : null);

    /**
     * Provides custom syling and dynamically sets the appropriate icon for each item.
     */
    const itemRenderer = ({ item, title, arrow, context, children }) => (
        <List whiteSpace='nowrap'>
            <ListItem>
                <Flex
                    alignItems='center'
                    justifyContent='left'
                    width='min-content'
                    backgroundColor={(context.isSelected && !item.children.length > 0) ? 'blue.100' : undefined}
                    {...(context.itemContainerWithoutChildrenProps)}
                    {...(context.interactiveElementProps)}
                >
                    {arrow}
                    <Icon
                        as={item.isCode ? PiCode : (item.isFolder ? PiFolder : PiGear)}
                        marginLeft={item.isFolder ? '0' : '25px'}
                        width='20px'
                        height='20px'
                        style={{ transform: (!item.isCode && !item.isFolder) ? 'rotate(20deg)' : null }}
                    />
                    <Text
                        marginY={2}
                        marginX='5px'
                        fontSize='15px'
                        _hover={{ cursor: 'pointer' }}
                    >
                        {title}
                    </Text>
                </Flex>
                {children}
            </ListItem>
        </List>
    );

    /**
     * Provides custom syling if the item is a match for the current search
     */
    const itemTitleRenderer = (props) => (props.info.isSearching && props.context.isSearchMatching ? (
        <span className='rct-tree-item-search-highlight'>{props.title}</span>
    ) : (
        props.title
    ));

    return (
        <>
            <style>
                {`
                :root {
                    --rct-color-tree-bg: #FFFFFF;
                    --rct-color-arrow: #000000;
                    --rct-arrow-size: 20px;
                    --rct-arrow-padding: 10px;
                    --rct-item-height: 20px;
                },
                .rct-tree-root {
                    font-family: system-ui,sans-serif;
                }
            `}
            </style>
            <UncontrolledTreeEnvironment
                dataProvider={dataProvider}
                onPrimaryAction={handleItemClick}
                disableMultiselect
                canSearch
                canDragAndDrop={false}
                canReorderItems={false}
                canRename={false}
                defaultInteractionMode={InteractionMode.ClickItemToExpand}
                getItemTitle={(item) => item.data}
                viewState={{}}
                renderItemTitle={itemTitleRenderer}
                renderItemArrow={itemArrowRenderer}
                renderItem={itemRenderer}
                renderTreeContainer={({ children, containerProps }) => <div {...containerProps}>{children}</div>}
                renderItemsContainer={({ children, containerProps }) => <ul {...containerProps}>{children}</ul>}
            >
                { componentTree && <Tree treeId='component-tree' rootItem='root' treeLabel='Component Tree' />}
            </UncontrolledTreeEnvironment>
        </>
    );
}
