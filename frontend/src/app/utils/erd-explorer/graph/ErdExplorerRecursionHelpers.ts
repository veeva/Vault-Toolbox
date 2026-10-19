import type { ErdRelationship } from '../ErdExplorerTypes';
import { isDocumentTarget, isExternalTarget, isPhantomTarget, isUsersGroupsTarget } from '../ErdExplorerHelper';

/** Recursive-add size bands: 'ok' (<warn), 'warn' (proceed with a heads-up), 'refuse' (blocked). */
export type RecursiveAddVerdict = 'ok' | 'warn' | 'refuse';

/** Classify how many NEW objects a recursive add would place against the warn/refuse thresholds. */
export function classifyRecursiveAddCount(count: number, warnAt: number, refuseAt: number): RecursiveAddVerdict {
    if (count >= refuseAt) return 'refuse';
    if (count >= warnAt) return 'warn';
    return 'ok';
}

/** Which relationship directions a recursive traversal should follow (default: both). */
export interface DirectionOptions {
    inbound?: boolean;
    outbound?: boolean;
    includeDocuments?: boolean;
}

/**
 * Real (addable) object neighbours of one object. Users/groups external targets, self-references,
 * and phantom (unlisted) targets are never returned. Documents is included when `includeDocuments` is
 * true. By default both directions are followed; pass `directions` to restrict to inbound- or
 * outbound-only.
 */
export function neighborObjectsOf(
    relationships: ErdRelationship[],
    selfName: string,
    knownObjects?: Set<string>,
    directions: DirectionOptions = {},
): string[] {
    const { inbound = true, outbound = true, includeDocuments = false } = directions;
    const seen = new Set<string>();
    const neighbours: string[] = [];
    for (const relationship of relationships) {
        const { target, direction } = relationship;
        if (direction === 'inbound' && !inbound) continue;
        if (direction === 'outbound' && !outbound) continue;
        if (target === selfName) continue;
        if (isDocumentTarget(target) && !includeDocuments) continue;
        if (isUsersGroupsTarget(target)) continue;
        if (!isExternalTarget(target) && isPhantomTarget(target, knownObjects)) continue;
        if (seen.has(target)) continue;
        seen.add(target);
        neighbours.push(target);
    }
    return neighbours;
}

/**
 * Names of candidate join objects that bridge two placed objects. A join owns an FK pointing at each
 * parent, so it surfaces as an INBOUND relationship target on BOTH parents. We return child names that
 * are the inbound target of ≥2 placed objects and are not themselves placed — a cheap, bounded
 * pre-filter; the caller fetches each and confirms it's really a join via analyzeJoinObject.
 */
export function discoverJoinCandidateNames(
    placedVisibleNames: string[],
    relationshipsByObject: Record<string, ErdRelationship[]>,
): string[] {
    const placed = new Set(placedVisibleNames);
    const parentsByChild = new Map<string, Set<string>>();
    for (const parent of placedVisibleNames) {
        for (const relationship of relationshipsByObject[parent] ?? []) {
            if (relationship.direction !== 'inbound') continue;
            const child = relationship.target;
            if (placed.has(child) || isExternalTarget(child)) continue;
            let parents = parentsByChild.get(child);
            if (!parents) {
                parents = new Set();
                parentsByChild.set(child, parents);
            }
            parents.add(parent);
        }
    }
    const candidates: string[] = [];
    for (const [child, parents] of parentsByChild) {
        if (parents.size >= 2) candidates.push(child);
    }
    return candidates;
}
