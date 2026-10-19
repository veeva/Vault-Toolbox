import { useReducer, useCallback, useMemo } from 'react';
import {
    historyReducer,
    makeErdHistory,
    initialErdGraphState,
    type ErdGraphState,
    type ErdProjectPayload,
    type ImportMode,
    type ViewSettingKey,
    type EdgeColorKey,
    type ViewSettings,
    type ErdEdgeColors,
} from './erdReducer';
import type { ErdNodePosition, ErdPositionMap } from '../../utils/erd-explorer/ErdExplorerTypes';

/**
 * Canvas membership + view state for the ERD Explorer.
 * Pure reducer logic lives in erdReducer.ts; this file is the React hook layer.
 */
export default function useErdGraph(initial: ErdGraphState = initialErdGraphState) {
    const [history, dispatch] = useReducer(historyReducer, initial, makeErdHistory);
    const state = history.present;

    const addObjects = useCallback((names: string[]) => dispatch({ type: 'ADD_OBJECTS', names }), []);
    const addJoinObjects = useCallback((names: string[]) => dispatch({ type: 'ADD_JOIN_OBJECTS', names }), []);
    const removeObject = useCallback((name: string) => dispatch({ type: 'REMOVE_OBJECT', name }), []);
    const removeObjects = useCallback((names: string[]) => dispatch({ type: 'REMOVE_OBJECTS', names }), []);
    const setPosition = useCallback(
        (name: string, position: ErdNodePosition) => dispatch({ type: 'SET_POSITION', name, position }),
        [],
    );
    const setPositions = useCallback(
        (positions: ErdPositionMap) => dispatch({ type: 'SET_POSITIONS', positions }),
        [],
    );
    const setVisibleFields = useCallback(
        (name: string, fields: string[]) => dispatch({ type: 'SET_VISIBLE_FIELDS', name, fields }),
        [],
    );
    const setVisibleFieldsMany = useCallback(
        (entries: Record<string, string[]>) => dispatch({ type: 'SET_VISIBLE_FIELDS_MANY', entries }),
        [],
    );
    const setViewSetting = useCallback(
        (key: ViewSettingKey, value: boolean) => dispatch({ type: 'SET_VIEW_SETTING', key, value }),
        [],
    );
    const setEdgeColor = useCallback(
        (key: EdgeColorKey, value: string) => dispatch({ type: 'SET_EDGE_COLOR', key, value }),
        [],
    );
    const restoreViewSettingsDefaults = useCallback(() => dispatch({ type: 'RESTORE_VIEW_SETTINGS_DEFAULTS' }), []);
    const hydrateViewSettings = useCallback(
        (viewSettings: ViewSettings, edgeColors: ErdEdgeColors) =>
            dispatch({ type: 'HYDRATE_VIEW_SETTINGS', viewSettings, edgeColors }),
        [],
    );
    const applyProject = useCallback(
        (project: ErdProjectPayload, mode: ImportMode) => dispatch({ type: 'APPLY_PROJECT', project, mode }),
        [],
    );
    const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
    const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
    const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    return useMemo(
        () => ({
            state,
            addObjects,
            addJoinObjects,
            removeObject,
            removeObjects,
            setPosition,
            setPositions,
            setVisibleFields,
            setVisibleFieldsMany,
            setViewSetting,
            setEdgeColor,
            restoreViewSettingsDefaults,
            hydrateViewSettings,
            applyProject,
            clear,
            undo,
            redo,
            canUndo,
            canRedo,
        }),
        [
            state,
            addObjects,
            addJoinObjects,
            removeObject,
            removeObjects,
            setPosition,
            setPositions,
            setVisibleFields,
            setVisibleFieldsMany,
            setViewSetting,
            setEdgeColor,
            restoreViewSettingsDefaults,
            hydrateViewSettings,
            applyProject,
            clear,
            undo,
            redo,
            canUndo,
            canRedo,
        ],
    );
}
