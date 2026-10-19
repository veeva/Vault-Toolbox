import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createConcurrencyGate } from '../../utils/erd-explorer/schema/ErdExplorerConcurrency';
import { planObjectFetches } from '../../utils/erd-explorer/schema/ErdExplorerFetchPlanning';
import { isExternalTarget } from '../../utils/erd-explorer/ErdExplorerHelper';
import { fetchObjectRecord } from '../../utils/erd-explorer/schema/ErdExplorerSchemaLoad';
import { mergeEnrichedRecord, settleRecordsAgainstSchema } from '../../utils/erd-explorer/schema/ErdExplorerSchemaBuild';
import type { ErdSchemaSnapshot } from '../../utils/erd-explorer/schema/ErdExplorerSchemaCache';
import type { ErdObjectRecord, ErdObjectSummary } from '../../utils/erd-explorer/ErdExplorerTypes';
import { useErdSchemaLoader } from './data/useErdSchemaLoader';

// Re-export so the many import sites that reach for the record type through this hook keep working.
export type { ErdRecordStatus, ErdObjectRecord } from '../../utils/erd-explorer/ErdExplorerTypes';

const loadingRecord = (): ErdObjectRecord => ({ status: 'loading', fields: [], relationships: [] });

/**
 * The ERD Explorer's view of the Vault's objects: the whole schema loaded once per tab, plus the records
 * held outside it — imported from a project file, or fetched per object to fill in a placeholder.
 */
export default function useErdExplorerData(placedObjects: string[]) {
    const [overlayRecords, setOverlayRecords] = useState<Record<string, ErdObjectRecord>>({});
    const [importedSummaries, setImportedSummaries] = useState<ErdObjectSummary[]>([]);

    const { schema, schemaStatus, schemaError, progress, reloadSchema } = useErdSchemaLoader();

    // The overlay again, readable synchronously: a burst of ensureObject calls within one tick has to see
    // each other's writes, which React state would not show until the next render.
    const overlayRef = useRef<Record<string, ErdObjectRecord>>({});
    // One promise per object in flight, so two callers asking at once share a single request.
    const inFlightRef = useRef(new Map<string, Promise<ErdObjectRecord>>());
    const fetchGateRef = useRef(createConcurrencyGate());
    // The schema the held records were last settled against, so settling runs once per load.
    const settledSchemaRef = useRef<ErdSchemaSnapshot | null>(null);
    // The schema records, readable from inside a fetch without rebuilding it on every schema change.
    const schemaRecordsRef = useRef(schema.records);

    /** What the canvas renders from: the schema, with held records layered on top. */
    const records = useMemo(
        () => ({ ...schema.records, ...overlayRecords }),
        [schema.records, overlayRecords],
    );

    /**
     * The picker's object list. Imported summaries stand in only while the schema is still loading, so
     * the picker never offers an object this Vault does not have.
     */
    const objectList = useMemo(() => {
        if (schemaStatus === 'ready') return schema.objectList;
        return importedSummaries;
    }, [schemaStatus, schema.objectList, importedSummaries]);

    /** Store one held record in both the synchronous ref and the state the canvas renders from. */
    const writeOverlayRecord = useCallback((name: string, record: ErdObjectRecord) => {
        overlayRef.current = { ...overlayRef.current, [name]: record };
        setOverlayRecords(overlayRef.current);
    }, []);

    /**
     * Forget every object that failed because the session had expired, so the effect that keeps placed
     * objects loaded fetches them again. One successful call proves the session is valid, which is what
     * lets a recovered login heal the whole canvas instead of one node at a time.
     */
    const forgetExpiredSessionErrors = useCallback(() => {
        const entries = Object.entries(overlayRef.current);
        const survivors = entries.filter(([, record]) => !(record.status === 'error' && record.retryable));
        if (survivors.length === entries.length) return;
        overlayRef.current = Object.fromEntries(survivors);
        setOverlayRecords(overlayRef.current);
    }, []);

    /** Start the request for one object, or join the one already running for it. */
    const fetchObject = useCallback((name: string): Promise<ErdObjectRecord> => {
        const alreadyRunning = inFlightRef.current.get(name);
        if (alreadyRunning) return alreadyRunning;

        // Captured before the request so a schema reload mid-flight cannot change what is merged in.
        const placeholderRecord = schemaRecordsRef.current[name];
        writeOverlayRecord(name, loadingRecord());
        const pendingFetch = fetchObjectRecord(name, fetchGateRef.current).then((fetchedRecord) => {
            inFlightRef.current.delete(name);
            const record = mergeEnrichedRecord(fetchedRecord, placeholderRecord);
            writeOverlayRecord(name, record);
            if (record.status === 'ready') forgetExpiredSessionErrors();
            return record;
        });
        inFlightRef.current.set(name, pendingFetch);
        return pendingFetch;
    }, [writeOverlayRecord, forgetExpiredSessionErrors]);

    /** Fill in the fields of any of these objects the schema has only a placeholder for. */
    const ensureObjects = useCallback((names: string[]) => {
        const known = { ...schema.records, ...overlayRef.current };
        for (const name of planObjectFetches(names, known)) void fetchObject(name);
    }, [schema.records, fetchObject]);

    const ensureObject = useCallback((name: string) => ensureObjects([name]), [ensureObjects]);

    /** The awaitable form, for callers whose next step depends on the answer. */
    const ensureObjectAsync = useCallback((name: string): Promise<ErdObjectRecord> => {
        const alreadyRunning = inFlightRef.current.get(name);
        if (alreadyRunning) return alreadyRunning;
        // Synthetic external targets are not Vault objects; a request for one would 404.
        if (isExternalTarget(name)) return Promise.resolve({ status: 'ready', fields: [], relationships: [] });
        const known = overlayRef.current[name] ?? schema.records[name];
        if (known && !known.partial) return Promise.resolve(known);
        return fetchObject(name);
    }, [schema.records, fetchObject]);

    /**
     * Drop what is held about an object and fetch it again (the node's manual retry action). A request
     * already running will settle the object on its own; starting a second one would only race it.
     */
    const retryObject = useCallback((name: string) => {
        if (inFlightRef.current.has(name)) return;
        const { [name]: _discarded, ...remainingRecords } = overlayRef.current;
        overlayRef.current = remainingRecords;
        setOverlayRecords(remainingRecords);
        void fetchObject(name);
    }, [fetchObject]);

    /**
     * Take the metadata a project file carried so an imported diagram renders without a single Vault
     * call. Held alongside the schema until it lands, which then supersedes whatever it knows in full.
     */
    const applyImportedSchema = useCallback((imported: ErdSchemaSnapshot) => {
        const merged = { ...overlayRef.current, ...imported.records };
        // When the schema is already in, settle against it now: the effect below only fires on a load,
        // so an import arriving afterwards would otherwise keep the file's copy indefinitely.
        overlayRef.current = schemaStatus === 'ready'
            ? settleRecordsAgainstSchema({
                heldRecords: merged,
                schemaRecords: schema.records,
                placedObjects: imported.objectList.map((summary) => summary.name),
            })
            : merged;
        setOverlayRecords(overlayRef.current);
        setImportedSummaries((previous) => {
            const incoming = new Set(imported.objectList.map((summary) => summary.name));
            return [...previous.filter((summary) => !incoming.has(summary.name)), ...imported.objectList];
        });
    }, [schemaStatus, schema.records]);

    useEffect(() => {
        schemaRecordsRef.current = schema.records;
    }, [schema.records]);

    // Settle held records against a schema that has just landed: the live schema is authoritative.
    useEffect(() => {
        if (schemaStatus !== 'ready') return;
        if (settledSchemaRef.current === schema) return;
        settledSchemaRef.current = schema;
        overlayRef.current = settleRecordsAgainstSchema({
            heldRecords: overlayRef.current,
            schemaRecords: schema.records,
            placedObjects,
        });
        setOverlayRecords(overlayRef.current);
    }, [schema, schemaStatus, placedObjects]);

    return {
        objectList,
        schemaStatus,
        schemaError,
        schemaProgress: progress,
        schemaRecords: schema.records,
        reloadSchema,
        records,
        ensureObject,
        ensureObjects,
        ensureObjectAsync,
        applyImportedSchema,
        retryObject,
    };
}
