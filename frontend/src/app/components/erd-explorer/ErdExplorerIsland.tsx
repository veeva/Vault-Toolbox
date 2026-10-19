import { useColorMode } from '../shared/ui-components/color-mode';
import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    SelectionMode,
    type EdgeTypes,
    type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './erdExplorer.css';
import { Box, BoxProps, Button, HStack } from '@chakra-ui/react';
import { PiArrowArcLeft, PiArrowArcRight, PiBroom, PiSelectionAll, PiTrash } from 'react-icons/pi';
import CanvasObjectSearch from './CanvasObjectSearch';
import { Tooltip } from '../shared/ui-components/tooltip';
import type useErdExplorer from '../../hooks/erd-explorer/useErdExplorer';
import { ERD_EXTERNAL_NODE_TYPE, ERD_OBJECT_NODE_TYPE } from '../../utils/erd-explorer/ErdExplorerTypes';
import ObjectNode from './canvas/ObjectNode';
import ExternalTargetNode from './canvas/ExternalTargetNode';
import EdgePanHandler from './canvas/EdgePanHandler';
import FloatingEdge from './canvas/FloatingEdge';
import ErdExplorerEmptyState from './ErdExplorerEmptyState';
import ErdObjectRelationshipsDialog from './ErdObjectRelationshipsDialog';
import ErdBulkSelectionToolbar from './ErdBulkSelectionToolbar';
import ErdLegend from './canvas/ErdLegend';
import ErdRecursiveConfirmDialog from './ErdRecursiveConfirmDialog';

// Defined at module scope so React Flow gets a stable reference (avoids re-render warnings).
const nodeTypes: NodeTypes = {
    [ERD_OBJECT_NODE_TYPE]: ObjectNode,
    [ERD_EXTERNAL_NODE_TYPE]: ExternalTargetNode,
};

const edgeTypes: EdgeTypes = {
    floating: FloatingEdge,
};

type ErdExplorerState = ReturnType<typeof useErdExplorer>;

interface ErdExplorerIslandProps {
    controller: ErdExplorerState;
}

// React Flow's Background grid color is plain CSS, so hex codes live here (matches other tools).
const GridColor = { light: '#ccc', dark: '#555' };

/** The interactive ERD canvas: React Flow graph + empty-state overlay + object relationships dialog. */
export default function ErdExplorerIsland({ controller }: ErdExplorerIslandProps) {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onNodeClick,
        onNodesDelete,
        onNodeDragStart,
        onNodeDragStop,
        onSelectionChange,
        onSelectionStart,
        onSelectionEnd,
        onInit,
        selectedNodeIds,
        deleteSelected,
        setFieldsForSelected,
        placedObjects,
        summaryByName,
        objectDialogTarget,
        objectDialogRelationships,
        closeObjectDialog,
        canvasContainerRef,
        addObjects,
        removeObject,
        addRelatedRecursive,
        pendingRecursiveConfirm,
        confirmRecursiveAdd,
        cancelRecursiveAdd,
        viewSettings,
        edgeColors,
        tidyLayout,
        selectAll,
        clearCanvas,
        undo,
        redo,
        canUndo,
        canRedo,
        searchableObjects,
        focusObject,
    } = controller;
    const { colorMode } = useColorMode();

    return (
        <Box ref={canvasContainerRef} {...IslandContainerStyle}>
            {placedObjects.length === 0 ? (
                <ErdExplorerEmptyState />
            ) : (
                <>
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            onInit={onInit}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onNodeClick={onNodeClick}
                            // No context menus anywhere on the canvas: suppress the native one everywhere so
                            // right-click never shows the browser menu. Right-drag still pans (panOnDrag).
                            onEdgeContextMenu={(event) => event.preventDefault()}
                            onNodeContextMenu={(event) => event.preventDefault()}
                            onPaneContextMenu={(event) => event.preventDefault()}
                            onNodesDelete={onNodesDelete}
                            onNodeDragStart={onNodeDragStart}
                            onNodeDragStop={onNodeDragStop}
                            onSelectionChange={onSelectionChange}
                            onSelectionStart={onSelectionStart}
                            onSelectionEnd={onSelectionEnd}
                            selectionOnDrag
                            panOnDrag={[1, 2] as number[]}
                            selectionMode={SelectionMode.Partial}
                            selectionKeyCode={null}
                            multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
                            fitView
                            minZoom={0.1}
                            maxZoom={4}
                            colorMode={colorMode}
                            nodesConnectable={false}
                            edgesReconnectable={false}
                        >
                            <EdgePanHandler />
                            <Controls showInteractive={false} />
                            <MiniMap pannable zoomable />
                            <Background color={colorMode === 'dark' ? GridColor.dark : GridColor.light} gap={16} />
                            {viewSettings.colorCodeEdges && viewSettings.showLegend && (
                                <ErdLegend edgeColors={edgeColors} />
                            )}
                        </ReactFlow>
                    </ReactFlowProvider>

                    {/* Canvas action buttons: Search + Undo/Redo + Tidy/Select All/Clear — to the right of ReactFlow's Controls */}
                    <Box position='absolute' bottom='15px' left='60px' zIndex={10}>
                        <HStack gap={1}>
                            <CanvasObjectSearch objects={searchableObjects} onFocus={focusObject} dropUp />
                            <Tooltip content='Undo' showArrow>
                                <Button {...CanvasActionButtonStyle} onClick={undo} disabled={!canUndo} aria-label='Undo'>
                                    <PiArrowArcLeft />
                                </Button>
                            </Tooltip>
                            <Tooltip content='Redo' showArrow>
                                <Button {...CanvasActionButtonStyle} onClick={redo} disabled={!canRedo} aria-label='Redo'>
                                    <PiArrowArcRight />
                                </Button>
                            </Tooltip>
                            <Button {...CanvasActionButtonStyle} onClick={tidyLayout} aria-label='Tidy'>
                                <PiBroom style={{ marginRight: 3 }} /> Tidy
                            </Button>
                            <Button {...CanvasActionButtonStyle} onClick={selectAll} aria-label='Select all objects'>
                                <PiSelectionAll style={{ marginRight: 3 }} /> Select all
                            </Button>
                            <Button {...CanvasActionButtonStyle} onClick={clearCanvas} aria-label='Clear all objects'>
                                <PiTrash style={{ marginRight: 3 }} /> Clear
                            </Button>
                        </HStack>
                    </Box>

                    {selectedNodeIds.length >= 2 && (
                        <ErdBulkSelectionToolbar
                            selectedCount={selectedNodeIds.length}
                            onSetSelectedFields={setFieldsForSelected}
                            onDeleteSelected={deleteSelected}
                        />
                    )}

                    {objectDialogTarget && (
                        <ErdObjectRelationshipsDialog
                            key={objectDialogTarget}
                            containerRef={canvasContainerRef}
                            objectName={objectDialogTarget}
                            record={objectDialogRelationships?.record}
                            relationships={objectDialogRelationships?.relationships ?? null}
                            placedObjects={placedObjects}
                            summaryByName={summaryByName}
                            onAdd={addObjects}
                            onAddRecursive={(depth, directions) => addRelatedRecursive(objectDialogTarget, depth, directions)}
                            onRemove={() => removeObject(objectDialogTarget)}
                            onClose={closeObjectDialog}
                        />
                    )}
                </>
            )}

            <ErdRecursiveConfirmDialog
                open={!!pendingRecursiveConfirm}
                count={pendingRecursiveConfirm?.names.length ?? 0}
                onConfirm={confirmRecursiveAdd}
                onCancel={cancelRecursiveAdd}
            />
        </Box>
    );
}

const CanvasActionButtonStyle = {
    size: 'xs',
    variant: 'outline',
    borderRadius: '6px',
    backgroundColor: 'white_color_mode',
    boxShadow: '0 0 4px rgba(0,0,0,0.2)',
    fontSize: 'xs',
} as const;

const IslandContainerStyle: BoxProps = {
    flex: 1,
    minHeight: 0,
    width: 'calc(100% - 20px)',
    margin: '0px 0px 5px 0px',
    borderRadius: '8px',
    backgroundColor: 'white_color_mode',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)',
    position: 'relative',
    overflow: 'hidden',
};
