/* eslint-disable no-undef */
import { Text, Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverArrow, PopoverBody, IconButton, Flex, Button, Icon, useDisclosure, Spacer } from '@chakra-ui/react';
import { PiCaretDownBold, PiX, PiNotePencil, PiFloppyDisk } from 'react-icons/pi';
import SavedVaultsTable from './SavedVaultsTable';
import useSavedVaultsPopover from '../../hooks/login/useSavedVaultsPopover';

export default function SavedVaultsPopover({ setVaultDNS, setUsername, setFocusToPasswordInput, savedVaultData, setSavedVaultData }) {
    const { onOpen, onClose, isOpen } = useDisclosure();

    const { isEditable, toggleEditMode, handlePopoverClosed } = useSavedVaultsPopover({ savedVaultData, setSavedVaultData, onClose });

    return (
        <Popover placement='right-start' isOpen={isOpen} onOpen={onOpen} onClose={handlePopoverClosed} isLazy>
            <PopoverTrigger>
                <IconButton icon={<PiCaretDownBold />} {...IconButtonStyle} />
            </PopoverTrigger>
            <PopoverContent {...PopoverContentStyle}>
                <PopoverHeader {...PopoverHeaderStyle}>
                    <Flex alignItems='center'>
                        <Text fontSize='md'>Saved Vaults</Text>
                        <Button {...ToggleEditModeButtonStyle} onClick={toggleEditMode}>
                            {isEditable
                                ? <Icon as={PiFloppyDisk} boxSize={6} color={isEditable && 'blue.500'} />
                                : <Icon as={PiNotePencil} boxSize={6} />}
                        </Button>
                        <Spacer />
                        <Button {...CloseButtonStyle} onClick={handlePopoverClosed}><PiX /></Button>
                    </Flex>
                </PopoverHeader>
                <PopoverArrow backgroundColor='gray.200' />
                <PopoverBody>
                    <SavedVaultsTable
                        savedVaultData={savedVaultData}
                        setSavedVaultData={setSavedVaultData}
                        setVaultDNS={setVaultDNS}
                        setUsername={setUsername}
                        setFocusToPasswordInput={setFocusToPasswordInput}
                        isEditable={isEditable}
                        toggleEditMode={toggleEditMode}
                    />
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
}

const IconButtonStyle = {
    marginLeft: '5px',
    backgroundColor: 'gray.200'
};

const PopoverContentStyle = {
    minW: { base: '100%', lg: 'max-content' },
    borderRadius: 'md'
};

const PopoverHeaderStyle = {
    fontWeight: 'semibold',
    backgroundColor: 'gray.200',
    borderTopRadius: 'md',
    padding: '8px'
};

const ToggleEditModeButtonStyle = {
    variant: 'outline',
    size: 'sm',
    marginLeft: '5px',
    padding: '0'
};

const CloseButtonStyle = {
    backgroundColor: 'gray.200',
    _hover: { backgroundColor: 'gray.100' }
};
