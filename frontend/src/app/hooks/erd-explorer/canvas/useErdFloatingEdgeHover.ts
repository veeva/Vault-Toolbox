import { useState } from 'react';
import type React from 'react';

export function useErdFloatingEdgeHover() {
    const [hovered, setHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

    const handleMouseEnter = () => setHovered(true);
    const handleMouseLeave = () => { setHovered(false); setMousePosition(null); };
    const handleMouseMove = (event: React.MouseEvent<SVGPathElement>) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    return { hovered, mousePosition, handleMouseEnter, handleMouseLeave, handleMouseMove };
}
