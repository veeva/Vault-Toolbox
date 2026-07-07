import { Box, BoxProps, Flex, FlexProps, Text, TextProps, VStack } from '@chakra-ui/react';
import { PiCaretDown, PiCaretRight } from 'react-icons/pi';
import { GroupedLogItem } from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';
import WorkflowActivityLogDetailCard from './WorkflowActivityLogDetailCard';

interface WorkflowActivityLogItemCardProps {
    item: GroupedLogItem;
    isSelected: boolean;
    onToggle: () => void;
}

/**
 * A selectable step/event card in the List view; expands to show its log detail cards.
 */
export default function WorkflowActivityLogItemCard({ item, isSelected, onToggle }: WorkflowActivityLogItemCardProps) {
    let backgroundColor = 'white_color_mode';
    let borderColor = 'gray_background_color_mode';

    if (item.hasError) {
        backgroundColor = 'error_background_color_mode';
        borderColor = 'veeva_sunset_red_color_mode';
    }

    if (isSelected) {
        borderColor = 'veeva_orange_color_mode';
        backgroundColor = 'beige_color_mode';
    }

    return (
        <Box
            {...CardContainerStyle}
            backgroundColor={backgroundColor}
            border={isSelected ? '2px solid' : '1px solid'}
            borderColor={borderColor}
        >
            <Flex
                {...CardHeaderStyle}
                _hover={{
                    backgroundColor: isSelected
                        ? undefined
                        : item.hasError
                          ? 'error_background_hover_color_mode'
                          : 'workflow_log_card_hover_color_mode',
                }}
                onClick={onToggle}
            >
                <Box>
                    <Text fontWeight='bold' color='veeva_orange_color_mode'>
                        {item.isStep ? `Step: ${item.name}` : `Event: ${item.name}`}
                    </Text>
                    <Text fontSize='xs' color='veeva_dark_gray_text_color_mode'>
                        {item.logs.length} Log Row(s)
                    </Text>
                </Box>
                <Flex align='center' gap={3}>
                    {item.hasError && <Text {...ErrorBadgeStyle}>ERROR</Text>}
                    <Box color='veeva_dark_gray_text_color_mode'>{isSelected ? <PiCaretDown /> : <PiCaretRight />}</Box>
                </Flex>
            </Flex>

            {isSelected && (
                <Box {...CardDetailStyle}>
                    <VStack align='stretch' gap={3}>
                        {item.logs.map((log, index) => (
                            <WorkflowActivityLogDetailCard key={index} log={log} />
                        ))}
                    </VStack>
                </Box>
            )}
        </Box>
    );
}

const CardContainerStyle: BoxProps = {
    borderRadius: '8px',
    boxShadow: 'sm',
    overflow: 'hidden',
};

const CardHeaderStyle: FlexProps = {
    padding: '12px',
    justify: 'space-between',
    align: 'center',
    cursor: 'pointer',
};

const CardDetailStyle: BoxProps = {
    padding: '12px',
    borderTop: '1px solid',
    borderColor: 'gray.200',
    backgroundColor: 'veeva_sunset_yellow.five_percent_opacity',
};

const ErrorBadgeStyle: TextProps = {
    color: 'veeva_sunset_red_color_mode',
    fontSize: 'sm',
    fontWeight: 'bold',
};
