import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  CheckCircle,
  XCircle,
  Radio,
} from 'lucide-react';
import { CaseOrigin } from '../../types/case';
import { EvidenceCard } from '../common/EvidenceCard';
import { CopyableText } from '../common/CopyableText';

// Custom SVG map marker for dark SOC theme
const createCustomMarker = (isVpn: boolean) => {
  const color = isVpn ? '#EF4444' : '#06B6D4';
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; background-color: ${color}; opacity: 0.25; border-radius: 50%; animation: ping 2s infinite;"></div>
        <div style="width: 14px; height: 14px; background-color: ${color}; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 10px ${color};"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

interface OriginTabProps {
  origin: CaseOrigin;
}

export const OriginTab: React.FC<OriginTabProps> = ({ origin }) => {
  const lat = origin.geolocation.latitude || 50.1109;
  const lng = origin.geolocation.longitude || 8.6821;

  const isYoungDomain = origin.domain_intel.domain_age_days < 14;

  return (
    <div className="space-y-6">
      {/* 1. Interactive Leaflet Geolocation Map */}
      <EvidenceCard
        title="Origin Geolocation & Infrastructure Map"
        subtitle={`Estimated sending origin: ${origin.geolocation.city}, ${origin.geolocation.region}, ${origin.geolocation.country}`}
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
            {origin.geolocation.precision_confidence}
          </span>
        }
      >
        <div className="h-72 w-full rounded overflow-hidden border border-soc-border relative z-0">
          <MapContainer
            center={[lat, lng]}
            zoom={5}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Dark Matter / Carto Dark Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* Confidence Boundary Circle */}
            <Circle
              center={[lat, lng]}
              radius={origin.geolocation.precision_confidence.includes('city: low') ? 75000 : 25000}
              pathOptions={{
                color: origin.vpn_tor_flag ? '#EF4444' : '#06B6D4',
                fillColor: origin.vpn_tor_flag ? '#EF4444' : '#06B6D4',
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />

            {/* Origin Pin */}
            <Marker position={[lat, lng]} icon={createCustomMarker(origin.vpn_tor_flag)}>
              <Popup>
                <div className="font-mono text-xs">
                  <strong className="text-cyan-400 block mb-1">
                    ESTIMATED SENDING ORIGIN
                  </strong>
                  <div>IP: {origin.originating_ip}</div>
                  <div>
                    Location: {origin.geolocation.city}, {origin.geolocation.country}
                  </div>
                  <div>ISP: {origin.isp}</div>
                  <div className="text-[10px] text-amber-400 mt-1">
                    Precision: {origin.geolocation.precision_confidence}
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="mt-3 p-2.5 rounded bg-soc-inset border border-soc-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-slate-300">
              Origin IP: <strong className="text-cyan-300">{origin.originating_ip}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Coordinates: <span className="text-slate-200">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Provider: <span className="text-slate-200">{origin.isp}</span>
            </span>
          </div>
        </div>
      </EvidenceCard>

      {/* 2. Dual Intel Grid: IP Intelligence & Domain WHOIS/DNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* IP Intelligence */}
        <EvidenceCard
          title="IP Intelligence & Node Reputation"
          badge={
            origin.vpn_tor_flag ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-500/40">
                VPN / TOR DETECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                DIRECT RESIDENTIAL / CLOUD
              </span>
            )
          }
        >
          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-soc-inset border border-soc-border">
              <span className="text-soc-muted">Originating IP:</span>
              <CopyableText text={origin.originating_ip} textClassName="text-cyan-300 font-bold" />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-soc-inset border border-soc-border">
              <span className="text-soc-muted">ISP / Hosting Carrier:</span>
              <span className="text-slate-200 font-semibold">{origin.isp}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-soc-inset border border-soc-border">
              <span className="text-soc-muted">Threat Intelligence Source:</span>
              <span className="text-amber-300">{origin.flag_source}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-soc-inset border border-soc-border">
              <span className="text-soc-muted">Anonymization Risk:</span>
              <span className={origin.vpn_tor_flag ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {origin.vpn_tor_flag ? 'High (Proxy/Bulletproof Node)' : 'Low (Standard Route)'}
              </span>
            </div>
          </div>
        </EvidenceCard>

        {/* Domain WHOIS & DNS Intelligence */}
        <EvidenceCard
          title="Domain Intelligence & WHOIS Age"
          badge={
            isYoungDomain ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-500/40">
                NEWLY REGISTERED DOMAIN
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                ESTABLISHED DOMAIN
              </span>
            )
          }
        >
          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-soc-inset border border-soc-border">
              <span className="text-soc-muted">Evaluated Domain:</span>
              <CopyableText text={origin.domain_intel.domain} textClassName="text-cyan-300 font-bold" />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-soc-inset border border-soc-border">
              <span className="text-soc-muted">Domain Age:</span>
              <span className={`font-bold ${isYoungDomain ? 'text-red-400' : 'text-emerald-400'}`}>
                {origin.domain_intel.domain_age_days} days (Registered {origin.domain_intel.registered_on})
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-soc-inset border border-soc-border">
              <span className="text-soc-muted">Registrar Organization:</span>
              <span className="text-slate-200 font-medium">{origin.domain_intel.registrar}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-soc-inset border border-soc-border">
              <span className="text-soc-muted">MX DNS Record Validity:</span>
              <div className="flex items-center gap-1.5">
                {origin.domain_intel.mx_valid ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">VALID MX</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400 font-semibold">NO VALID MX RECORD</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </EvidenceCard>
      </div>
    </div>
  );
};
