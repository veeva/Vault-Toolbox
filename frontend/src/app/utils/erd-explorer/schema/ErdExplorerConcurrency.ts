/**
 * Caps how many Vault fetches the ERD Explorer runs at once. The gate is an argument rather than
 * module state, so it lives exactly as long as whoever owns it.
 */

/** Maximum simultaneous Vault requests a gate allows unless told otherwise. */
export const MAX_CONCURRENT_ERD_FETCHES = 4;

export interface ErdConcurrencyGate {
    /** Slots currently held by a caller that has not released yet. */
    activeCount: number;
    /** Callers parked until a slot frees up, served first-in-first-out. */
    waitQueue: Array<() => void>;
    maxConcurrent: number;
}

export function createConcurrencyGate(): ErdConcurrencyGate {
    return { activeCount: 0, waitQueue: [], maxConcurrent: MAX_CONCURRENT_ERD_FETCHES };
}

/**
 * Wait for a free slot, then return the function that gives it back. Releasing hands the slot straight
 * to the next waiter, so a caller arriving in between cannot push the gate over its cap.
 */
export async function acquireSlot(gate: ErdConcurrencyGate): Promise<() => void> {
    if (gate.activeCount >= gate.maxConcurrent) {
        // The releasing caller hands its slot directly to us, so activeCount already counts this caller.
        await new Promise<void>((resumeWaiter) => gate.waitQueue.push(resumeWaiter));
    } else {
        gate.activeCount += 1;
    }

    let alreadyReleased = false;
    return () => {
        if (alreadyReleased) return;
        alreadyReleased = true;
        const nextWaiter = gate.waitQueue.shift();
        if (nextWaiter) nextWaiter();
        else gate.activeCount -= 1;
    };
}
