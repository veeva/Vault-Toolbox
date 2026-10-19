/**
 * Decides which objects the ERD Explorer still has to ask Vault about. Pure and separate from the data
 * hook so the fetch rules can be tested without a network or a renderer.
 */

import { isExternalTarget } from '../ErdExplorerHelper';
import type { ErdObjectRecord } from '../ErdExplorerTypes';

/**
 * The subset of `requestedNames` that needs a metadata request. A known record is left alone whatever
 * its state, except a `partial` placeholder whose fields are what the request is for — unless the
 * object is not in this Vault at all, when a request would only 404.
 */
export function planObjectFetches(
    requestedNames: string[],
    records: Record<string, ErdObjectRecord>,
): string[] {
    const plannedNames: string[] = [];
    const seenNames = new Set<string>();
    for (const name of requestedNames) {
        if (!name || seenNames.has(name)) continue;
        seenNames.add(name);
        if (isExternalTarget(name)) continue;
        const knownRecord = records[name];
        if (knownRecord && (!knownRecord.partial || knownRecord.missingFromVault)) continue;
        plannedNames.push(name);
    }
    return plannedNames;
}
