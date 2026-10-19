import { type CSSProperties } from 'react';
import type { BoxProps } from '@chakra-ui/react';

/**
 * Hidden connection handles. Object-level floating edges (see FloatingEdge) compute their own endpoints
 * from node geometry, so a node only needs one source + one target handle to exist for edges to bind;
 * their on-screen position is irrelevant, hence hidden and non-interactive (edges are derived).
 */
export const HiddenHandleStyle: CSSProperties = {
    opacity: 0,
    width: 1,
    height: 1,
    minWidth: 1,
    border: 'none',
    pointerEvents: 'none',
};

/** Content-driven sizing: a node is only as big as its contents need (no fixed/min height, no scroll). */
export const NodeContainerStyle: BoxProps = {
    minWidth: '200px',
    width: 'max-content',
    padding: '10px',
    borderRadius: '8px',
    borderWidth: '2px',
    backgroundColor: 'white_color_mode',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
};
