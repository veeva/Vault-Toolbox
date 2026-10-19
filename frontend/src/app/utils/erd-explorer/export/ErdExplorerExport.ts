/** Small browser download helpers shared by the ERD Explorer exporters (PNG / Markdown). */

function triggerDownload(url: string, filename: string): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
}

/** Download text content (e.g. Markdown) as a file. */
export function downloadText(filename: string, text: string, mime = 'text/markdown'): void {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
}

/** Download an already-encoded data URL (e.g. a PNG from html-to-image) as a file. */
export function downloadDataUrl(filename: string, dataUrl: string): void {
    triggerDownload(dataUrl, filename);
}
