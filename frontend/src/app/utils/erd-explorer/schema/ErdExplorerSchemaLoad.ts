/**
 * Loads the whole object schema in one pass: the object list, plus every `Object` component's MDL via a
 * paginated component-definition query. Each page is parsed and its raw MDL dropped before the next page
 * is fetched, so the Vault's full MDL is never held in memory and so can never be cached by accident.
 *
 * Any failure aborts the whole load and discards what was parsed. A partially loaded schema would show
 * objects missing from the picker and edges missing from the canvas with nothing to say why.
 *
 * Also exports fetchObjectRecord, which fetches one object's fields/relationships/metadata on demand
 * (used to fill in objects the bulk load above didn't cover).
 */

import { queryByPage, queryComponents, retrieveObjectCollection, retrieveObjectMetadata } from '../../../services/ApiService';
import {
    parseObjectFields,
    parseObjectList,
    parseObjectMeta,
    parseRelationshipsFromMetadata,
} from './ErdExplorerApiResponseParsing';
import { firstErrorMessage, isAccessDenied, isFailure, isSessionExpired } from './ErdExplorerApiUtils';
import { acquireSlot, type ErdConcurrencyGate } from './ErdExplorerConcurrency';
import { parseObjectMdl, type ParsedObjectMdl } from './ErdExplorerMdlParsing';
import { buildSchemaRecords } from './ErdExplorerSchemaBuild';
import type { ErdSchemaSnapshot } from './ErdExplorerSchemaCache';
import type { ErdObjectRecord } from '../ErdExplorerTypes';

/** Retrieves every Object component's MDL. Admin-only: the component-definition query is gated. */
const OBJECT_MDL_VQL =
    "SELECT component_name__v, mdl_definition__v FROM vault_component__v WHERE component_type__v = 'Object'";

const ADMIN_REQUIRED_MESSAGE =
    'The ERD Explorer needs Admin access to read this Vault’s object configuration.';

/** How far the load has got, for the progress indication while the Add Objects tab is gated. */
export interface ErdSchemaLoadProgress {
    pagesLoaded: number;
    objectsParsed: number;
    /** True once every page is in and the relationship graph is being derived (the last step). */
    derivingRelationships: boolean;
}

export type ErdSchemaLoadResult =
    | { status: 'ready'; snapshot: ErdSchemaSnapshot }
    | { status: 'error'; error: string };

interface ComponentQueryResponse {
    data?: Array<Record<string, unknown>>;
    responseStatus?: string;
    responseDetails?: { next_page?: string };
}

/**
 * Fetch and parse the whole schema, reporting progress as pages land. Resolves with an error result
 * rather than throwing, so the caller has one failure path to render.
 */
export async function loadObjectSchema(
    onProgress: (progress: ErdSchemaLoadProgress) => void,
): Promise<ErdSchemaLoadResult> {
    try {
        const objectListResponse = await retrieveObjectCollection();
        if (isFailure(objectListResponse)) {
            return { status: 'error', error: firstErrorMessage(objectListResponse, 'Failed to load the object list') };
        }
        const objectList = parseObjectList(objectListResponse);

        const parsedByObject = new Map<string, ParsedObjectMdl>();
        let pagesLoaded = 0;
        let pageResponse = (await queryComponents(OBJECT_MDL_VQL)).queryResponse as ComponentQueryResponse | undefined;

        while (true) {
            if (!pageResponse || isFailure(pageResponse)) {
                const vaultMessage = firstErrorMessage(pageResponse, 'Failed to load the object schema');
                const error = isAccessDenied(pageResponse) ? `${ADMIN_REQUIRED_MESSAGE} ${vaultMessage}` : vaultMessage;
                return { status: 'error', error };
            }

            parsePageIntoSchema(pageResponse, parsedByObject);
            pagesLoaded += 1;
            onProgress({ pagesLoaded, objectsParsed: parsedByObject.size, derivingRelationships: false });

            const nextPage = pageResponse.responseDetails?.next_page;
            if (!nextPage) break;
            pageResponse = (await queryByPage(nextPage)).queryResponse as ComponentQueryResponse | undefined;
        }

        // Inbound relationships need every object's fields, so this can only run once the last page is in.
        onProgress({ pagesLoaded, objectsParsed: parsedByObject.size, derivingRelationships: true });
        return { status: 'ready', snapshot: { records: buildSchemaRecords(parsedByObject, objectList), objectList } };
    } catch (error) {
        return { status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Parse one page of `component_name__v` / `mdl_definition__v` rows into the accumulating schema. The raw
 * MDL text is never stored — only the parse result survives this function.
 */
function parsePageIntoSchema(
    pageResponse: ComponentQueryResponse,
    parsedByObject: Map<string, ParsedObjectMdl>,
): void {
    for (const row of pageResponse.data ?? []) {
        const objectName = row.component_name__v;
        if (typeof objectName !== 'string' || !objectName) continue;
        const parsedObject = parseObjectMdl(row.mdl_definition__v);
        if (parsedObject) parsedByObject.set(objectName, parsedObject);
    }
}

/**
 * Fetches one object's fields, relationships and descriptive metadata in a single call. No caching, no
 * state: the caller owns the concurrency gate and decides what to keep. Failures come back as an
 * error record rather than throwing, so one bad object cannot fail a whole batch.
 */
export async function fetchObjectRecord(
    objectName: string,
    gate: ErdConcurrencyGate,
): Promise<ErdObjectRecord> {
    const release = await acquireSlot(gate);
    try {
        const metadataResult = await retrieveObjectMetadata(objectName);
        const metadataResponse = (metadataResult as { response?: unknown })?.response ?? metadataResult;

        if (isFailure(metadataResponse)) {
            return {
                status: 'error',
                fields: [],
                relationships: [],
                error: firstErrorMessage(metadataResponse, `Failed to load metadata for ${objectName}`),
                // Tagged so forgetExpiredSessionErrors can drop and refetch these once the session is valid again.
                retryable: isSessionExpired(metadataResponse),
            };
        }

        const objectMeta = parseObjectMeta(metadataResponse);
        return {
            status: 'ready',
            fields: parseObjectFields(metadataResponse),
            relationships: parseRelationshipsFromMetadata(metadataResponse),
            objectClass: objectMeta.objectClass,
            description: objectMeta.description,
        };
    } catch (error) {
        return {
            status: 'error',
            fields: [],
            relationships: [],
            error: error instanceof Error ? error.message : String(error),
        };
    } finally {
        release();
    }
}
