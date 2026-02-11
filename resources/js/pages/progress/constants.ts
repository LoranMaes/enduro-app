import type { BreadcrumbItem } from '@/types';

export const progressBreadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Training Progress',
        href: '/progress',
    },
];

export const progressChartDimensions = {
    chartWidth: 1000,
    chartHeight: 320,
    chartPaddingX: 24,
    chartPaddingY: 24,
    gridLines: 4,
} as const;
