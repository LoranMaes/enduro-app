import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { StreamSeries, XAxisMode } from '../../types';
import { formatXAxisTick } from '../../utils';

type InteractiveStreamChartProps = {
    mode: XAxisMode;
    series: StreamSeries[];
    referencePoints: Array<{ x: number; sampleIndex: number }>;
    hoverSampleIndex: number | null;
    onHoverSampleIndexChange: (sampleIndex: number | null) => void;
    onZoomSelection: (min: number, max: number) => void;
};

export function InteractiveStreamChart({
    mode,
    series,
    referencePoints,
    hoverSampleIndex,
    onHoverSampleIndexChange,
    onZoomSelection,
}: InteractiveStreamChartProps) {
    const width = 960;
    const height = 380;
    const axisLeft = 50;
    const axisRight = 22;
    const axisTop = 16;
    const axisBottom = 36;

    const [selectionStartX, setSelectionStartX] = useState<number | null>(null);
    const [selectionEndX, setSelectionEndX] = useState<number | null>(null);
    const [hoverChartX, setHoverChartX] = useState<number | null>(null);

    const xValues = referencePoints.map((point) => point.x);
    const yValues = series.flatMap((item) => item.points.map((point) => point.y));

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minYRaw = Math.min(...yValues);
    const maxYRaw = Math.max(...yValues);
    const yPadding = Math.max(1, (maxYRaw - minYRaw) * 0.08);
    const minY = minYRaw - yPadding;
    const maxY = maxYRaw + yPadding;

    const chartWidth = width - axisLeft - axisRight;
    const chartHeight = height - axisTop - axisBottom;

    const hoveredReferencePoint =
        hoverSampleIndex === null
            ? null
            : (referencePoints.find(
                  (point) => point.sampleIndex === hoverSampleIndex,
              ) ?? null);

    const xTicks = Array.from({ length: 6 }, (_, index) => {
        const ratio = index / 5;
        const value = minX + (maxX - minX) * ratio;

        return {
            x: axisLeft + chartWidth * ratio,
            label: formatXAxisTick(value, mode),
        };
    });

    const yTicks = Array.from({ length: 5 }, (_, index) => {
        const ratio = index / 4;
        const value = maxY - (maxY - minY) * ratio;

        return {
            y: axisTop + chartHeight * ratio,
            label: `${Math.round(value)}`,
        };
    });

    const getChartXFromMouse = (
        event: ReactMouseEvent<SVGSVGElement, MouseEvent>,
    ): number => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const svgX = ((event.clientX - bounds.left) / bounds.width) * width;

        return Math.max(axisLeft, Math.min(axisLeft + chartWidth, svgX));
    };

    const chartXToDomain = (chartX: number): number => {
        return minX + ((chartX - axisLeft) / chartWidth) * (maxX - minX);
    };

    const selectionRectangle =
        selectionStartX !== null && selectionEndX !== null
            ? {
                  x: Math.min(selectionStartX, selectionEndX),
                  width: Math.abs(selectionEndX - selectionStartX),
              }
            : null;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full cursor-crosshair"
            preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => {
                onHoverSampleIndexChange(null);
                setHoverChartX(null);
                setSelectionStartX(null);
                setSelectionEndX(null);
            }}
            onMouseDown={(event) => {
                const chartX = getChartXFromMouse(event);
                setSelectionStartX(chartX);
                setSelectionEndX(chartX);
                setHoverChartX(chartX);
            }}
            onMouseMove={(event) => {
                const chartX = getChartXFromMouse(event);
                const domainX = chartXToDomain(chartX);

                setHoverChartX(chartX);

                const closest = referencePoints.reduce<{
                    distance: number;
                    sampleIndex: number;
                } | null>((current, point) => {
                    const distance = Math.abs(point.x - domainX);

                    if (current === null || distance < current.distance) {
                        return {
                            distance,
                            sampleIndex: point.sampleIndex,
                        };
                    }

                    return current;
                }, null);

                onHoverSampleIndexChange(closest?.sampleIndex ?? null);

                if (selectionStartX !== null) {
                    setSelectionEndX(chartX);
                }
            }}
            onMouseUp={() => {
                if (selectionStartX === null || selectionEndX === null) {
                    return;
                }

                if (Math.abs(selectionEndX - selectionStartX) >= 8) {
                    onZoomSelection(
                        chartXToDomain(selectionStartX),
                        chartXToDomain(selectionEndX),
                    );
                }

                setSelectionStartX(null);
                setSelectionEndX(null);
            }}
        >
            <rect
                x={axisLeft}
                y={axisTop}
                width={chartWidth}
                height={chartHeight}
                fill="#05070d"
                opacity={0.35}
            />

            {yTicks.map((tick) => (
                <g key={`y-${tick.y.toFixed(2)}`}>
                    <line
                        x1={axisLeft}
                        x2={axisLeft + chartWidth}
                        y1={tick.y}
                        y2={tick.y}
                        stroke="#27272a"
                        strokeWidth={1}
                        opacity={0.7}
                    />
                    <text
                        x={axisLeft - 8}
                        y={tick.y + 3}
                        textAnchor="end"
                        fill="#71717a"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                    >
                        {tick.label}
                    </text>
                </g>
            ))}

            {xTicks.map((tick) => (
                <g key={`x-${tick.x.toFixed(2)}`}>
                    <line
                        x1={tick.x}
                        x2={tick.x}
                        y1={axisTop}
                        y2={axisTop + chartHeight}
                        stroke="#27272a"
                        strokeWidth={1}
                        opacity={0.45}
                    />
                    <text
                        x={tick.x}
                        y={axisTop + chartHeight + 14}
                        textAnchor="middle"
                        fill="#71717a"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                    >
                        {tick.label}
                    </text>
                </g>
            ))}

            <line
                x1={axisLeft}
                x2={axisLeft + chartWidth}
                y1={axisTop + chartHeight}
                y2={axisTop + chartHeight}
                stroke="#3f3f46"
                strokeWidth={1}
            />
            <line
                x1={axisLeft}
                x2={axisLeft}
                y1={axisTop}
                y2={axisTop + chartHeight}
                stroke="#3f3f46"
                strokeWidth={1}
            />

            {series.map((item) => {
                const path = item.points
                    .map((point, index) => {
                        const x =
                            axisLeft +
                            ((point.x - minX) / Math.max(0.000001, maxX - minX)) *
                                chartWidth;
                        const y =
                            axisTop +
                            (1 -
                                (point.y - minY) /
                                    Math.max(0.000001, maxY - minY)) *
                                chartHeight;

                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ');

                return (
                    <g key={item.key}>
                        {item.key === 'elevation'
                            ? (() => {
                                  const first = item.points[0];
                                  const last = item.points[item.points.length - 1];

                                  if (first === undefined || last === undefined) {
                                      return null;
                                  }

                                  const firstX =
                                      axisLeft +
                                      ((first.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;
                                  const lastX =
                                      axisLeft +
                                      ((last.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;

                                  const zeroYRaw =
                                      axisTop +
                                      (1 -
                                          (0 - minY) /
                                              Math.max(0.000001, maxY - minY)) *
                                          chartHeight;
                                  const zeroY = Math.max(
                                      axisTop,
                                      Math.min(axisTop + chartHeight, zeroYRaw),
                                  );

                                  return (
                                      <path
                                          d={`${path} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`}
                                          fill="#a1a1aa"
                                          opacity={0.14}
                                      />
                                  );
                              })()
                            : null}

                        <path
                            d={path}
                            fill="none"
                            stroke={item.color}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {hoveredReferencePoint !== null
                            ? (() => {
                                  const hoveredPoint = item.points.find((point) => {
                                      return (
                                          point.sampleIndex ===
                                          hoveredReferencePoint.sampleIndex
                                      );
                                  });

                                  if (hoveredPoint === undefined) {
                                      return null;
                                  }

                                  const cx =
                                      axisLeft +
                                      ((hoveredPoint.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;
                                  const cy =
                                      axisTop +
                                      (1 -
                                          (hoveredPoint.y - minY) /
                                              Math.max(0.000001, maxY - minY)) *
                                          chartHeight;

                                  return (
                                      <circle
                                          cx={cx}
                                          cy={cy}
                                          r={3.2}
                                          fill={item.color}
                                          stroke="#09090b"
                                          strokeWidth={1.5}
                                      />
                                  );
                              })()
                            : null}
                    </g>
                );
            })}

            {hoverChartX !== null ? (
                <line
                    x1={hoverChartX}
                    x2={hoverChartX}
                    y1={axisTop}
                    y2={axisTop + chartHeight}
                    stroke="#d4d4d8"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    opacity={0.65}
                />
            ) : null}

            {selectionRectangle !== null && selectionRectangle.width > 0 ? (
                <rect
                    x={selectionRectangle.x}
                    y={axisTop}
                    width={selectionRectangle.width}
                    height={chartHeight}
                    fill="#e4e4e7"
                    opacity={0.18}
                    stroke="#e4e4e7"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                />
            ) : null}
        </svg>
    );
}
