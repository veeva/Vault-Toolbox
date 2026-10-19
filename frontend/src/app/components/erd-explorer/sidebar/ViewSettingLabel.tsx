import { type ReactNode } from 'react';
import { HStack, Icon, Text } from '@chakra-ui/react';
import { PiInfo } from 'react-icons/pi';
import useIsTextTruncated from '../../../hooks/shared/useIsTextTruncated';
import { Tooltip } from '../../shared/ui-components/tooltip';

/** Fixed label column width so every info icon lines up at the same horizontal position. */
const LABEL_WIDTH = '190px';

interface ViewSettingLabelProps {
    label: string;
    /** Help text shown beside the label, and in a tooltip once it is too long to fit. */
    help: ReactNode;
    /** Plain-text form of `help`, for the tooltip when `help` carries markup. */
    helpText: string;
}

/** A View Settings row's label column: name, info icon, and truncating help text with a tooltip. */
export default function ViewSettingLabel({ label, help, helpText }: ViewSettingLabelProps) {
    const { isTruncated, textRef } = useIsTextTruncated<HTMLParagraphElement>();

    return (
        <HStack gap='5px' align='center' minWidth={0} flex={1}>
            <Text fontSize='sm' width={LABEL_WIDTH} flexShrink={0}>{label}</Text>
            <Icon as={PiInfo} boxSize='24px' color='blue_color_mode' flexShrink={0} />
            <Tooltip content={helpText} showArrow disabled={!isTruncated}>
                <Text
                    ref={textRef}
                    fontSize='xs'
                    color='veeva_dark_gray_text_color_mode'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    whiteSpace='nowrap'
                    minWidth={0}
                >
                    {help}
                </Text>
            </Tooltip>
        </HStack>
    );
}
