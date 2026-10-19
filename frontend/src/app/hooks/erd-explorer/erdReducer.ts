/**
 * Pure reducer for the ERD Explorer canvas state. Exported separately from the hook so it can be
 * unit-tested without any React runtime, and so useErdGraph.ts stays focused on the hook layer.
 */
import { gridPosition, pickByName } from '../../utils/erd-explorer/ErdExplorerHelper';
import { EDGE_TYPE_COLORS, type ErdNodePosition, type ErdPositionMap } from '../../utils/erd-explorer/ErdExplorerTypes';

/** Display-only preferences (persisted, not undoable). */
export interface ViewSettings {
    colorCodeEdges: boolean;
    showLegend: boolean;
    showRelationshipLineLabels: boolean;
    showSourceBadges: boolean;
    /** Show the lifecycle system objects that are hidden by default (see HIDDEN_LIFECYCLE_OBJECTS). */
    showLifecycleSystemObjects: boolean;
    /** Collapse SIMPLE join objects into a single M:M edge between their two parents (on by default). */
    hideSimpleJoinObjects: boolean;
    /** Collapse COMPLEX join objects into a single M:M edge between their two parents (on by default). */
    hideComplexJoinObjects: boolean;
}

export type ViewSettingKey = keyof ViewSettings;

/** User-customizable edge colours (used when colour-coding is on). Document/users stay fixed. */
export interface ErdEdgeColors {
    reference: string;
    parentChild: string;
    /** Collapsed simple many-to-many join edge. */
    simpleJoin: string;
    /** Collapsed complex many-to-many join edge. */
    complexJoin: string;
}
export type EdgeColorKey = keyof ErdEdgeColors;

export interface ErdGraphState {
    placedObjects: string[];
    positions: ErdPositionMap;
    visibleFields: Record<string, string[]>;
    includeUsersGroups: boolean;
    viewSettings: ViewSettings;
    edgeColors: ErdEdgeColors;
}

/** A project file's canvas payload — the diagram as its author saw it. See ErdExplorerProject.ts. */
export interface ErdProjectPayload {
    objects: string[];
    positions: ErdPositionMap;
    visibleFields: Record<string, string[]>;
    includeUsersGroups: boolean;
    viewSettings: ViewSettings;
    edgeColors: ErdEdgeColors;
}
export type ImportMode = 'replace' | 'merge';

export type ErdGraphAction =
    | { type: 'ADD_OBJECTS'; names: string[] }
    | { type: 'ADD_JOIN_OBJECTS'; names: string[] }
    | { type: 'REMOVE_OBJECT'; name: string }
    | { type: 'REMOVE_OBJECTS'; names: string[] }
    | { type: 'SET_POSITION'; name: string; position: ErdNodePosition }
    | { type: 'SET_POSITIONS'; positions: ErdPositionMap }
    | { type: 'SET_VISIBLE_FIELDS'; name: string; fields: string[] }
    | { type: 'SET_VISIBLE_FIELDS_MANY'; entries: Record<string, string[]> }
    | { type: 'SET_VIEW_SETTING'; key: ViewSettingKey; value: boolean }
    | { type: 'SET_EDGE_COLOR'; key: EdgeColorKey; value: string }
    | { type: 'RESTORE_VIEW_SETTINGS_DEFAULTS' }
    | { type: 'HYDRATE_VIEW_SETTINGS'; viewSettings: ViewSettings; edgeColors: ErdEdgeColors }
    | { type: 'APPLY_PROJECT'; project: ErdProjectPayload; mode: ImportMode }
    | { type: 'CLEAR' };

export type ErdHistoryAction = ErdGraphAction | { type: 'UNDO' } | { type: 'REDO' };

export const defaultViewSettings: ViewSettings = {
    colorCodeEdges: false,
    showLegend: true,
    showRelationshipLineLabels: false,
    showSourceBadges: true,
    showLifecycleSystemObjects: false,
    hideSimpleJoinObjects: false,
    hideComplexJoinObjects: false,
};

/** Default relationship colours (customisable via SET_EDGE_COLOR when colour-coding is on). Sourced
 *  from EDGE_TYPE_COLORS so the reducer defaults and the legend/edge builder never drift. */
export const defaultEdgeColors: ErdEdgeColors = {
    reference: EDGE_TYPE_COLORS.reference,
    parentChild: EDGE_TYPE_COLORS.parent,
    simpleJoin: EDGE_TYPE_COLORS.manyToManySimple,
    complexJoin: EDGE_TYPE_COLORS.manyToManyComplex,
};

export const initialErdGraphState: ErdGraphState = {
    placedObjects: [],
    positions: {},
    visibleFields: {},
    includeUsersGroups: false,
    viewSettings: defaultViewSettings,
    edgeColors: defaultEdgeColors,
};

// ---- Pure helpers -------------------------------------------------------------------------------

/** Drop a key from a record immutably. */
function without<T>(record: Record<string, T>, key: string): Record<string, T> {
    if (!(key in record)) return record;
    const { [key]: _removed, ...rest } = record;
    return rest;
}

/** Assign persisted grid positions to names that don't already have one, continuing from `baseIndex`. */
function withGridPositions(positions: ErdPositionMap, names: string[], baseIndex: number): ErdPositionMap {
    const next = { ...positions };
    names.forEach((name, offset) => {
        if (!next[name]) next[name] = gridPosition(baseIndex + offset);
    });
    return next;
}

// ---- Reducer ------------------------------------------------------------------------------------

export function erdReducer(state: ErdGraphState, action: ErdGraphAction): ErdGraphState {
    switch (action.type) {
        case 'ADD_OBJECTS':
        // ADD_JOIN_OBJECTS behaves identically (append + grid-place new names) but is NON-UNDOABLE
        // (see NON_UNDOABLE): auto-materialized hidden joins must never create undo entries or fight undo.
        case 'ADD_JOIN_OBJECTS': {
            const existing = new Set(state.placedObjects);
            const additions = action.names.filter((name) => name && !existing.has(name));
            if (additions.length === 0) return state;
            return {
                ...state,
                placedObjects: [...state.placedObjects, ...additions],
                positions: withGridPositions(state.positions, additions, state.placedObjects.length),
            };
        }
        case 'REMOVE_OBJECT': {
            if (!state.placedObjects.includes(action.name)) return state;
            return {
                ...state,
                placedObjects: state.placedObjects.filter((name) => name !== action.name),
                positions: without(state.positions, action.name),
                visibleFields: without(state.visibleFields, action.name),
            };
        }
        case 'REMOVE_OBJECTS': {
            const removing = new Set(action.names);
            if (!state.placedObjects.some((name) => removing.has(name))) return state;
            let positions = state.positions;
            let visibleFields = state.visibleFields;
            removing.forEach((name) => {
                positions = without(positions, name);
                visibleFields = without(visibleFields, name);
            });
            return {
                ...state,
                placedObjects: state.placedObjects.filter((name) => !removing.has(name)),
                positions,
                visibleFields,
            };
        }
        case 'SET_POSITION':
            return { ...state, positions: { ...state.positions, [action.name]: action.position } };
        case 'SET_POSITIONS':
            return { ...state, positions: { ...state.positions, ...action.positions } };
        case 'SET_VISIBLE_FIELDS':
            return { ...state, visibleFields: { ...state.visibleFields, [action.name]: action.fields } };
        case 'SET_VISIBLE_FIELDS_MANY':
            if (Object.keys(action.entries).length === 0) return state;
            return { ...state, visibleFields: { ...state.visibleFields, ...action.entries } };
        case 'SET_VIEW_SETTING':
            return { ...state, viewSettings: { ...state.viewSettings, [action.key]: action.value } };
        case 'SET_EDGE_COLOR':
            return { ...state, edgeColors: { ...state.edgeColors, [action.key]: action.value } };
        case 'RESTORE_VIEW_SETTINGS_DEFAULTS':
            return {
                ...state,
                includeUsersGroups: false,
                viewSettings: defaultViewSettings,
                edgeColors: defaultEdgeColors,
            };
        case 'HYDRATE_VIEW_SETTINGS':
            return { ...state, viewSettings: action.viewSettings, edgeColors: action.edgeColors };
        case 'APPLY_PROJECT': {
            const objects = action.project.objects.filter(Boolean);
            const visibleFields = pickByName(action.project.visibleFields, objects);
            // Saved positions win; anything the file did not place falls back to the grid.
            const savedPositions = pickByName(action.project.positions, objects);
            if (action.mode === 'replace') {
                return {
                    ...initialErdGraphState,
                    placedObjects: objects,
                    positions: withGridPositions(savedPositions, objects, 0),
                    visibleFields,
                    // Replacing the canvas adopts the author's view of it; merging keeps the user's own.
                    includeUsersGroups: action.project.includeUsersGroups,
                    viewSettings: action.project.viewSettings,
                    edgeColors: action.project.edgeColors,
                };
            }
            // Merge: append objects not already present, layer the imported field selections on top.
            const existing = new Set(state.placedObjects);
            const additions = objects.filter((name) => !existing.has(name));
            return {
                ...state,
                placedObjects: [...state.placedObjects, ...additions],
                positions: withGridPositions(
                    { ...state.positions, ...pickByName(savedPositions, additions) },
                    additions,
                    state.placedObjects.length,
                ),
                visibleFields: { ...state.visibleFields, ...visibleFields },
            };
        }
        case 'CLEAR':
            return {
                ...initialErdGraphState,
                includeUsersGroups: state.includeUsersGroups,
                viewSettings: state.viewSettings,
                edgeColors: state.edgeColors,
            };
        default:
            return state;
    }
}

// ---- Undo/redo history --------------------------------------------------------------------------

export interface ErdHistory {
    past: ErdGraphState[];
    present: ErdGraphState;
    future: ErdGraphState[];
}

const HISTORY_CAP = 50;
/** Actions that change display prefs or reset state — not pushed onto the undo stack. */
const NON_UNDOABLE = new Set<ErdHistoryAction['type']>([
    'ADD_JOIN_OBJECTS',
    'SET_VIEW_SETTING',
    'SET_EDGE_COLOR',
    'RESTORE_VIEW_SETTINGS_DEFAULTS',
    'HYDRATE_VIEW_SETTINGS',
    'UNDO',
    'REDO',
]);

export function makeErdHistory(present: ErdGraphState = initialErdGraphState): ErdHistory {
    return { past: [], present, future: [] };
}

export function historyReducer(history: ErdHistory, action: ErdHistoryAction): ErdHistory {
    const { past, present, future } = history;

    if (action.type === 'UNDO') {
        if (past.length === 0) return history;
        return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };
    }
    if (action.type === 'REDO') {
        if (future.length === 0) return history;
        return { past: [...past, present], present: future[0], future: future.slice(1) };
    }
    if (NON_UNDOABLE.has(action.type)) {
        return { ...history, present: erdReducer(present, action) };
    }

    const next = erdReducer(present, action);
    if (next === present) return history; // no-op action → no snapshot
    const newPast = [...past, present];
    if (newPast.length > HISTORY_CAP) newPast.shift();
    return { past: newPast, present: next, future: [] };
}
