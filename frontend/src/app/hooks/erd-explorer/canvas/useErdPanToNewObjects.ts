import { useEffect, useRef, type MutableRefObject } from 'react';
import { type Node, type Edge, type ReactFlowInstance } from '@xyflow/react';

interface UseErdPanToNewObjectsParams {
    placedObjects: string[];
    reactFlowRef: MutableRefObject<ReactFlowInstance<Node, Edge> | null>;
}

/** After objects are added to the canvas, pan the viewport to centre on the newly-added nodes. */
export function useErdPanToNewObjects({ placedObjects, reactFlowRef }: UseErdPanToNewObjectsParams) {
    const prevPlacedSetRef = useRef(new Set<string>());

    useEffect(() => {
        const previousPlaced = prevPlacedSetRef.current;
        const addedNames = placedObjects.filter((name) => !previousPlaced.has(name));
        prevPlacedSetRef.current = new Set(placedObjects);
        if (addedNames.length === 0) return;
        window.setTimeout(() => {
            const reactFlow = reactFlowRef.current;
            if (!reactFlow) return;
            const addedSet = new Set(addedNames);
            const targetNodes = reactFlow.getNodes().filter((node) => addedSet.has(node.id));
            if (targetNodes.length === 0) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const node of targetNodes) {
                const nodeWidth = node.measured?.width ?? 220;
                const nodeHeight = node.measured?.height ?? 90;
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                maxX = Math.max(maxX, node.position.x + nodeWidth);
                maxY = Math.max(maxY, node.position.y + nodeHeight);
            }
            reactFlow.setCenter((minX + maxX) / 2, (minY + maxY) / 2, { duration: 300, zoom: reactFlow.getZoom() });
        }, 50);
    }, [placedObjects, reactFlowRef]);
}
