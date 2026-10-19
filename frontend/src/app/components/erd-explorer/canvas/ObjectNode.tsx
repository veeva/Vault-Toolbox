import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge, Box, Button, HStack, IconButton, Spinner, Text, VStack } from '@chakra-ui/react';
import { PiArrowClockwise, PiDotsThreeVertical } from 'react-icons/pi';
import type { ErdObjectRecord } from '../../../hooks/erd-explorer/useErdExplorerData';
import { useErdObjectNode } from '../../../hooks/erd-explorer/canvas/useErdObjectNode';
import type { ErdHighlightDirection, ErdObjectSummary } from '../../../utils/erd-explorer/ErdExplorerTypes';
import { Tooltip } from '../../shared/ui-components/tooltip';
import FieldRow from './FieldRow';
import { HiddenHandleStyle, NodeContainerStyle } from './ErdNodeStyles';

interface ErdObjectNodeData {
    summary?: ErdObjectSummary;
    record?: ErdObjectRecord;
    /** Field API names to render, in object metadata order (resolved when nodes are built). */
    visibleFieldNames: string[];
    /** Whether to show the system/standard/custom source badge (Viewer Setting). */
    showSourceBadge: boolean;
    /** Neighbour emphasis relative to the selected node: 'out' (colour 1) or 'in' (colour 2). */
    highlight?: ErdHighlightDirection;
    onRetry: () => void;
    /** Opens the relationships dialog (related objects + recursive add + remove) for this object. */
    onOpenDialog: () => void;
    [key: string]: unknown;
}

const SOURCE_BADGE_COLOR: Record<string, string> = {
    standard: 'veeva_twilight_blue.500',
    custom: 'veeva_orange_color_mode',
    system: 'gray.500',
};

/**
 * Custom React Flow node for a Vault object: content-driven size (grows to fit every visible field, no
 * scrollbar or manual resize), shows label + API name, and per-object fields. Edges are derived
 * (floating edges), so the node carries only hidden source/target handles.
 */
export default function ObjectNode({ id, data, selected }: NodeProps) {
    const { summary, record, visibleFieldNames, showSourceBadge, highlight, onRetry, onOpenDialog } =
        data as ErdObjectNodeData;
    const { label, source, borderColor, borderWidth, fields, placeholderReason } = useErdObjectNode({
        id,
        selected,
        summary,
        record,
        visibleFieldNames,
        highlight,
    });

    return (
        <Box {...NodeContainerStyle} borderColor={borderColor} borderWidth={borderWidth}>
            <Handle type='target' position={Position.Top} style={HiddenHandleStyle} isConnectable={false} />
            <VStack align='stretch' gap={1}>
                <VStack align='stretch' gap={0}>
                    <HStack justify='space-between' alignItems='center' gap={2}>
                        <Text fontWeight='bold' fontSize='sm' color='veeva_dark_gray_text_color_mode' whiteSpace='nowrap'>
                            {label}
                        </Text>
                        <HStack gap={0.5} flexShrink={0}>
                            <Tooltip content='Options' openDelay={0}>
                                <IconButton
                                    size='2xs'
                                    variant='ghost'
                                    aria-label='Options'
                                    onClick={(event) => { event.stopPropagation(); onOpenDialog(); }}
                                >
                                    <PiDotsThreeVertical size={14} />
                                </IconButton>
                            </Tooltip>
                            {showSourceBadge && (
                                <Badge size='xs' backgroundColor={SOURCE_BADGE_COLOR[source] ?? 'gray.400'} color='white'>
                                    {source}
                                </Badge>
                            )}
                        </HStack>
                    </HStack>
                    <Text fontSize='2xs' fontFamily='mono' color='dimmed_text_color_mode' whiteSpace='nowrap'>
                        {summary?.name}
                    </Text>
                </VStack>

                {record?.status === 'loading' && (
                    <HStack gap={2} paddingTop='4px'>
                        <Spinner size='xs' color='veeva_orange_color_mode' />
                        <Text fontSize='2xs' color='dimmed_text_color_mode'>
                            Loading metadata…
                        </Text>
                    </HStack>
                )}
                {record?.status === 'error' && (
                    <VStack align='stretch' gap={1} paddingTop='4px'>
                        <Text fontSize='2xs' color='veeva_sunset_red_color_mode'>
                            Failed to load metadata
                        </Text>
                        <Button size='2xs' variant='outline' onClick={onRetry} alignSelf='start'>
                            <PiArrowClockwise style={{ marginRight: 4 }} /> Retry
                        </Button>
                    </VStack>
                )}

                {placeholderReason === 'noMdl' && (
                    <Text fontSize='2xs' color='dimmed_text_color_mode' paddingTop='4px' fontStyle='italic'>
                        Fields unavailable for this object
                    </Text>
                )}
                {placeholderReason === 'missingFromVault' && (
                    <Text fontSize='2xs' color='veeva_sunset_red_color_mode' paddingTop='4px' fontStyle='italic'>
                        No longer in this Vault
                    </Text>
                )}

                {record?.status === 'ready' && fields.length > 0 && (
                    <VStack align='stretch' gap={0.5} paddingTop='4px' borderTopWidth='1px' borderColor='gray.200'>
                        {fields.map((field) => (
                            <FieldRow key={field.name} field={field} />
                        ))}
                    </VStack>
                )}
            </VStack>
            <Handle type='source' position={Position.Bottom} style={HiddenHandleStyle} isConnectable={false} />
        </Box>
    );
}
