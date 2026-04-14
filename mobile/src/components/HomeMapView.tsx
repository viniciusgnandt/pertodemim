import { StyleSheet, Platform } from 'react-native';

const WebView = Platform.OS !== 'web'
  ? require('react-native-webview').WebView
  : null;

interface Establishment {
  _id: string;
  name: string;
  location: { coordinates: [number, number] };
  address?: { neighborhood?: string };
  isSponsored?: boolean;
}

interface Props {
  establishments: Establishment[];
  userLat?: number | null;
  userLng?: number | null;
}

const MOGI_CENTER = { lat: -23.5232, lng: -46.1897 };

const CATEGORY_ICON: Record<string, string> = {
  supermarket: '🛒',
  pharmacy: '💊',
  bakery: '🥖',
  restaurant: '🍽️',
  petshop: '🐾',
  electronics: '📱',
  other: '🏬',
};

const CATEGORY_COLOR: Record<string, string> = {
  supermarket: '#10B981',
  pharmacy: '#3B82F6',
  bakery: '#F59E0B',
  restaurant: '#EF4444',
  petshop: '#8B5CF6',
  electronics: '#06B6D4',
  other: '#6B7280',
};

export default function HomeMapView({ establishments, userLat, userLng }: Props) {
  const centerLat = userLat ?? MOGI_CENTER.lat;
  const centerLng = userLng ?? MOGI_CENTER.lng;

  const markersJs = establishments.map(est => {
    const [lng, lat] = est.location.coordinates;
    const name = est.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const neighborhood = (est.address?.neighborhood || '').replace(/'/g, "\\'");
    const color = est.isSponsored ? '#FF5A1F' : (CATEGORY_COLOR[est.category] || '#6B7280');
    const icon = est.isSponsored ? '⚡' : (CATEGORY_ICON[est.category] || '🏬');
    return `
      L.marker([${lat}, ${lng}], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);font-size:16px;">${icon}</div>',
          iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22],
        })
      }).addTo(map).bindPopup('<b>${name}</b>${neighborhood ? `<br><span style="font-size:11px;color:#888;">${neighborhood}</span>` : ''}<br><a href="/establishment/${est._id}" style="color:#FF5A1F;font-size:12px;font-weight:700;">Ver →</a>');
    `;
  }).join('\n');

  const userMarkerJs = userLat && userLng ? `
    L.circleMarker([${userLat}, ${userLng}], {
      radius: 8, fillColor: '#3B82F6', color: 'white',
      weight: 3, opacity: 1, fillOpacity: 1
    }).addTo(map).bindPopup('Você está aqui');
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        html, body, #map { width: 100%; height: 100%; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; }
        .leaflet-popup-content { font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600; margin: 8px 12px !important; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false })
          .setView([${centerLat}, ${centerLng}], ${userLat ? 14 : 13});
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
        ${userMarkerJs}
        ${markersJs}
      </script>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    return (
      <iframe
        srcDoc={html}
        style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        sandbox="allow-scripts"
      />
    );
  }

  return (
    <WebView
      source={{ html }}
      style={styles.map}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
