export function formatDuration(durationMinutes: number | null): string {
    if (durationMinutes === null || Number.isNaN(durationMinutes)) {
        return '—';
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours <= 0) {
        return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
}

export function formatShortDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export function buildLineSegments(points: Array<{ x: number; y: number | null }>): string[] {
    const segments: string[] = [];
    let currentSegment = '';

    points.forEach((point, index) => {
        if (point.y === null) {
            if (currentSegment !== '') {
                segments.push(currentSegment);
                currentSegment = '';
            }
            return;
        }

        if (currentSegment === '') {
            currentSegment = `M ${point.x} ${point.y}`;
            return;
        }

        currentSegment += ` L ${point.x} ${point.y}`;

        if (index === points.length - 1) {
            segments.push(currentSegment);
        }
    });

    if (currentSegment !== '' && segments[segments.length - 1] !== currentSegment) {
        segments.push(currentSegment);
    }

    return segments;
}

export function calculateCompliance(plannedTss: number, actualTss: number): number {
    if (plannedTss <= 0) {
        return 0;
    }

    return Math.round((actualTss / plannedTss) * 100);
}
