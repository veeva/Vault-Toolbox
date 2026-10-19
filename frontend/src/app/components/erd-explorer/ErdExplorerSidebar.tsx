import { Box } from '@chakra-ui/react';
import type useErdExplorer from '../../hooks/erd-explorer/useErdExplorer';
import { useErdFieldSelectorTarget } from '../../hooks/erd-explorer/sidebar/useErdFieldSelectorTarget';
import AddObjectsTab from './sidebar/AddObjectsTab';
import FieldSelectorTab from './sidebar/FieldSelectorTab';
import ViewSettingsTab from './sidebar/ViewSettingsTab';

type ErdExplorerState = ReturnType<typeof useErdExplorer>;

interface ErdExplorerSidebarProps {
    controller: ErdExplorerState;
}

/** Sidebar body — renders the active tab's content. */
export default function ErdExplorerSidebar({ controller }: ErdExplorerSidebarProps) {
    const {
        activeTab,
        objectList,
        hiddenJoinNames,
        schemaStatus,
        schemaError,
        schemaProgress,
        reloadSchema,
        placedObjects,
        addObjects,
        focusObject,
        removeObject,
        pendingSwap,
        cancelSwap,
        getRelationships,
        ensureObject,
        objectCount,
        relationshipCount,
        singleSelectedObject,
        records,
        summaryByName,
        visibleFieldSetFor,
        toggleField,
        setFieldsForObject,
        retryObject,
        viewSettings,
        setViewSetting,
        edgeColors,
        setEdgeColor,
        restoreViewSettingsDefaults,
    } = controller;
    const { fieldTarget, fieldTargetRecord, fieldTargetSummary } = useErdFieldSelectorTarget({
        singleSelectedObject,
        records,
        summaryByName,
    });

    return (
        <Box height='100%' backgroundColor='white_color_mode' overflow='hidden'>
            {activeTab === 'addObjects' && (
                <AddObjectsTab
                    objectList={objectList}
                    hiddenJoinNames={hiddenJoinNames}
                    status={schemaStatus}
                    error={schemaError}
                    progress={schemaProgress}
                    onReload={reloadSchema}
                    placedObjects={placedObjects}
                    onAdd={addObjects}
                    onFocus={focusObject}
                    onRemove={removeObject}
                    pendingSwap={pendingSwap}
                    onCancelSwap={cancelSwap}
                    getRelationships={getRelationships}
                    ensureObject={ensureObject}
                    objectCount={objectCount}
                    relationshipCount={relationshipCount}
                />
            )}

            {activeTab === 'fields' && (
                <FieldSelectorTab
                    focusedObject={fieldTarget}
                    record={fieldTargetRecord}
                    summary={fieldTargetSummary}
                    visibleFieldSet={fieldTarget ? visibleFieldSetFor(fieldTarget) : new Set()}
                    onToggleField={(fieldName) => fieldTarget && toggleField(fieldTarget, fieldName)}
                    onSetFields={(fieldNames) => fieldTarget && setFieldsForObject(fieldTarget, fieldNames)}
                    onRetry={() => fieldTarget && retryObject(fieldTarget)}
                />
            )}

            {activeTab === 'settings' && (
                <ViewSettingsTab
                    viewSettings={viewSettings}
                    setViewSetting={setViewSetting}
                    edgeColors={edgeColors}
                    setEdgeColor={setEdgeColor}
                    onRestoreDefaults={restoreViewSettingsDefaults}
                />
            )}
        </Box>
    );
}
