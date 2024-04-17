import { Flex } from '@chakra-ui/react';
import { PiDotsSixVerticalBold } from 'react-icons/pi';
import { PanelResizeHandle } from 'react-resizable-panels';

export default function HorizontalResizeHandle({ backgroundColor, isCollapsed }) {
    return (
        <PanelResizeHandle>
            <Flex flexDirection='column' alignItems='center' justifyContent='center' backgroundColor={backgroundColor} borderBottomRadius={isCollapsed ? '8px' : null}>
                <PiDotsSixVerticalBold size={16} style={{ transform: 'rotate(90deg)' }} />
            </Flex>
        </PanelResizeHandle>
    );
}
