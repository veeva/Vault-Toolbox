import { useEffect } from 'react';
import { isCollapsedJoinObject, type JoinObjectInfo } from '../../../utils/erd-explorer/ErdExplorerHelper';
import { discoverJoinCandidateNames } from '../../../utils/erd-explorer/graph/ErdExplorerRecursionHelpers';
import type { ErdRelationship } from '../../../utils/erd-explorer/ErdExplorerTypes';
import type { ErdObjectRecord } from '../useErdExplorerData';

interface UseErdJoinAutoMaterializeParams {
    /** False until the schema is in. Collapsing earlier would fetch candidates one at a time. */
    schemaReady: boolean;
    hideSimpleJoins: boolean;
    hideComplexJoins: boolean;
    placedObjects: string[];
    joinInfoByName: Map<string, JoinObjectInfo>;
    relationshipsByObject: Record<string, ErdRelationship[]>;
    ensureObjectAsync: (name: string) => Promise<ErdObjectRecord>;
    addJoinObjects: (names: string[]) => void;
}

/**
 * When the "hide simple/complex join objects" view settings are on, automatically places any join
 * objects that bridge two already-placed objects so they can be collapsed into M:M edges. Waits for the
 * schema, so an imported diagram settles once rather than fetching each candidate itself.
 */
export function useErdJoinAutoMaterialize({
    schemaReady,
    hideSimpleJoins,
    hideComplexJoins,
    placedObjects,
    joinInfoByName,
    relationshipsByObject,
    ensureObjectAsync,
    addJoinObjects,
}: UseErdJoinAutoMaterializeParams) {
    useEffect(() => {
        if (!schemaReady) return;
        if (!hideSimpleJoins && !hideComplexJoins) return;
        const nonJoinParents = placedObjects.filter((name) => !joinInfoByName.has(name));
        const candidates = discoverJoinCandidateNames(nonJoinParents, relationshipsByObject);
        if (candidates.length === 0) return;
        const placedSet = new Set(placedObjects);
        const hideSettings = { hideSimpleJoinObjects: hideSimpleJoins, hideComplexJoinObjects: hideComplexJoins };
        let cancelled = false;
        void (async () => {
            const resolved = await Promise.all(
                candidates.map((name) => ensureObjectAsync(name).then((record) => [name, record] as const)),
            );
            if (cancelled) return;
            const confirmedJoins = resolved
                .filter(([name, record]) => !placedSet.has(name) && isCollapsedJoinObject(record, hideSettings, placedSet))
                .map(([name]) => name);
            if (confirmedJoins.length > 0) addJoinObjects(confirmedJoins);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schemaReady, hideSimpleJoins, hideComplexJoins, placedObjects, joinInfoByName, relationshipsByObject, ensureObjectAsync, addJoinObjects]);
}
