export function toIntegerOrEmpty(value: string): number | '' {
    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? parsed : '';
}

export function toNullableInteger(value: number | ''): number | null {
    if (value === '') {
        return null;
    }

    return Number.isFinite(value) ? value : null;
}

export function megabytesToBytes(value: number): number {
    return Math.max(0, Math.round(value * 1024 * 1024));
}

export function formatBytesToMegabytes(value: number): string {
    return (value / (1024 * 1024)).toFixed(1);
}

export function splitFileName(filename: string): { label: string; extension: string } {
    const lastDotIndex = filename.lastIndexOf('.');

    if (lastDotIndex <= 0) {
        return {
            label: filename,
            extension: 'file',
        };
    }

    return {
        label: filename.slice(0, lastDotIndex),
        extension: filename.slice(lastDotIndex + 1).toLowerCase(),
    };
}
