import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationRecord, Geofence } from '../types/aman';

interface MapComponentProps {
  currentLocation?: LocationRecord | null;
  history?: LocationRecord[];
  geofences?: Geofence[];
  childName?: string;
  lang: 'ar' | 'en';
}

export const MapComponent: React.FC<MapComponentProps> = ({
  currentLocation,
  history = [],
  geofences = [],
  childName = 'الطفل',
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center coordinates: current location or default Riyadh coordinates
    const defaultLat = currentLocation?.lat || 24.8142;
    const defaultLng = currentLocation?.lng || 46.6508;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: lang === 'ar' ? 'bottomleft' : 'bottomright' }).addTo(map);

    // OpenStreetMap standard tile layer with dark-friendly styling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Timeout to fix container rendering in dynamic layouts
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update Layers (Marker, History Trail, Geofences)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Geofences
    geofences.forEach((geo) => {
      if (!geo.enabled) return;

      const circle = L.circle([geo.lat, geo.lng], {
        radius: geo.radius,
        color: '#10b981',
        weight: 2,
        dashArray: '4, 6',
        fillColor: '#10b981',
        fillOpacity: 0.18,
      });

      const popupContent = `
        <div style="font-family: inherit; direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${lang === 'ar' ? 'right' : 'left'};">
          <div style="font-weight: bold; font-size: 13px; color: #047857; margin-bottom: 2px;">
            🛡️ ${geo.name}
          </div>
          <div style="font-size: 11px; color: #64748b;">
            ${lang === 'ar' ? `نطاق الحماية: ${geo.radius} متر` : `Safe radius: ${geo.radius}m`}
          </div>
        </div>
      `;
      circle.bindPopup(popupContent);
      layerGroup.addLayer(circle);
    });

    // 2. Draw History Trail (Breadcrumbs)
    if (history.length > 1) {
      const sortedHistory = [...history].sort((a, b) => a.deviceTime - b.deviceTime);
      const points: [number, number][] = sortedHistory.map((h) => [h.lat, h.lng]);

      const polyline = L.polyline(points, {
        color: '#6366f1',
        weight: 3,
        opacity: 0.7,
        dashArray: '6, 8',
      });
      layerGroup.addLayer(polyline);

      // Add small dots for historical points
      sortedHistory.slice(0, -1).forEach((pt, idx) => {
        const historyDot = L.circleMarker([pt.lat, pt.lng], {
          radius: 5,
          color: '#4f46e5',
          fillColor: '#818cf8',
          fillOpacity: 0.8,
          weight: 1,
        });

        const timeStr = new Date(pt.deviceTime).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        historyDot.bindPopup(`
          <div style="font-family: inherit; font-size: 11px; direction: ${lang === 'ar' ? 'rtl' : 'ltr'};">
            ${lang === 'ar' ? `نقطة سابقة (${timeStr})` : `Previous Fix (${timeStr})`}
            ${pt.addressLabel ? `<br/><b>${pt.addressLabel}</b>` : ''}
          </div>
        `);
        layerGroup.addLayer(historyDot);
      });
    }

    // 3. Draw Current Location Marker
    if (currentLocation) {
      const { lat, lng, accuracy, addressLabel, deviceTime } = currentLocation;

      // Accuracy circle
      if (accuracy && accuracy > 0) {
        const accuracyCircle = L.circle([lat, lng], {
          radius: accuracy,
          color: '#3b82f6',
          weight: 1,
          fillColor: '#60a5fa',
          fillOpacity: 0.15,
        });
        layerGroup.addLayer(accuracyCircle);
      }

      // Custom pulsing child pin
      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
            ${childName.charAt(0)}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-child-marker',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const timeFormatted = new Date(deviceTime).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const popupHtml = `
        <div style="font-family: inherit; direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${lang === 'ar' ? 'right' : 'left'}; min-width: 140px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
            ${childName}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            ${addressLabel || (lang === 'ar' ? 'موقع مباشر نشط' : 'Live location')}
          </div>
          <div style="font-size: 10px; color: #94a3b8;">
            🕒 ${timeFormatted} · 🎯 ±${Math.round(accuracy)}m
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      layerGroup.addLayer(marker);

      // Pan to child
      map.panTo([lat, lng], { animate: true });
    }
  }, [currentLocation, history, geofences, childName, lang]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {/* Visual Badge overlay */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] font-medium text-slate-200 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{lang === 'ar' ? 'خريطة التتبع المباشر (Leaflet GPS)' : 'Live Leaflet GPS Tracker'}</span>
      </div>
    </div>
  );
};
