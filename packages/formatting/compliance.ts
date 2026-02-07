export function calculateCompliance(
    actualTss: number,
    plannedTss: number,
): number {
    if (plannedTss === 0) return 0;
    return Math.round((actualTss / plannedTss) * 100);
}
