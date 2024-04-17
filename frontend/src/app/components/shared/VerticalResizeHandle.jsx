import { Flex } from '@chakra-ui/react';
import { PiDotsSixVerticalBold } from 'react-icons/pi';
import { PanelResizeHandle } from 'react-resizable-panels';

export default function VerticalResizeHandle() {
    return (
        <PanelResizeHandle>
            <Flex height='100%' alignItems='center' justifyContent='center'>
                <PiDotsSixVerticalBold size={16} />
            </Flex>
        </PanelResizeHandle>
    );
}
