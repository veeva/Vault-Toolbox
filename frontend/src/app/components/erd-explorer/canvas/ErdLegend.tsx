import { Panel } from '@xyflow/react';
import { Box, BoxProps, HStack, Text, VStack } from '@chakra-ui/react';
import { EDGE_LEGEND } from '../../../utils/erd-explorer/ErdExplorerTypes';
import { legendSwatchColor } from '../../../utils/erd-explorer/graph/ErdExplorerEdgeHelpers';
import type { ErdEdgeColors } from '../../../hooks/erd-explorer/erdReducer';

/** On-canvas legend mapping relationship type → edge colour. Rendered inside the React Flow canvas. */
export default function ErdLegend({ edgeColors }: { edgeColors: ErdEdgeColors }) {
    return (
        <Panel position='top-left'>
            <Box {...LegendBoxStyle}>
                <Text fontSize='xs' fontWeight='bold' textTransform='uppercase' color='gray.500' marginBottom='4px'>
                    Relationships
                </Text>
                <VStack align='stretch' gap={0.5}>
                    {EDGE_LEGEND.map((entry) => (
                        <HStack key={entry.type} gap={2}>
                            <Box
                                width='16px'
                                height='0'
                                borderTopWidth='2px'
                                borderColor={legendSwatchColor(entry.type, edgeColors)}
                                // External-target edges (documents, users/groups) render dashed on the canvas.
                                borderStyle={entry.dashed ? 'dashed' : 'solid'}
                            />
                            <Text fontSize='xs' color='veeva_dark_gray_text_color_mode'>
                                {entry.label}
                            </Text>
                        </HStack>
                    ))}
                </VStack>
            </Box>
        </Panel>
    );
}

const LegendBoxStyle: BoxProps = {
    backgroundColor: 'white_color_mode',
    borderRadius: '6px',
    padding: '6px 8px',
    boxShadow: 'sm',
};
