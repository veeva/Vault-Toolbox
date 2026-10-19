import { useEffect } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';

/**
 * Right/middle-drag panning when the gesture STARTS on an edge. Edges capture the pointer (their
 * interaction path), so React Flow's `panOnDrag` never starts a pane pan from an edge — this listens on
 * the flow container, and for a middle/right-button pointerdown that originated on an edge, pans the
 * viewport manually (matching `panOnDrag={[1,2]}`). Left-click on an edge is untouched. Must live inside
 * `ReactFlowProvider`.
 */
export default function EdgePanHandler() {
    const reactFlow = useReactFlow();
    const domNode = useStore((store) => store.domNode);
    useEffect(() => {
        if (!domNode) return;
        const onPointerDown = (event: PointerEvent) => {
            if (event.button !== 1 && event.button !== 2) return; // middle/right only
            const target = event.target as HTMLElement | null;
            if (!target?.closest('.react-flow__edge')) return; // only when starting on an edge
            event.preventDefault();
            const startX = event.clientX;
            const startY = event.clientY;
            const startViewport = reactFlow.getViewport();
            const onMove = (move: PointerEvent) => {
                const deltaX = move.clientX - startX;
                const deltaY = move.clientY - startY;
                reactFlow.setViewport({ x: startViewport.x + deltaX, y: startViewport.y + deltaY, zoom: startViewport.zoom });
            };
            const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
            };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        };
        domNode.addEventListener('pointerdown', onPointerDown);
        return () => domNode.removeEventListener('pointerdown', onPointerDown);
    }, [domNode, reactFlow]);
    return null;
}
