import { Box, BoxProps, Button, HStack, Text } from '@chakra-ui/react';
import { PiTrash } from 'react-icons/pi';
import type { BulkFieldMode } from '../../hooks/erd-explorer/canvas/useErdSelection';
import FilterGroupLabel from './FilterGroupLabel';

interface ErdBulkSelectionToolbarProps {
    selectedCount: number;
    onSetSelectedFields: (mode: BulkFieldMode) => void;
    onDeleteSelected: () => void;
}

/** Floating toolbar shown while 2+ nodes are selected: bulk field visibility + delete. */
export default function ErdBulkSelectionToolbar({
    selectedCount,
    onSetSelectedFields,
    onDeleteSelected,
}: ErdBulkSelectionToolbarProps) {
    return (
        <Box {...ToolbarContainerStyle}>
            <HStack gap={3} paddingX='12px' paddingY='8px' alignItems='center'>
                <Text fontSize='sm' fontWeight='bold' lineHeight='1' color='veeva_dark_gray_text_color_mode' whiteSpace='nowrap'>
                    {selectedCount} objects selected
                </Text>
                <FilterGroupLabel>Fields</FilterGroupLabel>
                <HStack gap={1}>
                    <Button {...ToolbarButtonStyle} onClick={() => onSetSelectedFields('all')}>
                        All
                    </Button>
                    <Button {...ToolbarButtonStyle} onClick={() => onSetSelectedFields('relationships')}>
                        Relationships
                    </Button>
                    <Button {...ToolbarButtonStyle} onClick={() => onSetSelectedFields('none')}>
                        None
                    </Button>
                </HStack>
                <Button {...ToolbarButtonStyle} color='veeva_sunset_red_color_mode' onClick={onDeleteSelected}>
                    <PiTrash size={14} style={{ marginRight: 4 }} /> Delete {selectedCount} objects
                </Button>
            </HStack>
        </Box>
    );
}

const ToolbarButtonStyle = {
    size: '2xs',
    variant: 'outline',
    borderColor: 'light_gray_color_mode',
} as const;

const ToolbarContainerStyle: BoxProps = {
    position: 'absolute',
    top: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    backgroundColor: 'white_color_mode',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)',
};
