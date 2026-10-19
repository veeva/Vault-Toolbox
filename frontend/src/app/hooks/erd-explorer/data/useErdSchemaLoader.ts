import { useCallback, useEffect, useRef, useState } from 'react';
import {
    readSchemaCache,
    writeSchemaCache,
    type ErdSchemaSnapshot,
} from '../../../utils/erd-explorer/schema/ErdExplorerSchemaCache';
import {
    loadObjectSchema,
    type ErdSchemaLoadProgress,
} from '../../../utils/erd-explorer/schema/ErdExplorerSchemaLoad';

export type ErdSchemaStatus = 'loading' | 'ready' | 'error';

const emptySnapshot = (): ErdSchemaSnapshot => ({ records: {}, objectList: [] });

const initialProgress = (): ErdSchemaLoadProgress => ({
    pagesLoaded: 0,
    objectsParsed: 0,
    derivingRelationships: false,
});

/**
 * Owns the whole-Vault object schema for this tab: served from the session cache when one exists, loaded
 * and cached otherwise. The cache is used as-is without revalidation; `reloadSchema` is the deliberate
 * way to pick up a configuration change.
 */
export function useErdSchemaLoader() {
    const [schema, setSchema] = useState<ErdSchemaSnapshot>(emptySnapshot);
    const [schemaStatus, setSchemaStatus] = useState<ErdSchemaStatus>('loading');
    const [schemaError, setSchemaError] = useState<string | undefined>();
    const [progress, setProgress] = useState<ErdSchemaLoadProgress>(initialProgress);

    const isLoadingRef = useRef(false);

    /** Fetch the schema from Vault and cache it. Also the deliberate reload action. */
    const loadFromVault = useCallback(async () => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        setSchemaStatus('loading');
        setSchemaError(undefined);
        setProgress(initialProgress());
        try {
            const result = await loadObjectSchema(setProgress);
            if (result.status === 'error') {
                setSchemaError(result.error);
                setSchemaStatus('error');
                return;
            }
            writeSchemaCache(result.snapshot);
            setSchema(result.snapshot);
            setSchemaStatus('ready');
        } finally {
            isLoadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        const cached = readSchemaCache();
        if (cached) {
            setSchema(cached);
            setSchemaStatus('ready');
            return;
        }
        void loadFromVault();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        schema,
        schemaStatus,
        schemaError,
        progress,
        reloadSchema: loadFromVault,
    };
}
