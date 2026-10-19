import { useEffect, type MutableRefObject } from 'react';

interface ErdShiftKeyTrackingOptions {
    shiftHeldRef: MutableRefObject<boolean>;
}

/** Tracks Shift key held state for canvas multi-select. */
export function useErdShiftKeyTracking({ shiftHeldRef }: ErdShiftKeyTrackingOptions): void {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Shift') shiftHeldRef.current = true; };
        const handleKeyUp = (event: KeyboardEvent) => { if (event.key === 'Shift') shiftHeldRef.current = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [shiftHeldRef]);
}
