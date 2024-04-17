import { Box, Flex, IconButton, VStack } from '@chakra-ui/react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { PiTreeStructureBold } from 'react-icons/pi';
import OutstandingAsyncJobWarning from '../components/component-editor/OutstandingAsyncJobWarning';
import ComponentEditorIsland from '../components/component-editor/ComponentEditorIsland';
import ComponentEditorHeaderRow from '../components/component-editor/ComponentEditorHeaderRow';
import ComponentDirectoryPanel from '../components/component-editor/ComponentDirectoryPanel';
import useComponentTree from '../hooks/component-editor/useComponentTree';
import useComponentEditor from '../hooks/component-editor/useComponentEditor';

export default function ComponentEditorPage() {
    const { componentTree, componentTreeError, retrieveComponentTree, loadingComponentTree } = useComponentTree();
    const {
        code,
        setCode,
        selectedComponent,
        setSelectedComponent,
        consoleOutput,
        executeMdl,
        executeMdlAsync,
        retrieveMdlAsyncResults,
        onSelect,
        updateSelectedComponent,
        closeOutstandingAsyncJobWarning,
        toggleComponentTree,
        isExecutingApiCall,
        isExecutingMdl,
        asyncJobId,
        showOutstandingAsyncJobWarning,
        selectedComponentPendingConfirmation,
        displayComponentTree,
    } = useComponentEditor();    

    return (
        <>
            <Flex justify='flex-start' height='100%'>
                <PanelGroup direction='horizontal'>
                    <Panel id='component-editor-panel' order={1}>
                        <VStack {...ComponentEditorStackStyle}>
                            <ComponentEditorHeaderRow
                                setSelectedComponent={setSelectedComponent}
                                executeMdl={executeMdl}
                                executeMdlAsync={executeMdlAsync}
                                retrieveMdlAsyncResults={retrieveMdlAsyncResults}
                                asyncJobId={asyncJobId}
                                isExecutingMdl={isExecutingMdl}
                            />
                            <ComponentEditorIsland
                                consoleOutput={consoleOutput}
                                code={code}
                                setCode={setCode}
                                isExecutingApiCall={isExecutingApiCall}
                            />
                        </VStack>
                    </Panel>
                    { displayComponentTree
                        ? (
                            <ComponentDirectoryPanel
                                retrieveComponentTree={retrieveComponentTree}
                                loadingComponentTree={loadingComponentTree}
                                selectedComponent={selectedComponent}
                                setSelectedComponent={setSelectedComponent}
                                componentTree={componentTree}
                                onSelect={onSelect}
                                componentTreeError={componentTreeError}
                            />
                        )
                        : null}
                </PanelGroup>
                <Box height='100vh' flex='0 0 auto'>
                    <IconButton
                        icon={<PiTreeStructureBold size={20} style={{ margin: '4px' }} />}
                        onClick={toggleComponentTree}
                        size='auto'
                        borderRadius='6px'
                        margin='5px'
                        color={displayComponentTree ? 'white' : 'veeva_orange.500'}
                        backgroundColor={displayComponentTree ? 'veeva_orange.500' : 'white'}
                    />
                </Box>
            </Flex>
            {showOutstandingAsyncJobWarning && <OutstandingAsyncJobWarning isOpen={showOutstandingAsyncJobWarning} onClose={closeOutstandingAsyncJobWarning} onConfirm={updateSelectedComponent} currentComponent={selectedComponentPendingConfirmation} />}
        </>
    );
}

const ComponentEditorStackStyle = {
    height: '100%',
    backgroundColor: 'veeva_light_gray.100',
    flex: 1,
    boxShadow: 'inset -5px 0 8px -8px gray, inset 5px 0 8px -8px gray'
};
