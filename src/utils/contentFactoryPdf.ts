function normalizePdfBase64(value: string): string {
    const trimmed = value.trim();
    const comma = trimmed.indexOf(',');
    if (trimmed.startsWith('data:') && comma >= 0) {
        return trimmed.slice(comma + 1).replace(/\s/g, '');
    }
    return trimmed.replace(/\s/g, '');
}

export function pdfBase64ToBlob(pdfBase64: string, contentType = 'application/pdf'): Blob {
    const normalized = normalizePdfBase64(pdfBase64);
    if (!normalized) throw new Error('Пустой pdf_base64 от бэкенда');
    const bytes = Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: contentType });
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

export function openPdfBlobInNewTab(blob: Blob, filename = 'presentation.pdf'): boolean {
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, '_blank', 'noopener,noreferrer');
    if (!tab) {
        downloadPdfBlob(blob, filename);
        URL.revokeObjectURL(url);
        return false;
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return true;
}
