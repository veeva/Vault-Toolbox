import { Box, BoxProps, Button, ButtonProps, Flex, FlexProps, Stack, Text, TextProps } from '@chakra-ui/react';
import { PiCaretDown, PiCaretRight } from 'react-icons/pi';
import { CSSProperties, useState } from 'react';
import { WorkflowActivityLogEntry } from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';
import { parseLogDetails } from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';

/**
 * A single expandable Activity Data detail card for one log entry.
 */
export default function WorkflowActivityLogDetailCard({ log }: { log: WorkflowActivityLogEntry }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const isError = log.event === 'ERROR' || log.status === 'error';
    const backgroundColor = isError ? 'error_background_color_mode' : 'white_color_mode';
    const parsedDetails = parseLogDetails(log.details);
    const formattedStartTime = log.start_time ? new Date(log.start_time).toLocaleString() : '';
    const formattedEndTime = log.end_time ? new Date(log.end_time).toLocaleString() : '';

    return (
        <Box
            {...DetailCardStyle}
            backgroundColor={backgroundColor}
            borderColor={isError ? 'veeva_sunset_red_color_mode' : 'gray_background_color_mode'}
            _hover={{ backgroundColor: isError ? 'error_background_hover_color_mode' : 'workflow_log_card_hover_color_mode' }}
        >
            <Flex {...DetailCardHeaderStyle} onClick={() => setIsExpanded(!isExpanded)}>
                <Box>
                    <Text {...EventTitleStyle}>{log.event}</Text>
                    <Flex {...MetaRowStyle}>
                        {log.step_id && <Text fontWeight='bold'>ID: {log.step_id}</Text>}
                        <Text>Start: {formattedStartTime}</Text>
                        {log.end_time && <Text>End: {formattedEndTime}</Text>}
                    </Flex>
                </Box>

                <Flex align='center' gap={3}>
                    <Text
                        fontSize='xs'
                        fontWeight='bold'
                        color={isError ? 'veeva_sunset_red_color_mode' : 'veeva_dark_gray_text_color_mode'}
                    >
                        {log.status?.toUpperCase() || ''}
                    </Text>
                    <Button {...CaretButtonStyle}>{isExpanded ? <PiCaretDown /> : <PiCaretRight />}</Button>
                </Flex>
            </Flex>

            {isExpanded && (
                <Box {...ExpandedDetailsStyle}>
                    <Stack gap={1}>
                        <DetailRow label='Result' value={log.result} />
                        <DetailRow label='Workflow ID' value={log.workflow_id} />
                        <DetailRow label='Workflow' value={log.workflow} />
                        <DetailRow label='Version' value={log.version} />
                        {log.user && <DetailRow label='User' value={log.user} />}
                        {log.object && <DetailRow label='Object' value={log.object} />}
                        {log.record && <DetailRow label='Record' value={log.record} />}
                        {log.document && <DetailRow label='Document' value={log.document} />}
                        {log.condition && <DetailRow label='Condition' value={log.condition} />}

                        {parsedDetails && Object.keys(parsedDetails).length > 0 && (
                            <Box marginTop='8px'>
                                <Text {...DetailsHeadingStyle}>Details</Text>
                                <Box {...DetailsCodeBoxStyle}>
                                    <pre style={DetailsPreStyle}>{JSON.stringify(parsedDetails, null, 2)}</pre>
                                </Box>
                            </Box>
                        )}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <Flex>
            <Text {...DetailRowLabelStyle}>{label}:</Text>
            <Text fontWeight='medium' color='inherit'>
                {value}
            </Text>
        </Flex>
    );
}

const DetailCardStyle: BoxProps = {
    border: '1px solid',
    borderColor: 'gray_background_color_mode',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: 'sm',
};

const DetailCardHeaderStyle: FlexProps = {
    padding: '12px',
    align: 'flex-start',
    justify: 'space-between',
    cursor: 'pointer',
};

const EventTitleStyle: TextProps = {
    fontSize: 'sm',
    fontWeight: 'bold',
    color: 'veeva_orange_color_mode',
};

const MetaRowStyle: FlexProps = {
    gap: 4,
    marginTop: '4px',
    fontSize: 'xs',
    color: 'veeva_dark_gray_text_color_mode',
    align: 'center',
};

const CaretButtonStyle: ButtonProps = {
    size: 'xs',
    variant: 'ghost',
    padding: 0,
};

const ExpandedDetailsStyle: BoxProps = {
    padding: '12px',
    fontSize: 'xs',
    borderTop: '1px solid',
    borderColor: 'gray.200',
};

const DetailsHeadingStyle: TextProps = {
    fontWeight: 'bold',
    color: 'veeva_orange_color_mode',
    marginBottom: '4px',
};

const DetailsCodeBoxStyle: BoxProps = {
    backgroundColor: 'veeva_light_gray_color_mode',
    padding: '8px',
    borderRadius: '4px',
};

const DetailsPreStyle: CSSProperties = {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    color: 'inherit',
};

const DetailRowLabelStyle: TextProps = {
    width: '100px',
    color: 'veeva_dark_gray_text_color_mode',
    flexShrink: 0,
};
