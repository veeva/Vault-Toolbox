import { Box, Flex, VStack, Spacer, IconButton } from '@chakra-ui/react';
import { PiTreeStructureBold } from 'react-icons/pi';
import { Panel, PanelGroup } from 'react-resizable-panels';
import ContextualHelpButton from '../components/shared/ContextualHelpButton';
import TelemetryData from '../components/shared/TelemetryData';
import VaultInfoIsland from '../components/shared/VaultInfoIsland';
import QueryBuilderPanel from '../components/vql-editor/query-builder/QueryBuilderPanel';
import VqlHeaderRow from '../components/vql-editor/VqlHeaderRow';
import VqlEditorIsland from '../components/vql-editor/VqlEditorIsland';
import VqlProdVaultWarningModal from '../components/vql-editor/VqlProdVaultWarningModal';
import useQueryBuilder from '../hooks/vql-editor/useQueryBuilder';
import useVqlQuery from '../hooks/vql-editor/useVqlQuery';
import { isProductionVault } from '../services/SharedServices';

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
    const {
        vaultObjects,
        vaultObjectsError,
        loadingVaultObjects,
        selectedObject,
        setSelectedObject,
        fieldOptions,
        fieldOptionsError,
        loadingObjectMetadata,
        selectedFields,
        setSelectedFields,
        selectedFilters,
        handleSelectedFilterEdits,
        displayQueryBuilder,
        logicalOperator,
        setLogicalOperator,
        operatorOptions,
        booleanValueOptions,
        picklistValueOptions,
        addNewFilterRow,
        removeFilterRow,
        toggleQueryBuilder,
        buildQuery,
        canBuildQuery,
    } = useQueryBuilder({ setCode });

    return (
        <>
            <Flex justify='flex-start' height='100%'>
                <PanelGroup direction='horizontal' autoSaveId='VqlEditorPage-PanelGroup'>
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
                    { displayQueryBuilder
                        ? (
                            <QueryBuilderPanel
                                vaultObjects={vaultObjects}
                                vaultObjectsError={vaultObjectsError}
                                loadingVaultObjects={loadingVaultObjects}
                                selectedObject={selectedObject}
                                setSelectedObject={setSelectedObject}
                                selectedFields={selectedFields}
                                setSelectedFields={setSelectedFields}
                                selectedFilters={selectedFilters}
                                handleSelectedFilterEdits={handleSelectedFilterEdits}
                                fieldOptions={fieldOptions}
                                fieldOptionsError={fieldOptionsError}
                                loadingObjectMetadata={loadingObjectMetadata}
                                buildQuery={buildQuery}
                                canBuildQuery={canBuildQuery}
                                logicalOperator={logicalOperator}
                                setLogicalOperator={setLogicalOperator}
                                operatorOptions={operatorOptions}
                                booleanValueOptions={booleanValueOptions}
                                addNewFilterRow={addNewFilterRow}
                                picklistValueOptions={picklistValueOptions}
                                removeFilterRow={removeFilterRow}
                            />
                        )
                        : null}
                </PanelGroup>
                <Box height='100vh' flex='0 0' >
                    <Flex flexDirection='column' height='100%'>
                        <IconButton
                            icon={<PiTreeStructureBold size={20} style={{ margin: '4px' }} />}
                            onClick={toggleQueryBuilder}
                            color={displayQueryBuilder ? 'white' : 'veeva_orange.color_mode'}
                            backgroundColor={displayQueryBuilder ? 'veeva_orange.color_mode' : 'transparent'}
                            {...ToggleQueryBuilderButtonStyle}
                        />
                        <Spacer />
                        <ContextualHelpButton
                            tooltip='VQL Documentation'
                            url='https://developer.veevavault.com/vql/'
                        />
                    </Flex>
                </Box>
            </Flex>
            { isProductionVault() ? <VqlProdVaultWarningModal /> : null }
        </>
    );
}

const VqlEditorStackStyle = {
    height: '100%',
    backgroundColor: 'veeva_light_gray.color_mode',
    flex: 1,
    boxShadow: 'inset -5px 0 8px -8px rgba(0,0,0,0.3), inset 5px 0 8px -8px rgba(0,0,0,0.3)',
    spacing: 0
};

const ToggleQueryBuilderButtonStyle = {
    size: 'auto',
    borderRadius: '6px',
    margin: '5px'
}
