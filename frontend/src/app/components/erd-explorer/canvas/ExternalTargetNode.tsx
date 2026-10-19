import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { useErdExternalTargetNode } from '../../../hooks/erd-explorer/canvas/useErdExternalTargetNode';
import type { ErdHighlightDirection } from '../../../utils/erd-explorer/ErdExplorerTypes';
import { HiddenHandleStyle, NodeContainerStyle } from './ErdNodeStyles';

/** Synthetic node for an external relationship target (documents / users / groups). */
export default function ExternalTargetNode({ data, selected }: NodeProps) {
    const { target, highlight } = data as { target: string; highlight?: ErdHighlightDirection };
    const { Icon, label, borderColor, borderWidth } = useErdExternalTargetNode({ target, selected, highlight });

    return (
        <Box {...NodeContainerStyle} borderColor={borderColor} borderWidth={borderWidth} backgroundColor='beige_color_mode'>
            <Handle type='target' position={Position.Top} style={HiddenHandleStyle} isConnectable={false} />
            <HStack gap={2}>
                <Icon size={18} />
                <Text fontWeight='bold' fontSize='sm' color='veeva_dark_gray_text_color_mode' whiteSpace='nowrap'>
                    {label}
                </Text>
            </HStack>
            <Handle type='source' position={Position.Bottom} style={HiddenHandleStyle} isConnectable={false} />
        </Box>
    );
}
