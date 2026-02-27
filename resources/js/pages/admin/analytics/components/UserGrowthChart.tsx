import type { AnalyticsChartData, UseAdminAnalyticsChartResult } from '../hooks/useAdminAnalyticsChart';
import type { UserGrowth } from '../types';

type UserGrowthChartProps = {
    userGrowth: UserGrowth;
    chart: AnalyticsChartData;
    enabledSeries: UseAdminAnalyticsChartResult['enabledSeries'];
    hoveredIndex: number | null;
    activePointIndex: number;
    activeLabel: string;
    activeTotal: number;
    activeAthletes: number;
    activeCoaches: number;
    setHoveredIndex: (index: number | null) => void;
};

export function UserGrowthChart({
    userGrowth,
    chart,
    enabledSeries,
    hoveredIndex,
    activePointIndex,
    activeLabel,
    activeTotal,
    activeAthletes,
    activeCoaches,
    setHoveredIndex,
}: UserGrowthChartProps) {
    return (
        <div className="relative h-72 overflow-hidden rounded-lg border border-border/70 bg-background/70">
            <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-md border border-zinc-800 bg-zinc-950/85 px-2.5 py-1.5 text-[0.6875rem]">
                <p className="text-zinc-400">{activeLabel}</p>
                <div className="mt-1 flex items-center gap-2 text-zinc-300">
                    <span className="text-zinc-500">T</span>
                    <span className="font-mono">{activeTotal}</span>
                    <span className="text-sky-300">A</span>
                    <span className="font-mono text-sky-200">{activeAthletes}</span>
                    <span className="text-violet-300">C</span>
                    <span className="font-mono text-violet-200">{activeCoaches}</span>
                </div>
            </div>
            <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                className="h-full w-full"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="User growth chart"
                onMouseLeave={() => setHoveredIndex(null)}
            >
                {Array.from({ length: 5 }, (_, index) => {
                    const y = chart.paddingY + (chart.innerHeight / 4) * index;

                    return (
                        <line
                            key={`grid-${index}`}
                            x1={chart.paddingX}
                            y1={y}
                            x2={chart.width - chart.paddingX}
                            y2={y}
                            stroke="rgba(39,39,42,0.7)"
                            strokeWidth={1}
                        />
                    );
                })}

                {userGrowth.labels.map((label, index) => {
                    const point = chart.totalPoints[index];

                    if (point === undefined) {
                        return null;
                    }

                    const hitWidth =
                        userGrowth.labels.length > 1
                            ? Math.max(16, chart.stepX)
                            : chart.width - chart.paddingX * 2;
                    const startX = Math.max(chart.paddingX, point.x - hitWidth / 2);
                    const maxStartX = chart.width - chart.paddingX - hitWidth;

                    return (
                        <rect
                            key={`hover-hit-${label}`}
                            x={Math.min(startX, maxStartX)}
                            y={chart.paddingY}
                            width={hitWidth}
                            height={chart.innerHeight}
                            fill="transparent"
                            onMouseEnter={() => setHoveredIndex(index)}
                        />
                    );
                })}

                {enabledSeries.totals ? (
                    <>
                        <path
                            d={chart.buildPath(userGrowth.totals)}
                            fill="none"
                            stroke="rgb(212,212,216)"
                            strokeWidth={2}
                        />
                        {chart.buildPoints(userGrowth.totals).map((point, index) => (
                            <circle
                                key={`total-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r={2.5}
                                fill="rgb(212,212,216)"
                            />
                        ))}
                    </>
                ) : null}

                {enabledSeries.athletes ? (
                    <path
                        d={chart.buildPath(userGrowth.athletes)}
                        fill="none"
                        stroke="rgb(56,189,248)"
                        strokeWidth={2}
                    />
                ) : null}

                {enabledSeries.coaches ? (
                    <path
                        d={chart.buildPath(userGrowth.coaches)}
                        fill="none"
                        stroke="rgb(167,139,250)"
                        strokeWidth={2}
                    />
                ) : null}

                {(() => {
                    const focusPoint = chart.totalPoints[activePointIndex];

                    if (focusPoint === undefined) {
                        return null;
                    }

                    return (
                        <line
                            x1={focusPoint.x}
                            y1={chart.paddingY}
                            x2={focusPoint.x}
                            y2={chart.paddingY + chart.innerHeight}
                            stroke="rgba(113,113,122,0.6)"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                        />
                    );
                })()}

                {enabledSeries.totals &&
                chart.totalPoints[activePointIndex] !== undefined ? (
                    <circle
                        cx={chart.totalPoints[activePointIndex].x}
                        cy={chart.totalPoints[activePointIndex].y}
                        r={4}
                        fill="rgb(212,212,216)"
                        stroke="rgb(9,9,11)"
                        strokeWidth={1.5}
                    />
                ) : null}

                {enabledSeries.athletes &&
                chart.athletePoints[activePointIndex] !== undefined ? (
                    <circle
                        cx={chart.athletePoints[activePointIndex].x}
                        cy={chart.athletePoints[activePointIndex].y}
                        r={4}
                        fill="rgb(56,189,248)"
                        stroke="rgb(9,9,11)"
                        strokeWidth={1.5}
                    />
                ) : null}

                {enabledSeries.coaches &&
                chart.coachPoints[activePointIndex] !== undefined ? (
                    <circle
                        cx={chart.coachPoints[activePointIndex].x}
                        cy={chart.coachPoints[activePointIndex].y}
                        r={4}
                        fill="rgb(167,139,250)"
                        stroke="rgb(9,9,11)"
                        strokeWidth={1.5}
                    />
                ) : null}

                <text
                    x={chart.paddingX}
                    y={chart.paddingY - 8}
                    fill="rgb(113,113,122)"
                    fontSize={11}
                >
                    {chart.maxValue}
                </text>

                {userGrowth.labels.map((label, index) => {
                    const x =
                        chart.paddingX +
                        index *
                            (userGrowth.labels.length > 1
                                ? (chart.width - chart.paddingX * 2) /
                                  (userGrowth.labels.length - 1)
                                : 0);
                    const shouldShow =
                        userGrowth.labels.length <= 8 ||
                        index % Math.ceil(userGrowth.labels.length / 6) === 0 ||
                        index === userGrowth.labels.length - 1;

                    if (!shouldShow) {
                        return null;
                    }

                    return (
                        <text
                            key={label}
                            x={x}
                            y={chart.height - 8}
                            textAnchor="middle"
                            fill="rgb(113,113,122)"
                            fontSize={10}
                        >
                            {label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
