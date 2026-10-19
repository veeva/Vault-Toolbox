import { type CSSProperties } from 'react';
import { Handle, Position } from '@xyflow/react';
import { HStack, VStack, Text } from '@chakra-ui/react';
import type { ErdField } from '../../../utils/erd-explorer/ErdExplorerTypes';

// Per-field source handle: invisible but sized/positioned so React Flow measures its row Y (floating
// edges read that so an arrow starts at its owning field's row). `position: relative` on the row makes
// the handle sit on the row, not the node's vertical centre.
const FieldHandleStyle: CSSProperties = { opacity: 0, width: 6, height: 6, minWidth: 6, right: 0, border: 'none', background: 'transparent', pointerEvents: 'none' };

/** One field row: label primary, API name secondary. Text does not wrap so the node grows to fit it. */
export default function FieldRow({ field }: { field: ErdField }) {
    return (
        <HStack justify='space-between' gap={4} position='relative'>
            <VStack align='start' gap={0}>
                <Text fontSize='xs' color='veeva_dark_gray_text_color_mode' whiteSpace='nowrap'>
                    {field.label}
                </Text>
                <Text fontSize='2xs' fontFamily='mono' color='dimmed_text_color_mode' whiteSpace='nowrap'>
                    {field.name}
                </Text>
            </VStack>
            <Text fontSize='2xs' color='dimmed_text_color_mode' whiteSpace='nowrap' textAlign='right'>
                {field.isReference ? `→ ${field.targetObject ?? ''}` : field.type}
            </Text>
            {field.isReference && (
                <Handle type='source' position={Position.Right} id={field.name} style={FieldHandleStyle} isConnectable={false} />
            )}
        </HStack>
    );
}
