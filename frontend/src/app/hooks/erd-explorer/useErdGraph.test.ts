import { describe, it, expect } from 'vitest';
import {
    erdReducer,
    historyReducer,
    makeErdHistory,
    initialErdGraphState,
    type ErdGraphState,
    type ErdProjectPayload,
} from './erdReducer';

const state = (overrides: Partial<ErdGraphState> = {}): ErdGraphState => ({
    ...initialErdGraphState,
    ...overrides,
});

/** A project payload as deserializeProject always produces it: every field present. */
const project = (overrides: Partial<ErdProjectPayload> = {}): ErdProjectPayload => ({
    objects: [],
    positions: {},
    visibleFields: {},
    includeUsersGroups: false,
    viewSettings: initialErdGraphState.viewSettings,
    edgeColors: initialErdGraphState.edgeColors,
    ...overrides,
});

describe('erdReducer', () => {
    it('adds objects and ignores duplicates', () => {
        let nextState = erdReducer(state(), { type: 'ADD_OBJECTS', names: ['product__v', 'country__v'] });
        expect(nextState.placedObjects).toEqual(['product__v', 'country__v']);
        nextState = erdReducer(nextState, { type: 'ADD_OBJECTS', names: ['country__v', 'brand__v'] });
        expect(nextState.placedObjects).toEqual(['product__v', 'country__v', 'brand__v']);
    });

    it('returns the same reference when nothing new is added', () => {
        const nextState = state({ placedObjects: ['product__v'] });
        expect(erdReducer(nextState, { type: 'ADD_OBJECTS', names: ['product__v'] })).toBe(nextState);
    });

    it('assigns a persisted grid position to each new object without touching existing ones', () => {
        const nextState = erdReducer(
            state({ placedObjects: ['product__v'], positions: { product__v: { x: 999, y: 999 } } }),
            { type: 'ADD_OBJECTS', names: ['country__v'] },
        );
        expect(nextState.positions.product__v).toEqual({ x: 999, y: 999 }); // existing position preserved
        expect(typeof nextState.positions.country__v?.x).toBe('number'); // new object positioned
        expect(nextState.positions.country__v).not.toEqual({ x: 0, y: 0 }); // not stacked at the origin
    });

    it('APPLY_PROJECT replace loads objects+fields and drops the previous canvas', () => {
        const current = state({
            placedObjects: ['old__v'],
            positions: { old__v: { x: 5, y: 5 } },
        });
        const next = erdReducer(current, {
            type: 'APPLY_PROJECT',
            mode: 'replace',
            project: project({ objects: ['a__v', 'b__v'], visibleFields: { a__v: ['n'], ghost__v: ['x'] } }),
        });
        expect(next.placedObjects).toEqual(['a__v', 'b__v']);
        expect(next.visibleFields).toEqual({ a__v: ['n'] }); // fields for non-imported objects dropped
        expect(next.positions.old__v).toBeUndefined();
        expect(typeof next.positions.a__v?.x).toBe('number');
    });

    it('APPLY_PROJECT replace restores the saved positions rather than re-flowing them', () => {
        const next = erdReducer(state(), {
            type: 'APPLY_PROJECT',
            mode: 'replace',
            project: project({ objects: ['a__v', 'b__v'], positions: { a__v: { x: 42, y: 43 } } }),
        });
        expect(next.positions.a__v).toEqual({ x: 42, y: 43 });
        // b__v had no saved position, so it falls back to the grid.
        expect(typeof next.positions.b__v?.x).toBe('number');
    });

    it('APPLY_PROJECT replace adopts the display settings the file carried', () => {
        const next = erdReducer(state({ includeUsersGroups: false }), {
            type: 'APPLY_PROJECT',
            mode: 'replace',
            project: project({
                objects: ['a__v'],
                includeUsersGroups: true,
                viewSettings: { ...initialErdGraphState.viewSettings, showRelationshipLineLabels: true },
                edgeColors: { ...initialErdGraphState.edgeColors, reference: '#abcdef' },
            }),
        });
        expect(next.includeUsersGroups).toBe(true);
        expect(next.viewSettings.showRelationshipLineLabels).toBe(true);
        expect(next.edgeColors.reference).toBe('#abcdef');
    });

    it('APPLY_PROJECT merge appends new objects and layers fields, keeping existing state', () => {
        const current = state({
            placedObjects: ['a__v'],
            positions: { a__v: { x: 7, y: 7 } },
            visibleFields: { a__v: ['keep'] },
        });
        const next = erdReducer(current, {
            type: 'APPLY_PROJECT',
            mode: 'merge',
            project: project({ objects: ['a__v', 'c__v'], visibleFields: { c__v: ['cf'] } }),
        });
        expect(next.placedObjects).toEqual(['a__v', 'c__v']); // a__v not duplicated
        expect(next.positions.a__v).toEqual({ x: 7, y: 7 }); // preserved
        expect(next.visibleFields).toEqual({ a__v: ['keep'], c__v: ['cf'] });
    });

    it('APPLY_PROJECT merge keeps the user own display settings', () => {
        const next = erdReducer(state({ includeUsersGroups: false }), {
            type: 'APPLY_PROJECT',
            mode: 'merge',
            project: project({ objects: ['c__v'], includeUsersGroups: true }),
        });
        expect(next.includeUsersGroups).toBe(false);
    });

    it('removes an object and drops its position and visible fields', () => {
        const nextState = state({
            placedObjects: ['product__v', 'country__v'],
            positions: { product__v: { x: 1, y: 2 } },
            visibleFields: { product__v: ['name__v'] },
        });
        const next = erdReducer(nextState, { type: 'REMOVE_OBJECT', name: 'product__v' });
        expect(next.placedObjects).toEqual(['country__v']);
        expect(next.positions.product__v).toBeUndefined();
        expect(next.visibleFields.product__v).toBeUndefined();
    });

    it('removes several objects at once, dropping their positions and visible fields', () => {
        const nextState = state({
            placedObjects: ['a__v', 'b__v', 'c__v'],
            positions: { a__v: { x: 1, y: 1 }, b__v: { x: 2, y: 2 } },
            visibleFields: { a__v: ['x'], b__v: ['y'] },
        });
        const next = erdReducer(nextState, { type: 'REMOVE_OBJECTS', names: ['a__v', 'c__v'] });
        expect(next.placedObjects).toEqual(['b__v']);
        expect(next.positions.a__v).toBeUndefined();
        expect(next.visibleFields.a__v).toBeUndefined();
        expect(next.positions.b__v).toEqual({ x: 2, y: 2 }); // untouched
    });

    it('REMOVE_OBJECTS is a no-op (same reference) when nothing matches', () => {
        const nextState = state({ placedObjects: ['a__v'] });
        expect(erdReducer(nextState, { type: 'REMOVE_OBJECTS', names: ['zzz__v'] })).toBe(nextState);
    });

    it('sets per-object visible fields independently', () => {
        let nextState = erdReducer(state(), { type: 'SET_VISIBLE_FIELDS', name: 'product__v', fields: ['a', 'b'] });
        nextState = erdReducer(nextState, { type: 'SET_VISIBLE_FIELDS', name: 'country__v', fields: ['c'] });
        expect(nextState.visibleFields).toEqual({ product__v: ['a', 'b'], country__v: ['c'] });
    });

    it('sets visible fields for many objects in one action, merging with existing', () => {
        const nextState = erdReducer(state({ visibleFields: { a__v: ['keep'] } }), {
            type: 'SET_VISIBLE_FIELDS_MANY',
            entries: { b__v: ['x'], c__v: [] },
        });
        expect(nextState.visibleFields).toEqual({ a__v: ['keep'], b__v: ['x'], c__v: [] });
    });

    it('SET_VISIBLE_FIELDS_MANY is a no-op (same reference) for empty entries', () => {
        const nextState = state();
        expect(erdReducer(nextState, { type: 'SET_VISIBLE_FIELDS_MANY', entries: {} })).toBe(nextState);
    });

    it('sets a single position and merges bulk positions', () => {
        let nextState = erdReducer(state(), { type: 'SET_POSITION', name: 'product__v', position: { x: 10, y: 20 } });
        nextState = erdReducer(nextState, { type: 'SET_POSITIONS', positions: { country__v: { x: 5, y: 5 } } });
        expect(nextState.positions).toEqual({ product__v: { x: 10, y: 20 }, country__v: { x: 5, y: 5 } });
    });

    it('sets an individual view display setting', () => {
        const nextState = erdReducer(state(), { type: 'SET_VIEW_SETTING', key: 'showLegend', value: false });
        expect(nextState.viewSettings.showLegend).toBe(false);
        expect(nextState.viewSettings.colorCodeEdges).toBe(false); // others unchanged (default off)
    });

    it('clears the canvas while keeping view preferences', () => {
        const populated = state({
            placedObjects: ['product__v'],
            visibleFields: { product__v: ['name__v'] },
            includeUsersGroups: true,
        });
        const cleared = erdReducer(populated, { type: 'CLEAR' });
        expect(cleared.placedObjects).toEqual([]);
        expect(cleared.visibleFields).toEqual({});
        expect(cleared.includeUsersGroups).toBe(true);
    });
});

describe('historyReducer (undo/redo)', () => {
    const addA = { type: 'ADD_OBJECTS', names: ['a__v'] } as const;
    const addB = { type: 'ADD_OBJECTS', names: ['b__v'] } as const;

    it('snapshots mutating actions and undoes/redoes them', () => {
        let history = makeErdHistory();
        history = historyReducer(history, addA);
        history = historyReducer(history, addB);
        expect(history.present.placedObjects).toEqual(['a__v', 'b__v']);
        expect(history.past).toHaveLength(2);

        history = historyReducer(history, { type: 'UNDO' });
        expect(history.present.placedObjects).toEqual(['a__v']);
        expect(history.future).toHaveLength(1);

        history = historyReducer(history, { type: 'REDO' });
        expect(history.present.placedObjects).toEqual(['a__v', 'b__v']);
        expect(history.future).toHaveLength(0);
    });

    it('is a no-op to undo/redo at the ends of history', () => {
        const history = makeErdHistory();
        expect(historyReducer(history, { type: 'UNDO' })).toBe(history);
        expect(historyReducer(history, { type: 'REDO' })).toBe(history);
    });

    it('clears the redo stack when a new action is taken after undo', () => {
        let history = makeErdHistory();
        history = historyReducer(history, addA);
        history = historyReducer(history, addB);
        history = historyReducer(history, { type: 'UNDO' }); // future = [+b]
        history = historyReducer(history, { type: 'ADD_OBJECTS', names: ['c__v'] });
        expect(history.future).toHaveLength(0);
        expect(history.present.placedObjects).toEqual(['a__v', 'c__v']);
    });

    it('does not snapshot view settings changes', () => {
        let history = makeErdHistory();
        history = historyReducer(history, addA);
        const pastLen = history.past.length;
        history = historyReducer(history, { type: 'SET_VIEW_SETTING', key: 'showLegend', value: false });
        expect(history.past).toHaveLength(pastLen);
        expect(history.present.viewSettings.showLegend).toBe(false);
    });

    it('snapshots APPLY_PROJECT so an import can be undone', () => {
        let history = makeErdHistory();
        history = historyReducer(history, {
            type: 'APPLY_PROJECT',
            mode: 'replace',
            project: project({ objects: ['a__v'] }),
        });
        expect(history.past).toHaveLength(1);
        expect(history.present.placedObjects).toEqual(['a__v']);
        history = historyReducer(history, { type: 'UNDO' });
        expect(history.present.placedObjects).toEqual([]);
    });

    it('does not snapshot ADD_JOIN_OBJECTS (auto-materialized joins are non-undoable)', () => {
        let history = makeErdHistory();
        history = historyReducer(history, addA);
        const pastLen = history.past.length;
        history = historyReducer(history, { type: 'ADD_JOIN_OBJECTS', names: ['user_role__sys'] });
        expect(history.past).toHaveLength(pastLen);
        expect(history.present.placedObjects).toContain('user_role__sys');
    });
});

describe('ADD_JOIN_OBJECTS', () => {
    it('appends new join names and ignores already-placed ones', () => {
        let nextState = erdReducer(state({ placedObjects: ['user__sys'] }), {
            type: 'ADD_JOIN_OBJECTS',
            names: ['user_role__sys', 'user__sys'],
        });
        expect(nextState.placedObjects).toEqual(['user__sys', 'user_role__sys']);
        expect(nextState.positions.user_role__sys).toBeDefined();
        // No-op when everything is already placed → same reference.
        expect(erdReducer(nextState, { type: 'ADD_JOIN_OBJECTS', names: ['user_role__sys'] })).toBe(nextState);
    });
});

describe('defaults', () => {
    it('join objects are visible by default and M:M colours are defined', () => {
        expect(initialErdGraphState.viewSettings.hideSimpleJoinObjects).toBe(false);
        expect(initialErdGraphState.viewSettings.hideComplexJoinObjects).toBe(false);
        expect(initialErdGraphState.edgeColors.simpleJoin).toBeTruthy();
        expect(initialErdGraphState.edgeColors.complexJoin).toBeTruthy();
    });
});
