import { useMemo } from 'react';
import { analyzeJoinObject, isCollapsedJoinObject } from '../../../utils/erd-explorer/ErdExplorerHelper';
import {
    DOCUMENTS_TARGET,
    EXTERNAL_TARGET_LABELS,
    type ErdField,
    type ErdObjectSummary,
    type ErdRelationship,
} from '../../../utils/erd-explorer/ErdExplorerTypes';
import type { ErdObjectRecord } from '../useErdExplorerData';
import type { JoinObjectInfo } from '../../../utils/erd-explorer/ErdExplorerHelper';
import type { ViewSettings } from '../erdReducer';

const DOCUMENTS_SUMMARY: ErdObjectSummary = {
    name: DOCUMENTS_TARGET,
    label: EXTERNAL_TARGET_LABELS[DOCUMENTS_TARGET],
    source: 'system',
};

interface UseErdDerivedMapsParams {
    placedObjects: string[];
    records: Record<string, ErdObjectRecord>;
    objectList: ErdObjectSummary[];
    viewSettings: Pick<ViewSettings, 'hideSimpleJoinObjects' | 'hideComplexJoinObjects'>;
}

/**
 * Derives the maps and sets used by both the edge builder and the node builder from raw
 * canvas + record state. All values are memoized to minimise downstream re-renders.
 */
export function useErdDerivedMaps({ placedObjects, records, objectList, viewSettings }: UseErdDerivedMapsParams) {
    const summaryByName = useMemo(
        () => new Map(objectList.map((summary) => [summary.name, summary])),
        [objectList],
    );

    const relationshipsByObject = useMemo(() => {
        const relationshipMap: Record<string, ErdRelationship[]> = {};
        placedObjects.forEach((name) => {
            const record = records[name];
            if (record?.status === 'ready') relationshipMap[name] = record.relationships;
        });
        return relationshipMap;
    }, [placedObjects, records]);

    const fieldsByObject = useMemo(() => {
        const fieldMap: Record<string, ErdField[]> = {};
        placedObjects.forEach((name) => {
            const record = records[name];
            if (record?.status === 'ready') fieldMap[name] = record.fields;
        });
        return fieldMap;
    }, [placedObjects, records]);

    const joinInfoByName = useMemo(() => {
        const joinMap = new Map<string, JoinObjectInfo>();
        placedObjects.forEach((name) => {
            const record = records[name];
            if (record?.status !== 'ready') return;
            const joinInfo = analyzeJoinObject(record.fields);
            if (joinInfo) joinMap.set(name, joinInfo);
        });
        return joinMap;
    }, [placedObjects, records]);

    const hideSettings = useMemo(
        () => ({
            hideSimpleJoinObjects: viewSettings.hideSimpleJoinObjects,
            hideComplexJoinObjects: viewSettings.hideComplexJoinObjects,
        }),
        [viewSettings.hideSimpleJoinObjects, viewSettings.hideComplexJoinObjects],
    );

    // The same rule the add paths apply before committing an object, so a join that collapses into a
    // many-to-many edge is decided identically wherever the question is asked.
    const hiddenJoinNames = useMemo(() => {
        const placedSet = new Set(placedObjects);
        return new Set(
            placedObjects.filter((name) => isCollapsedJoinObject(records[name], hideSettings, placedSet)),
        );
    }, [placedObjects, records, hideSettings]);

    const addObjectsList = useMemo(
        () => [DOCUMENTS_SUMMARY, ...objectList],
        [objectList],
    );

    const addObjectsNames = useMemo(
        () => new Set(addObjectsList.map((summary) => summary.name)),
        [addObjectsList],
    );

    const knownObjects = useMemo(() => new Set(objectList.map((summary) => summary.name)), [objectList]);

    const searchableObjects = useMemo(
        () => placedObjects.map((id) => ({ id, label: summaryByName.get(id)?.label ?? id })),
        [placedObjects, summaryByName],
    );

    return {
        summaryByName,
        relationshipsByObject,
        fieldsByObject,
        joinInfoByName,
        hiddenJoinNames,
        addObjectsList,
        addObjectsNames,
        knownObjects,
        searchableObjects,
    };
}
