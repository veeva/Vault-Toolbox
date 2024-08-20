import {Box, Button, Divider, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, Text, Tooltip, useDisclosure} from '@chakra-ui/react';
import {PiCaretLeft, PiDotsThreeBold, PiTrash} from 'react-icons/pi';
import VqlConfirmQueryDeletionModal from './VqlConfirmQueryDeletionModal';

export default function VqlActionsMenu ({ savedQueryOptions, insertSavedQuery, deleteSavedQuery, selectedQueryName, setSelectedQueryName }) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <Menu>
                <MenuButton as={IconButton} icon={<PiDotsThreeBold size={24} />} {...VqlActionsMenuButtonStyle} />
                <MenuList {...MenuListStyle} paddingY='0px'>
                    <Text {...TextStyle} fontSize='md'>Insert Saved Query</Text>
                    <Divider />
                    { savedQueryOptions?.length > 0 ?
                        <>
                            <Box overflowY='auto' maxHeight='30vh'>
                                { savedQueryOptions.map((savedQuery) => {
                                    return (
                                        <MenuItem
                                            {...MenuItemStyle}
                                            key={savedQuery?.label}
                                            onClick={() => insertSavedQuery(savedQuery?.label)}
                                        >
                                            <Tooltip label={savedQuery?.label}>
                                                <Text isTruncated maxWidth='100%'>
                                                    {savedQuery?.label}
                                                </Text>
                                            </Tooltip>
                                        </MenuItem>
                                    );
                                })}
                            </Box>
                            <Divider />
                            <Menu placement={'left'}>
                                <MenuButton
                                    as={Button}
                                    leftIcon={<PiCaretLeft size={16} />}
                                    {...DeleteQueryButtonStyle}
                                >
                                    <Flex alignItems='center' justifyContent='center'>
                                        <Text fontSize='md' marginRight='5px'>Delete Saved Query</Text>
                                        <PiTrash size={16} />
                                    </Flex>
                                </MenuButton>
                                <MenuList {...MenuListStyle} paddingTop='0px'>
                                    <Text {...TextStyle} fontSize='md'>Delete Saved Query</Text>
                                    <Divider />
                                    <Box overflowY='auto' maxHeight='30vh'>
                                        {savedQueryOptions.map((savedQuery) => {
                                            return (
                                                <MenuItem
                                                    {...DeleteMenuItemStyle}
                                                    key={savedQuery?.label}
                                                    onClick={() => {
                                                        setSelectedQueryName(savedQuery?.label);
                                                        onOpen();
                                                    }
                                                }>
                                                    <Tooltip label={savedQuery?.label}>
                                                        <Text isTruncated maxWidth='100%'>
                                                            {savedQuery?.label}
                                                        </Text>
                                                    </Tooltip>
                                                </MenuItem>
                                            );
                                        })}
                                    </Box>
                                </MenuList>
                            </Menu>
                        </>
                        : <Flex {...TextStyle} justifyContent='center'>No Saved Queries</Flex>
                    }
                </MenuList>
            </Menu>
            { isOpen ?
                <VqlConfirmQueryDeletionModal
                    isOpen={isOpen}
                    onClose={onClose}
                    onSubmit={deleteSavedQuery}
                    savedQueryName={selectedQueryName}
                />
                : null
            }
        </>
    )
}

const VqlActionsMenuButtonStyle = {
    variant: 'ghost',
    size: 'sm',
    margin: '10px 10px 10px 0px',
    padding: '5px'
};

const MenuListStyle = {
    backgroundColor: 'white.color_mode',
    maxWidth: '30vw',
}

const MenuItemStyle = {
    fontSize: 'medium',
    _hover: {
        backgroundColor: 'veeva_twilight_blue.500',
        color: 'white'
    }
};

const DeleteMenuItemStyle = {
    fontSize: 'medium',
    _hover: {
        backgroundColor: 'veeva_sunset_red.color_mode',
        color: 'white'
    }
};

const DeleteQueryButtonStyle = {
    variant: 'ghost',
    size: 'sm',
    margin: '10px',
    padding: '5px',
    maxWidth: '100%'
};

const TextStyle = {
    margin: '10px',
    color: 'gray.500'
}