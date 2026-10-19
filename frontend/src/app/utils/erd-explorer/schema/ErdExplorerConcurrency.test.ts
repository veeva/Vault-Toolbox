import { describe, it, expect } from 'vitest';
import { acquireSlot, createConcurrencyGate, MAX_CONCURRENT_ERD_FETCHES } from './ErdExplorerConcurrency';

/** Yield to the event loop so every queued continuation runs before the next assertion. */
const settlePendingWork = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('acquireSlot', () => {
    it('never lets more than the maximum run at once', async () => {
        const gate = createConcurrencyGate();
        let running = 0;
        let highWaterMark = 0;

        const runTask = async () => {
            const release = await acquireSlot(gate);
            running += 1;
            highWaterMark = Math.max(highWaterMark, running);
            await settlePendingWork();
            running -= 1;
            release();
        };

        await Promise.all(Array.from({ length: 12 }, runTask));

        expect(highWaterMark).toBe(MAX_CONCURRENT_ERD_FETCHES);
    });

    it('leaves no slots held once every caller has released', async () => {
        const gate = createConcurrencyGate();

        await Promise.all(
            Array.from({ length: 10 }, async () => {
                const release = await acquireSlot(gate);
                await settlePendingWork();
                release();
            }),
        );

        expect(gate.activeCount).toBe(0);
        expect(gate.waitQueue).toHaveLength(0);
    });

    it('releases waiters in the order they arrived', async () => {
        const gate = createConcurrencyGate();
        const admitted: number[] = [];

        const holders = await Promise.all(
            Array.from({ length: MAX_CONCURRENT_ERD_FETCHES }, () => acquireSlot(gate)),
        );
        const waiters = [0, 1, 2].map((waiterIndex) =>
            acquireSlot(gate).then((release) => {
                admitted.push(waiterIndex);
                return release;
            }),
        );

        for (const release of holders) {
            release();
            await settlePendingWork();
        }
        await Promise.all(waiters);

        expect(admitted).toEqual([0, 1, 2]);
    });

    it('ignores a release that is called more than once', async () => {
        const gate = createConcurrencyGate();
        const release = await acquireSlot(gate);

        release();
        release();
        release();

        expect(gate.activeCount).toBe(0);
    });
});
