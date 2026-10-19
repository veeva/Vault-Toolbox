import {
    Box,
    BoxProps,
    Button,
    Dialog as ChakraDialog,
    HStack,
    Tabs,
    TabsListProps,
    TabsIndicatorProps,
    Text,
    VStack,
} from '@chakra-ui/react';
import type { RefObject } from 'react';
import { PiTrash } from 'react-icons/pi';
import type { ErdObjectRecord } from '../../hooks/erd-explorer/useErdExplorerData';
import type { ErdRelationshipsByDirection, ErdObjectSummary } from '../../utils/erd-explorer/ErdExplorerTypes';
import { resolveTargetLabel } from '../../utils/erd-explorer/ErdExplorerHelper';
import { useErdObjectRelationshipsDialog, type ObjectDialogView } from '../../hooks/erd-explorer/relationships-dialog/useErdObjectRelationshipsDialog';
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogCloseTrigger } from '../shared/ui-components/dialog';
import RecursiveAddView from './relationships-dialog/RecursiveAddView';
import RelatedObjectsView from './relationships-dialog/RelatedObjectsView';

interface ErdObjectRelationshipsDialogProps {
    containerRef: RefObject<HTMLDivElement | null>;
    objectName: string;
    record?: ErdObjectRecord;
    relationships: ErdRelationshipsByDirection | null;
    placedObjects: string[];
    summaryByName: Map<string, ErdObjectSummary>;
    onAdd: (names: string[]) => void;
    onAddRecursive: (depth: number, directions: { inbound: boolean; outbound: boolean }) => void;
    onRemove: () => void;
    onClose: () => void;
}

/**
 * Dialog showing one object's relationships: inbound/outbound related objects (searchable/filterable),
 * and a recursive-expansion view, switched via tabs. Styled to match the sidebar's Add Objects tab.
 */
export default function ErdObjectRelationshipsDialog({
    containerRef,
    objectName,
    record,
    relationships,
    placedObjects,
    summaryByName,
    onAdd,
    onAddRecursive,
    onRemove,
    onClose,
}: ErdObjectRelationshipsDialogProps) {
    const {
        view,
        setView,
        directionFilter,
        setDirectionFilter,
        searchTerm,
        setSearchTerm,
        depth,
        depthText,
        setDepthText,
        normalizeDepthInput,
        recursiveDirectionFilter,
        setRecursiveDirectionFilter,
        selected,
        toggleSelected,
        handleAddSelected,
        placedSet,
    } = useErdObjectRelationshipsDialog({ placedObjects, onAdd });

    const label = resolveTargetLabel(objectName, summaryByName) ?? objectName;

    return (
        <DialogRoot open onOpenChange={({ open }) => { if (!open) onClose(); }} size='lg' closeOnInteractOutside={false}>
            <DialogContent backgroundColor='white_color_mode' portalRef={containerRef} positionerProps={CanvasPositionerStyle}>
                <DialogHeader>
                    <HStack justify='space-between' align='flex-start' width='100%' paddingRight='36px'>
                        <VStack align='stretch' gap={0} minWidth={0}>
                            <Text fontSize='xl' fontWeight='bold' color='veeva_orange_color_mode' truncate>
                                {label}
                            </Text>
                            <Text fontSize='xs' fontFamily='mono' color='dimmed_text_color_mode' truncate>
                                {objectName}
                            </Text>
                        </VStack>
                        <Button
                            size='xs'
                            variant='outline'
                            color='veeva_sunset_red_color_mode'
                            borderColor='light_gray_color_mode'
                            flexShrink={0}
                            onClick={() => { onRemove(); onClose(); }}
                        >
                            <PiTrash size={14} style={{ marginRight: 6 }} /> Remove from canvas
                        </Button>
                    </HStack>
                </DialogHeader>
                <DialogCloseTrigger top='24px' insetEnd='24px' buttonSize='xs' />

                <DialogBody paddingTop={0}>
                    <Box {...TabsEnclosureStyle}>
                        <Tabs.Root
                            value={view}
                            onValueChange={(details) => setView(details.value as ObjectDialogView)}
                            variant='plain'
                            size='sm'
                        >
                            <Tabs.List {...TabListStyle}>
                                <Tabs.Trigger value='related' {...TabTriggerStyle}>
                                    Add related
                                </Tabs.Trigger>
                                <Tabs.Trigger value='recursive' {...TabTriggerStyle}>
                                    Add related (recursive)
                                </Tabs.Trigger>
                            </Tabs.List>
                            <Tabs.Indicator {...TabIndicatorStyle} />

                            <Tabs.Content value='related' padding={0}>
                                <RelatedObjectsView
                                    directionFilter={directionFilter}
                                    setDirectionFilter={setDirectionFilter}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    record={record}
                                    relationships={relationships}
                                    placedSet={placedSet}
                                    selected={selected}
                                    onToggle={toggleSelected}
                                    onAddSelected={handleAddSelected}
                                    summaryByName={summaryByName}
                                />
                            </Tabs.Content>

                            <Tabs.Content value='recursive' padding={0}>
                                <RecursiveAddView
                                    depth={depth}
                                    depthText={depthText}
                                    setDepthText={setDepthText}
                                    normalizeDepthInput={normalizeDepthInput}
                                    directionFilter={recursiveDirectionFilter}
                                    setDirectionFilter={setRecursiveDirectionFilter}
                                    onAddRecursive={onAddRecursive}
                                    onClose={onClose}
                                />
                            </Tabs.Content>
                        </Tabs.Root>
                    </Box>
                </DialogBody>
            </DialogContent>
        </DialogRoot>
    );
}

// Overrides the Chakra Dialog's default viewport-fixed positioner so the dialog centers over the
// canvas container (passed in via portalRef) instead of the whole page.
const CanvasPositionerStyle: ChakraDialog.PositionerProps = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
};

const TabsEnclosureStyle: BoxProps = {
    border: '1px solid',
    borderColor: 'light_gray_color_mode',
    borderRadius: '8px',
    overflow: 'hidden',
};

const TabListStyle: TabsListProps = {
    width: '100%',
    backgroundColor: 'veeva_light_gray_color_mode',
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400',
};

const TabTriggerStyle = {
    color: 'veeva_orange_color_mode',
    fontSize: 'sm',
    fontWeight: 'bold',
    width: '50%',
    justifyContent: 'center',
} as const;

const TabIndicatorStyle: TabsIndicatorProps = {
    marginTop: '-3px',
    height: '3px',
    backgroundColor: 'veeva_orange_color_mode',
    zIndex: 1,
};
