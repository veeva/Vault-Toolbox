import {
    Box,
    BoxProps,
    Flex,
    FlexProps,
    Table,
    TableCellProps,
    Tabs,
    TabsListProps,
    TabsRootProps,
    TabsTriggerProps,
    Text,
} from '@chakra-ui/react';
import { CSSProperties } from 'react';
import { ApiHistoryExpandedDetails } from '../../utils/api-history/ApiHistoryHelper';
import JsonSyntaxHighlighter from './JsonSyntaxHighlighter';

interface ApiHistoryExpandedRowProps {
    details: ApiHistoryExpandedDetails;
}

export default function ApiHistoryExpandedRow({ details }: ApiHistoryExpandedRowProps) {
    return (
        <Flex {...ParentFlexStyle}>
            <Tabs.Root {...TabsRootStyle} defaultValue={details.defaultTabValue}>
                <Flex {...TabsListFlexStyle}>
                    <Tabs.List {...TabListStyle}>
                        <Tabs.Trigger value='request-headers' {...TabLabelStyle}>
                            <Flex width='180px' alignItems='center' justifyContent='center'>
                                Request Headers
                            </Flex>
                        </Tabs.Trigger>
                        <Tabs.Trigger value='request-payload' {...TabLabelStyle}>
                            <Flex width='180px' alignItems='center' justifyContent='center'>
                                Request Payload
                            </Flex>
                        </Tabs.Trigger>
                        <Tabs.Trigger value='response-headers' {...TabLabelStyle}>
                            <Flex width='180px' alignItems='center' justifyContent='center'>
                                Response Headers
                            </Flex>
                        </Tabs.Trigger>
                        {details.responsePayload && (
                            <Tabs.Trigger value='response-payload' {...TabLabelStyle}>
                                <Flex width='180px' alignItems='center' justifyContent='center'>
                                    Response Payload
                                </Flex>
                            </Tabs.Trigger>
                        )}
                        <Tabs.Indicator {...TabIndicatorStyle} />
                    </Tabs.List>
                </Flex>
                <Tabs.Content value='request-headers' padding={0}>
                    {details.allRequestHeaders.length === 0 ? (
                        <Box {...PanelEmptyStateStyle}>
                            <Text color='veeva_dark_gray_text_color_mode'>No request headers recorded.</Text>
                        </Box>
                    ) : (
                        <Box {...HeadersListStyle}>
                            <Table.Root size='sm' width='100%'>
                                <Table.Body>
                                    {details.allRequestHeaders.map((requestHeader) => (
                                        <Table.Row key={requestHeader.label} backgroundColor='transparent'>
                                            <Table.Cell {...HeaderLabelStyle}>{requestHeader.label}</Table.Cell>
                                            <Table.Cell {...HeaderValueStyle}>{requestHeader.value}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    )}
                </Tabs.Content>
                <Tabs.Content value='request-payload' padding={0}>
                    {details.requestPayload.isEmpty ? (
                        <Box {...PanelEmptyStateStyle}>
                            <Text color='veeva_dark_gray_text_color_mode'>No request payload sent.</Text>
                        </Box>
                    ) : details.requestPayload.language === 'json' ? (
                        <Box {...PayloadContainerStyle}>
                            <JsonSyntaxHighlighter dataToDisplay={details.requestPayload.rawText} />
                        </Box>
                    ) : (
                        <Box
                            {...PayloadContainerStyle}
                            padding='12px'
                            fontFamily='mono'
                            backgroundColor='beige_color_mode'
                        >
                            <pre style={PlaintextPreStyle}>{details.requestPayload.rawText}</pre>
                        </Box>
                    )}
                </Tabs.Content>
                <Tabs.Content value='response-headers' padding={0}>
                    {details.allResponseHeaders.length === 0 ? (
                        <Box {...PanelEmptyStateStyle}>
                            <Text color='veeva_dark_gray_text_color_mode'>No response headers recorded.</Text>
                        </Box>
                    ) : (
                        <Box {...HeadersListStyle}>
                            <Table.Root size='sm' width='100%'>
                                <Table.Body>
                                    {details.allResponseHeaders.map((responseHeader) => (
                                        <Table.Row key={responseHeader.label} backgroundColor='transparent'>
                                            <Table.Cell {...HeaderLabelStyle}>{responseHeader.label}</Table.Cell>
                                            <Table.Cell {...HeaderValueStyle}>{responseHeader.value}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    )}
                </Tabs.Content>
                {details.responsePayload && (
                    <Tabs.Content value='response-payload' padding={0}>
                        {details.responsePayload.isEmpty ? (
                            <Box {...PanelEmptyStateStyle}>
                                <Text color='veeva_dark_gray_text_color_mode'>No response body recorded.</Text>
                            </Box>
                        ) : details.responsePayload.language === 'json' ? (
                            <Box {...PayloadContainerStyle}>
                                <JsonSyntaxHighlighter dataToDisplay={details.responsePayload.rawText} />
                            </Box>
                        ) : (
                            <Box
                                {...PayloadContainerStyle}
                                padding='12px'
                                fontFamily='mono'
                                backgroundColor='beige_color_mode'
                            >
                                <pre style={PlaintextPreStyle}>{details.responsePayload.rawText}</pre>
                            </Box>
                        )}
                    </Tabs.Content>
                )}
            </Tabs.Root>
        </Flex>
    );
}

const ParentFlexStyle: FlexProps = {
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'veeva_sunset_yellow.five_percent_opacity',
    borderRadius: '8px',
};

const TabsListFlexStyle: FlexProps = {
    overflowX: 'auto',
    overflowY: 'hidden',
    transform: 'rotateX(180deg)',
    alignItems: 'center',
    backgroundColor: 'white_color_mode',
    minHeight: '60px',
    maxHeight: '60px',
    height: '60px',
    borderBottomRadius: '8px',
};

const TabsRootStyle: TabsRootProps = {
    variant: 'plain',
    size: 'lg',
    height: '100%',
};

const TabListStyle: TabsListProps = {
    height: '100%',
    width: '100%',
    minWidth: '100%',
    transform: 'rotateX(180deg)',
    whiteSpace: 'nowrap',
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400',
};

const TabLabelStyle: Partial<TabsTriggerProps> = {
    color: 'veeva_orange_color_mode',
    fontSize: 'md',
    width: '180px',
    height: '100%',
    paddingX: '0px',
    flexShrink: 0,
};

const TabIndicatorStyle = {
    width: '180px',
    height: '3px',
    bottom: '-3px',
    backgroundColor: 'veeva_orange_color_mode',
    zIndex: 2,
};

const PayloadContainerStyle: BoxProps = {
    maxHeight: '40vh',
    overflow: 'auto',
    borderRadius: '6px',
    marginTop: '8px',
    fontSize: '12px',
};

const PlaintextPreStyle: CSSProperties = {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
};

const PanelEmptyStateStyle: BoxProps = {
    padding: '16px',
    marginTop: '8px',
    textAlign: 'center',
};

const HeadersListStyle: BoxProps = {
    maxHeight: '40vh',
    overflow: 'auto',
    borderRadius: '6px',
    marginTop: '8px',
    padding: '4px 8px',
    fontFamily: 'mono',
    fontSize: '12px',
};

const HeaderCellSharedStyle: TableCellProps = {
    borderBottom: 'solid 1px',
    borderColor: 'gray.200',
    verticalAlign: 'top',
    paddingY: '6px',
    paddingX: '8px',
    fontSize: '12px',
};

const HeaderLabelStyle: TableCellProps = {
    ...HeaderCellSharedStyle,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    width: '1%',
};

const HeaderValueStyle: TableCellProps = {
    ...HeaderCellSharedStyle,
    wordBreak: 'break-all',
};
