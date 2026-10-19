import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a text element is currently clipped by CSS truncation (e.g. `textOverflow: ellipsis`).
 * Returns the ref to attach to that element and whether it is truncated right now.
 */
export default function useIsTextTruncated<TextElement extends HTMLElement>() {
    const [isTruncated, setIsTruncated] = useState(false);

    const textRef = useRef<TextElement | null>(null);

    useEffect(() => {
        const textElement = textRef.current;
        if (!textElement) return;

        const updateIsTruncated = () => {
            setIsTruncated(textElement.scrollWidth > textElement.clientWidth);
        };

        updateIsTruncated();
        const resizeObserver = new ResizeObserver(updateIsTruncated);
        resizeObserver.observe(textElement);
        return () => resizeObserver.disconnect();
    }, []);

    return {
        isTruncated,
        textRef,
    };
}
