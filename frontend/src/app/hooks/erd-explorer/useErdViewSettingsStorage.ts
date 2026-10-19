import { useEffect, useRef } from 'react';
import { defaultViewSettings, defaultEdgeColors, type ViewSettings, type ErdEdgeColors } from './erdReducer';

const VIEW_SETTINGS_STORAGE_KEY = 'erdExplorerViewSettings';

interface StoredErdViewSettings {
    viewSettings: ViewSettings;
    edgeColors: ErdEdgeColors;
}

interface UseErdViewSettingsStorageProps {
    viewSettings: ViewSettings;
    edgeColors: ErdEdgeColors;
    hydrateViewSettings: (viewSettings: ViewSettings, edgeColors: ErdEdgeColors) => void;
}

/**
 * Persists the ERD Explorer's view settings (visual toggles + edge colours) to chrome.storage.local
 * so they survive across sessions. The diagram itself (placed objects, positions, fields) is not
 * touched here — that stays a working session, saved/restored only via project export/import.
 */
export function useErdViewSettingsStorage({ viewSettings, edgeColors, hydrateViewSettings }: UseErdViewSettingsStorageProps) {
    // Blocks the save effect until the initial load finishes, so defaults don't overwrite stored settings.
    const hasLoadedStoredSettingsRef = useRef(false);

    useEffect(() => {
        chrome.storage.local.get(VIEW_SETTINGS_STORAGE_KEY).then((result) => {
            const storedViewSettings: StoredErdViewSettings | undefined = result[VIEW_SETTINGS_STORAGE_KEY];
            if (storedViewSettings) {
                // Spread over current defaults so a setting added after a user last saved still gets a value.
                hydrateViewSettings(
                    { ...defaultViewSettings, ...storedViewSettings.viewSettings },
                    { ...defaultEdgeColors, ...storedViewSettings.edgeColors },
                );
            }
            hasLoadedStoredSettingsRef.current = true;
        });
    }, [hydrateViewSettings]);

    useEffect(() => {
        if (!hasLoadedStoredSettingsRef.current) return;
        chrome.storage.local.set({ [VIEW_SETTINGS_STORAGE_KEY]: { viewSettings, edgeColors } });
    }, [viewSettings, edgeColors]);
}
