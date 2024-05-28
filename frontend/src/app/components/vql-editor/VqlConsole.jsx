import { Flex, Box, Spacer, Tabs, TabList, Tab, TabPanel, TabPanels, TabIndicator, TableContainer, Table, Button, Tag } from '@chakra-ui/react';
import JsonSyntaxHighlighter from '../shared/JsonSyntaxHighlighter';
import VqlTableHeader from './VqlTableHeader';
import VqlTableBody from './VqlTableBody';

export default function VqlConsole({ consoleOutput, queryDescribe, getSubqueryFieldCount, isPicklist, isPrimaryFieldRichText, getMaxRowSize, nextPage, previousPage, queryNextPage, queryPreviousPage,
    isPrimaryFieldString, isSubqueryObject }) {
    const responseStatus = consoleOutput?.responseStatus;
    const hasSubqueries = queryDescribe?.subqueries?.length > 0;
    const headerRowSpan = hasSubqueries ? 2 : 1;
    const currentPage = Math.floor(consoleOutput?.responseDetails?.pageoffset / consoleOutput?.responseDetails?.pagesize) + 1;
    const totalPages = Math.ceil(consoleOutput?.responseDetails?.total / consoleOutput?.responseDetails?.pagesize);

    return (
        <Tabs {...VqlConsoleTabsStyle} defaultIndex={responseStatus === 'FAILURE' ? 1 : 0}>
            <Flex flexDirection='column' height='100%' overflow='auto' backgroundColor='veeva_sunset_yellow.five_percent_opacity' borderBottomRadius='8px'>
                { consoleOutput
                    ? (
                        <Flex overflow='auto' height='100%'>
                            <TabPanels>
                                <TabPanel padding={0}>
                                    { consoleOutput?.data && consoleOutput.data.length > 0 && queryDescribe
					                ? (
										<TableContainer {...TableContainerStyle}>
											<Table size='md' variant='simple'>
												<VqlTableHeader
													consoleOutput={consoleOutput}
													queryDescribe={queryDescribe}
													hasSubqueries={hasSubqueries}
													isPicklist={isPicklist}
													isPrimaryFieldRichText={isPrimaryFieldRichText}
                                                    isPrimaryFieldString={isPrimaryFieldString}
                                                    isSubqueryObject={isSubqueryObject}
													getSubqueryFieldCount={getSubqueryFieldCount}
													headerRowSpan={headerRowSpan}
												/>
												<VqlTableBody
													consoleOutput={consoleOutput}
													getMaxRowSize={getMaxRowSize}
												/>
											</Table>
										</TableContainer>
                                        )
					                : (
										<Box>
											{ consoleOutput?.data && queryDescribe
                                                && <JsonSyntaxHighlighter dataToDisplay='No results to display' />}
										</Box>
                                        )}
                                </TabPanel>
                                <TabPanel>
                                    <JsonSyntaxHighlighter dataToDisplay={consoleOutput} />
                                </TabPanel>
                            </TabPanels>
                        </Flex>
                    )
                    : null}
                <Spacer />
                <Box {...TabBoxStyle}>
                    <TabList {...TabListStyle}>
                        <Flex>
                            <Box width='180px'>
                                <Tab {...TabLabelStyle}>Table</Tab>
                            </Box>
                            <Box width='180px'>
                                <Tab {...TabLabelStyle}>JSON</Tab>
                            </Box>
                        </Flex>
                        <TabIndicator {...TabIndicatorStyle} />
                        <Spacer />
                        <Button {...PaginationButtonStyle} isDisabled={!previousPage} onClick={queryPreviousPage}>
                            Previous Page
                        </Button>
                        { totalPages ?
                            <Tag {...PageNumberTagStyle}>{currentPage} / {totalPages}</Tag>
                            : null
                        }
                        <Button {...PaginationButtonStyle} isDisabled={!nextPage} onClick={queryNextPage}>
                            Next Page
                        </Button>
                    </TabList>
                </Box>
            </Flex>
        </Tabs>
    );
}

const TableContainerStyle = {
    maxWidth: '100%',
    overflowX: 'unset',
    overflowY: 'unset',
    color: 'text.color_mode'
};

const VqlConsoleTabsStyle = {
    variant: 'unstyled',
    position: 'relative',
    colorScheme: 'veeva_orange',
    size: 'lg',
    height: '100%',
    borderBottomRadius: '8px'
};

const TabListStyle = {
    flex: 1,
    height: '60px',
    borderTop: 'solid 3px',
    borderTopColor: 'gray.400',
    borderBottomRadius: '8px'
};

const TabBoxStyle = {
    backgroundColor: 'white.color_mode',
    position: 'sticky',
    left: 0,
    bottom: 0,
    borderBottomRadius: '8px'
};

const TabLabelStyle = {
    fontSize: 'xl',
    _selected: { color: 'veeva_orange.color_mode' },
    borderBottom: 'none',
    borderBottomRadius: '8px',
    width: '180px'
};

const TabIndicatorStyle = {
    marginTop: '-3px',
    height: '3px',
    backgroundColor: 'veeva_orange.color_mode'
};

const PaginationButtonStyle = {
    backgroundColor: 'veeva_light_gray.color_mode',
    color: 'veeva_dark_gray.text.color_mode',
    boxShadow: '0 0 2px rgba(0,0,0,0.2)',
    marginLeft: '0px',
    marginRight: '10px',
    marginY: 'auto',
    width: '180px'
};

const PageNumberTagStyle = {
    backgroundColor: 'white.color_mode',
    fontSize: 'md',
    color: 'veeva_dark_gray.text.color_mode',
    boxShadow: '0 0 2px rgba(0,0,0,0.2)',
    marginLeft: '0px',
    marginRight: '10px',
    marginY: 'auto',
    width: 'auto',
    height: '40px'
};
