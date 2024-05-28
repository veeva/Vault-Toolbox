import { Box, Flex, VStack } from '@chakra-ui/react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import TelemetryData from '../components/shared/TelemetryData';
import VaultInfoIsland from '../components/shared/VaultInfoIsland';
import VqlHeaderRow from '../components/vql-editor/VqlHeaderRow';
import VqlEditorIsland from '../components/vql-editor/VqlEditorIsland';
import useVqlQuery from '../hooks/vql-editor/useVqlQuery';

export default function VqlEditorPage() {
    const {
        code, 
        setCode, 
        consoleOutput, 
        queryEditorTabIndex, 
        previousPage, 
        nextPage, 
        queryDescribe,
        isExecutingQuery, 
        isDownloading,
        queryTelemetryData,
        submitVqlQuery, 
        downloadQueryResults, 
        getMaxRowSize,
        queryNextPage, 
        queryPreviousPage, 
        canDownload, 
        getSubqueryFieldCount, 
        isPicklist, 
        isPrimaryFieldRichText, 
        isPrimaryFieldString, 
        isSubqueryObject
    } = useVqlQuery();

    return (
        <Flex justify='flex-start' height='100%'>
            <PanelGroup direction='horizontal'>
                <Panel id='vql-editor-panel' order={1}>
                    <VStack {...VqlEditorStackStyle}>
                        <VqlHeaderRow
                            consoleOutput={consoleOutput[queryEditorTabIndex]}
                            submitVqlQuery={submitVqlQuery}
                            downloadQueryResults={downloadQueryResults}
                            isExecutingQuery={isExecutingQuery}
                            isDownloading={isDownloading}
                            canDownload={canDownload}
                        />
                        <VqlEditorIsland
                            code={code}
                            setCode={setCode}
                            isExecutingApiCall={isExecutingQuery}
                            consoleOutput={consoleOutput[queryEditorTabIndex]}
                            queryDescribe={queryDescribe}
                            getSubqueryFieldCount={getSubqueryFieldCount}
                            isPicklist={isPicklist}
                            isPrimaryFieldRichText={isPrimaryFieldRichText}
                            isPrimaryFieldString={isPrimaryFieldString}
                            isSubqueryObject={isSubqueryObject}
                            getMaxRowSize={getMaxRowSize}
                            isDownloading={isDownloading}
                            nextPage={nextPage}
                            previousPage={previousPage}
                            queryNextPage={queryNextPage}
                            queryPreviousPage={queryPreviousPage}
                        />
                        <VaultInfoIsland>
                            <TelemetryData telemetryData={queryTelemetryData} />
                        </VaultInfoIsland>
                    </VStack>
                </Panel>
            </PanelGroup>
            <Box height='100vh' flex='0 0' minWidth='38px' />
        </Flex>
    );
}

const VqlEditorStackStyle = {
    height: '100%',
    backgroundColor: 'veeva_light_gray.color_mode',
    flex: 1,
    boxShadow: 'inset -5px 0 8px -8px rgba(0,0,0,0.3), inset 5px 0 8px -8px rgba(0,0,0,0.3)',
    spacing: 0
};
