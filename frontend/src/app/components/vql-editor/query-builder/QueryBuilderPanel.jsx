import { Box, Button, Divider, Heading, Stack } from '@chakra-ui/react';
import { Panel } from 'react-resizable-panels';
import VerticalResizeHandle from '../../shared/VerticalResizeHandle';
import QueryObjectSelector from './QueryObjectSelector';
import QueryFieldsSelector from './QueryFieldsSelector';
import QueryTargetSelector from './QueryTargetSelector';
import WhereClauseBuilder from './WhereClauseBuilder';

export default function QueryBuilderPanel({
    vaultObjects,
    vaultObjectsError,
    loadingVaultObjects,
    selectedObject,
    setSelectedObject,
    selectedFields,
    setSelectedFields,
    fieldOptions,
    fieldOptionsError,
    loadingObjectMetadata,
    buildQuery,
    canBuildQuery,
    selectedFilters,
    handleSelectedFilterEdits,
    logicalOperator,
    setLogicalOperator,
    operatorOptions,
    booleanValueOptions,
    addNewFilterRow,
    picklistValueOptions,
    removeFilterRow
}) {

    return (
        <>
            <VerticalResizeHandle/>
            <Panel
                id='query-builder-panel'
                order={2}
                defaultSizePercentage={50}
                minSizePercentage={10}
                maxSizePercentage={50}
            >
                <Stack {...ParentStackStyle}>
                    <Box position='sticky'>
                        <Heading {...HeadingStyle}>Query Builder</Heading>
                        <Divider {...HorizontalDividerStyle} />
                    </Box>
                    <Box position='sticky' marginRight='5px'>
                        <Button
                            {...BuildQueryButtonStyle}
                            onClick={buildQuery}
                            isDisabled={!canBuildQuery()}
                        >
                            Build Query in Editor
                        </Button>
                    </Box>
                    <Box {...QueryBuilderBoxStyle}>
                        <QueryTargetSelector/>
                        <QueryObjectSelector
                            vaultObjects={vaultObjects}
                            selectedObject={selectedObject}
                            setSelectedObject={setSelectedObject}
                            loadingVaultObjects={loadingVaultObjects}
                            vaultObjectsError={vaultObjectsError}
                        />
                        {selectedObject &&
                            <>
                                <QueryFieldsSelector
                                    selectedFields={selectedFields}
                                    setSelectedFields={setSelectedFields}
                                    fieldOptions={fieldOptions}
                                    fieldOptionsError={fieldOptionsError}
                                    loadingObjectMetadata={loadingObjectMetadata}
                                />
                                <WhereClauseBuilder
                                    fieldOptions={fieldOptions}
                                    selectedFilters={selectedFilters}
                                    handleSelectedFilterEdits={handleSelectedFilterEdits}
                                    logicalOperator={logicalOperator}
                                    setLogicalOperator={setLogicalOperator}
                                    operatorOptions={operatorOptions}
                                    booleanValueOptions={booleanValueOptions}
                                    addNewFilterRow={addNewFilterRow}
                                    picklistValueOptions={picklistValueOptions}
                                    removeFilterRow={removeFilterRow}
                                />
                            </>
                        }
                    </Box>
                </Stack>
            </Panel>
            <Divider {...VerticalDividerStyle} />
        </>
    );
}

const ParentStackStyle = {
    height: '100%',
    flex: '0 0',
    backgroundColor: 'white.color_mode'
};

const HeadingStyle = {
    color: 'veeva_orange.color_mode',
    size: 'md',
    margin: '5px'
};

const HorizontalDividerStyle = {
    borderColor: 'veeva_light_gray.500',
    borderWidth: '1px'
};

const BuildQueryButtonStyle = {
    size: 'sm',
    width: '100%',
    borderRadius: '6px',
    color: 'white',
    backgroundColor: 'veeva_orange.color_mode',
    fontWeight: 'bold',
}

const QueryBuilderBoxStyle = {
    height: '100%',
    overflow: 'auto'
};

const VerticalDividerStyle = {
    orientation: 'vertical',
    borderColor: 'veeva_light_gray.500',
    height: 'auto',
    borderWidth: '1px'
};
