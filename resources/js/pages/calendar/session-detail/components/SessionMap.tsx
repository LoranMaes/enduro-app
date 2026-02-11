import { useEffect, useMemo } from 'react';
import { MapPinned } from 'lucide-react';
import type { LatLngBoundsExpression } from 'leaflet';
import {
    CircleMarker,
    MapContainer,
    Polyline,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import { streamColors, streamLabels } from '../constants';
import type { MapPoint, XAxisMode } from '../types';
import { formatStreamValue, formatXAxisValue } from '../utils';

type SessionMapProps = {
    latLngPoints: MapPoint[];
    focusedRoutePoints: MapPoint[];
    hoverPoint: MapPoint | null;
    hoverSummary: {
        xValue: number | null;
        values: Array<{ key: string; value: number | null }>;
    } | null;
    xAxisMode: XAxisMode;
    onResetZoom: () => void;
};

export function SessionMap({
    latLngPoints,
    focusedRoutePoints,
    hoverPoint,
    hoverSummary,
    xAxisMode,
    onResetZoom,
}: SessionMapProps) {
    return (
        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-medium text-zinc-200">Route</h2>
            </div>

            <div className="relative box-border h-[18.75rem] overflow-hidden rounded-lg border border-border/60 bg-background/70 p-2 xl:h-[20rem]">
                {latLngPoints.length > 1 ? (
                    <>
                        <ActivityMap
                            points={latLngPoints}
                            focusPoints={focusedRoutePoints}
                            hoverPoint={hoverPoint}
                            onResetZoom={onResetZoom}
                        />

                        {hoverSummary !== null ? (
                            <div className="pointer-events-none absolute top-3 right-3 z-[600] min-w-44 rounded-md border border-zinc-700/80 bg-zinc-950/85 px-3 py-2">
                                <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                                    {xAxisMode === 'distance'
                                        ? 'Distance'
                                        : 'Elapsed Time'}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-zinc-100">
                                    {formatXAxisValue(
                                        hoverSummary.xValue,
                                        xAxisMode,
                                    )}
                                </p>

                                <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
                                    {hoverSummary.values.map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <span className="text-[0.625rem] text-zinc-400">
                                                {streamLabels[item.key] ??
                                                    item.key}
                                            </span>
                                            <span
                                                className="font-mono text-[0.625rem]"
                                                style={{
                                                    color:
                                                        streamColors[
                                                            item.key
                                                        ] ?? '#a1a1aa',
                                                }}
                                            >
                                                {formatStreamValue(
                                                    item.key,
                                                    item.value,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                        Route data will appear when GPS stream is available.
                    </div>
                )}
            </div>
        </div>
    );
}

function ActivityMap({
    points,
    focusPoints,
    hoverPoint,
    onResetZoom,
}: {
    points: MapPoint[];
    focusPoints: MapPoint[];
    hoverPoint: MapPoint | null;
    onResetZoom: () => void;
}) {
    const effectiveFocusPoints = focusPoints.length > 1 ? focusPoints : points;

    const bounds = useMemo<LatLngBoundsExpression>(() => {
        return effectiveFocusPoints;
    }, [effectiveFocusPoints]);

    return (
        <MapContainer
            center={points[0]}
            zoom={13}
            doubleClickZoom={false}
            className="h-full w-full rounded-md"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Polyline
                positions={points}
                pathOptions={{
                    color: '#3f3f46',
                    weight: 3,
                    opacity: 0.45,
                }}
            />

            <Polyline
                positions={effectiveFocusPoints}
                pathOptions={{
                    color: '#f59e0b',
                    weight: 4,
                    opacity: 0.95,
                }}
            />

            {hoverPoint !== null ? (
                <CircleMarker
                    center={hoverPoint}
                    radius={6}
                    pathOptions={{
                        color: '#f8fafc',
                        weight: 2,
                        fillColor: '#22d3ee',
                        fillOpacity: 0.85,
                    }}
                />
            ) : null}

            <MapResetOnDoubleClick onResetZoom={onResetZoom} />
            <FitMapBounds bounds={bounds} />
        </MapContainer>
    );
}

function MapResetOnDoubleClick({ onResetZoom }: { onResetZoom: () => void }) {
    useMapEvents({
        dblclick: () => {
            onResetZoom();
        },
    });

    return null;
}

function FitMapBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
    const map = useMap();

    useEffect(() => {
        map.fitBounds(bounds, {
            padding: [24, 24],
        });
    }, [bounds, map]);

    return null;
}
