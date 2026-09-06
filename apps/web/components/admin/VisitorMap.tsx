'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MarkerMode = 'circle' | 'bar';

/** A location plus the number it should be sized by. */
export interface MapPoint {
  latitude: number;
  longitude: number;
  label: string;
  /** The value markers scale on. */
  value: number;
  /** Lines shown in the tooltip/popup, e.g. "12 visits". */
  detail: string[];
}

interface Props {
  points: MapPoint[];
  mode: MarkerMode;
  /** Height class for the map container. */
  heightClass?: string;
}

const MIN_RADIUS = 6;
const MAX_RADIUS = 34;
const MIN_BAR = 14;
const MAX_BAR = 90;

/**
 * Scales a value into [min, cap] on a square-root curve.
 *
 * Circle area — not radius — should track the count, so radius uses sqrt.
 * Bars use the same curve to keep one dominant city from flattening the rest.
 */
function scale(value: number, max: number, min: number, cap: number) {
  if (max <= 0) return min;
  return min + (cap - min) * Math.sqrt(value / max);
}

/** A bar marker is a div icon: a coloured column with the count above it. */
function barIcon(height: number, count: number, accent: string) {
  return L.divIcon({
    className: 'marker-bar',
    iconSize: [34, height + 22],
    iconAnchor: [17, height + 22],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:${height + 22}px;">
        <span style="font:600 11px/1 ui-sans-serif,system-ui;color:#0a0d0c;background:#fff;border:1px solid #c6cfcb;border-radius:6px;padding:2px 5px;margin-bottom:3px;white-space:nowrap;box-shadow:0 1px 2px rgba(10,13,12,.12)">${count}</span>
        <span style="width:12px;height:${height}px;border-radius:3px 3px 0 0;background:linear-gradient(180deg, ${accent} 0%, ${accent}bb 100%);box-shadow:0 1px 3px rgba(10,13,12,.28)"></span>
      </div>
    `,
  });
}

export default function VisitorMap({ points, mode, heightClass = 'h-[22rem] sm:h-[30rem]' }: Props) {
  const valued = useMemo(
    () => points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    [points],
  );

  const max = useMemo(() => valued.reduce((m, p) => Math.max(m, p.value), 0), [valued]);

  return (
    <MapContainer
      center={[26, 6]}
      zoom={2}
      minZoom={2}
      maxZoom={12}
      scrollWheelZoom={false}
      worldCopyJump
      className={`w-full rounded-2xl ${heightClass}`}
      style={{ background: '#eef3f1' }}
    >
      {/*
        Standard OSM tiles: no API key, unlike CARTO's basemaps which now
        watermark unkeyed requests. Desaturated in CSS (.leaflet-tile-pane) so
        the colourful default recedes behind the markers.
      */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {valued.map((point, i) => {
        const key = `${point.latitude},${point.longitude},${point.label},${i}`;
        // Grass green for ordinary volume, sky blue for the busiest tier.
        const accent = max > 0 && point.value >= max * 0.66 ? '#00a5ec' : '#3a9448';

        const detail = (
          <div className="text-xs">
            <div className="font-semibold text-ink">{point.label}</div>
            {point.detail.map((line) => (
              <div key={line} className="mt-1 text-ink-500">
                {line}
              </div>
            ))}
          </div>
        );

        if (mode === 'bar') {
          const height = Math.round(scale(point.value, max, MIN_BAR, MAX_BAR));
          return (
            <Marker key={key} position={[point.latitude, point.longitude]} icon={barIcon(height, point.value, accent)}>
              <Popup>{detail}</Popup>
            </Marker>
          );
        }

        return (
          <CircleMarker
            key={key}
            center={[point.latitude, point.longitude]}
            radius={scale(point.value, max, MIN_RADIUS, MAX_RADIUS)}
            pathOptions={{ color: accent, weight: 1.5, fillColor: accent, fillOpacity: 0.32 }}
          >
            <Tooltip direction="top" offset={[0, -4]}>
              {detail}
            </Tooltip>
            <Popup>{detail}</Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
