import { Box, BoxProps, Flex, FlexProps, Link, Span, Text, TextProps } from '@chakra-ui/react';
import { PiArrowSquareOutLight } from 'react-icons/pi';
import { getVaultDns } from '../../services/SharedServices';
import { WorkflowRecord } from '../../utils/workflow-activity-log-inspector/WorkflowActivityLogHelper';

interface WorkflowRecordCardProps {
    workflowRecord: WorkflowRecord;
    isSelected: boolean;
    onSelect: () => void;
}

/**
 * A selectable card for one workflow instance in the Workflows selector panel.
 */
export default function WorkflowRecordCard({ workflowRecord, isSelected, onSelect }: WorkflowRecordCardProps) {
    const buildOpenInVaultHref = () => {
        if (workflowRecord.object && workflowRecord.record) {
            return `https://${getVaultDns()}/ui/#object/${workflowRecord.object}/${workflowRecord.record}`;
        }
        if (workflowRecord.document) {
            const [documentId, majorVersion, minorVersion] = workflowRecord.document.split('_');
            return `https://${getVaultDns()}/ui/#doc_info/${documentId}/${majorVersion}/${minorVersion}`;
        }
        return '';
    };
    const openInVaultHref = buildOpenInVaultHref();

    const formattedStartTime = workflowRecord.startTime ? new Date(workflowRecord.startTime).toLocaleString() : '';
    const formattedEndTime = workflowRecord.endTime ? new Date(workflowRecord.endTime).toLocaleString() : '';

    return (
        <Box
            {...CardContainerStyle}
            backgroundColor={isSelected ? 'beige_color_mode' : 'white_color_mode'}
            border={isSelected ? '2px solid' : '1px solid'}
            borderColor={isSelected ? 'veeva_orange_color_mode' : 'gray_background_color_mode'}
            _hover={{ backgroundColor: isSelected ? undefined : 'workflow_log_card_hover_color_mode' }}
            onClick={onSelect}
        >
            <Text fontWeight='bold' color='veeva_orange_color_mode' overflowWrap='anywhere'>
                {workflowRecord.workflowName}
            </Text>
            {workflowRecord.record && (
                <Flex {...RecordRowStyle}>
                    <Span marginRight='4px'>Record:</Span>
                    <Span overflowWrap='anywhere'>{workflowRecord.record}</Span>
                    {openInVaultHref && (
                        <Link
                            href={openInVaultHref}
                            target='_blank'
                            rel='noopener noreferrer'
                            color='hyperlink_blue_color_mode'
                            onClick={(event) => event.stopPropagation()}
                        >
                            Open in Vault
                            <Box as={PiArrowSquareOutLight} display='inline' style={{ width: 14, height: 14 }} />
                        </Link>
                    )}
                </Flex>
            )}
            {workflowRecord.document && (
                <Flex {...RecordRowStyle}>
                    <Span marginRight='4px'>Document:</Span>
                    <Span overflowWrap='anywhere'>{workflowRecord.document}</Span>
                    {openInVaultHref && (
                        <Link
                            href={openInVaultHref}
                            target='_blank'
                            rel='noopener noreferrer'
                            color='hyperlink_blue_color_mode'
                            onClick={(event) => event.stopPropagation()}
                        >
                            Open in Vault
                            <Box as={PiArrowSquareOutLight} display='inline' style={{ width: 14, height: 14 }} />
                        </Link>
                    )}
                </Flex>
            )}
            {(workflowRecord.startTime || workflowRecord.endTime || workflowRecord.hasError) && (
                <Flex justify='space-between' align='flex-end' gap={2} marginTop='8px'>
                    <Box minWidth='0'>
                        {workflowRecord.startTime && (
                            <Flex {...TimestampRowStyle}>
                                <Span {...TimestampLabelStyle}>Start:</Span>
                                <Span overflowWrap='anywhere'>{formattedStartTime}</Span>
                            </Flex>
                        )}
                        {workflowRecord.endTime && (
                            <Flex {...TimestampRowStyle}>
                                <Span {...TimestampLabelStyle}>End:</Span>
                                <Span overflowWrap='anywhere'>{formattedEndTime}</Span>
                            </Flex>
                        )}
                    </Box>
                    {workflowRecord.hasError && (
                        <Text {...ErrorBadgeStyle} flexShrink={0}>
                            ERROR
                        </Text>
                    )}
                </Flex>
            )}
        </Box>
    );
}

const CardContainerStyle: BoxProps = {
    padding: '12px',
    borderRadius: '8px',
    boxShadow: 'sm',
    cursor: 'pointer',
};

const RecordRowStyle: FlexProps = {
    align: 'center',
    wrap: 'wrap',
    gap: 2,
    marginTop: '4px',
    fontSize: 'sm',
    color: 'veeva_dark_gray_text_color_mode',
};

const TimestampRowStyle: FlexProps = {
    gap: 1,
    fontSize: 'sm',
    color: 'veeva_dark_gray_text_color_mode',
};

const TimestampLabelStyle: TextProps = {
    fontWeight: 'bold',
    width: '50px',
};

const ErrorBadgeStyle: TextProps = {
    color: 'veeva_sunset_red_color_mode',
    fontSize: 'sm',
    fontWeight: 'bold',
};
