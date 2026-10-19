import { useCallback, useState } from 'react';
import { toaster } from '../../../components/shared/ui-components/toaster';
import { isExternalTarget } from '../../../utils/erd-explorer/ErdExplorerHelper';
import { classifyRecursiveAddCount, neighborObjectsOf } from '../../../utils/erd-explorer/graph/ErdExplorerRecursionHelpers';
import type { DirectionOptions } from '../../../utils/erd-explorer/graph/ErdExplorerRecursionHelpers';
import type { ErdRelationship } from '../../../utils/erd-explorer/ErdExplorerTypes';

/** Recursive-add size thresholds (counted in NEW objects the expansion would place). */
const RECURSIVE_WARN_THRESHOLD = 100;
const RECURSIVE_REFUSE_THRESHOLD = 500;

interface UseErdRecursiveAddParams {
    knownObjects: Set<string>;
    placedObjects: string[];
    ensureObjectAsync: (name: string) => Promise<{ status: string; relationships: ErdRelationship[] }>;
    onConfirmedAdd: (seed: string, names: string[]) => void;
    onClose: () => void;
}

/**
 * Manages the recursive-add BFS, pending-confirm dialog state, and toast feedback.
 * `onConfirmedAdd` is called by the caller (useErdExplorer) to actually place the objects and queue layout.
 */
export function useErdRecursiveAdd({
    knownObjects,
    placedObjects,
    ensureObjectAsync,
    onConfirmedAdd,
    onClose,
}: UseErdRecursiveAddParams) {
    const [pendingRecursiveConfirm, setPendingRecursiveConfirm] = useState<{ seed: string; names: string[] } | null>(null);

    const addRelatedRecursive = useCallback(
        async (seed: string, depth: number, directions: DirectionOptions = {}) => {
            onClose();
            const placedSnapshot = new Set(placedObjects);
            const visited = new Set<string>([seed]);
            const objectsToAdd = new Set<string>();
            let frontier = [seed];
            let refused = false;

            const bfsDirections = { ...directions, includeDocuments: true };
            for (let level = 0; level < depth && frontier.length > 0 && !refused; level++) {
                const realFrontier = frontier.filter((name) => !isExternalTarget(name));
                const records = await Promise.all(realFrontier.map((name) => ensureObjectAsync(name)));
                const nextFrontier: string[] = [];
                realFrontier.forEach((name, frontierIndex) => {
                    if (refused) return;
                    const record = records[frontierIndex];
                    if (record.status !== 'ready') return;
                    for (const neighbour of neighborObjectsOf(record.relationships, name, knownObjects, bfsDirections)) {
                        if (visited.has(neighbour)) continue;
                        visited.add(neighbour);
                        if (!isExternalTarget(neighbour)) nextFrontier.push(neighbour);
                        if (placedSnapshot.has(neighbour) || objectsToAdd.has(neighbour)) continue;
                        objectsToAdd.add(neighbour);
                        if (objectsToAdd.size >= RECURSIVE_REFUSE_THRESHOLD) {
                            refused = true;
                            break;
                        }
                    }
                });
                frontier = refused ? [] : nextFrontier;
            }

            const verdict = refused
                ? 'refuse'
                : classifyRecursiveAddCount(objectsToAdd.size, RECURSIVE_WARN_THRESHOLD, RECURSIVE_REFUSE_THRESHOLD);

            if (verdict === 'refuse') {
                toaster.create({
                    type: 'error',
                    title: `Too many related objects (${RECURSIVE_REFUSE_THRESHOLD}+)`,
                    description: `This expansion would add ${RECURSIVE_REFUSE_THRESHOLD} or more objects. Reduce the depth or expand from individual nodes instead.`,
                });
                return;
            }
            if (objectsToAdd.size === 0) {
                toaster.create({ type: 'info', title: 'No new related objects to add' });
                return;
            }

            const names = [...objectsToAdd];
            if (verdict === 'warn') {
                setPendingRecursiveConfirm({ seed, names });
                return;
            }
            onConfirmedAdd(seed, names);
        },
        [placedObjects, ensureObjectAsync, knownObjects, onConfirmedAdd, onClose],
    );

    const confirmRecursiveAdd = useCallback(() => {
        setPendingRecursiveConfirm((pending) => {
            if (pending) onConfirmedAdd(pending.seed, pending.names);
            return null;
        });
    }, [onConfirmedAdd]);

    const cancelRecursiveAdd = useCallback(() => setPendingRecursiveConfirm(null), []);

    return { addRelatedRecursive, pendingRecursiveConfirm, confirmRecursiveAdd, cancelRecursiveAdd };
}
