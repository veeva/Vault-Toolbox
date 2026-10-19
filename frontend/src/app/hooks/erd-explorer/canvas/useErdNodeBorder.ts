import { useStore } from '@xyflow/react';
import { highlightZoomScale } from '../../../utils/erd-explorer/ErdExplorerHelper';
import {
    ERD_HIGHLIGHT_INBOUND,
    ERD_HIGHLIGHT_OUTBOUND,
    type ErdHighlightDirection,
} from '../../../utils/erd-explorer/ErdExplorerTypes';

const NODE_BORDER_WIDTH = 2;

interface UseErdNodeBorderArgs {
    selected?: boolean;
    highlight?: ErdHighlightDirection;
    /** Border colour when the node is neither selected nor a highlighted neighbour. */
    restingBorderColor: string;
}

/**
 * Border colour and width shared by every canvas node: selection (orange) wins, else the muted
 * neighbour-highlight colour, else the node's resting colour.
 */
export function useErdNodeBorder({ selected, highlight, restingBorderColor }: UseErdNodeBorderArgs) {
    // Coarse zoom (quantized to 0.1 steps) limits re-renders while still thickening the border as you zoom out.
    const zoom = useStore((store) => Math.round(store.transform[2] * 10) / 10);

    const highlightColor = highlight === 'out' ? ERD_HIGHLIGHT_OUTBOUND : highlight === 'in' ? ERD_HIGHLIGHT_INBOUND : undefined;
    const borderColor = selected ? 'veeva_orange_color_mode' : highlightColor ?? restingBorderColor;
    // An emphasized border — selection (orange) OR neighbour highlight (green/red) — thickens as you zoom
    // out at the same rate as highlighted edges (shared `highlightZoomScale`), so it stays visible from afar.
    const emphasized = selected || !!highlightColor;
    const borderWidth = `${emphasized ? NODE_BORDER_WIDTH * highlightZoomScale(zoom) : NODE_BORDER_WIDTH}px`;

    return { borderColor, borderWidth };
}
