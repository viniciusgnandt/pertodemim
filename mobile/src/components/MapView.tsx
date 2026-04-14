import { View, StyleSheet, TouchableOpacity, Text, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

// WebView is not supported on web platform
const WebView = Platform.OS !== 'web'
  ? require('react-native-webview').WebView
  : null;

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

interface Props {
  lat: number;
  lng: number;
  name: string;
  neighborhood?: string;
  category?: string;
}

export default function MapView({ lat, lng, name, neighborhood, category }: Props) {
  const markerColor = CATEGORY_COLOR[category || ''] || '#FF5A1F';
  const markerIcon = CATEGORY_ICON[category || ''] || '📍';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-content {
          font-family: -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A2E;
          margin: 10px 14px !important;
        }
        .popup-sub {
          font-size: 12px;
          color: #888;
          font-weight: 400;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lng}], 16);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

        const icon = L.divIcon({
          className: '',
          html: '<div style="width:44px;height:44px;border-radius:50%;background:${markerColor};display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 16px rgba(0,0,0,0.25);font-size:20px;">${markerIcon}</div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -26],
        });

        L.marker([${lat}, ${lng}], { icon })
          .addTo(map)
          .bindPopup('<b>${name.replace(/'/g, "\\'")}</b>${neighborhood ? `<div class="popup-sub">${neighborhood}</div>` : ''}')
          .openPopup();
      </script>
    </body>
    </html>
  `;

  const openMaps = () => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  const mapContent = Platform.OS === 'web' ? (
    <iframe
      srcDoc={html}
      style={{ width: '100%', height: 200, border: 'none' }}
      sandbox="allow-scripts"
    />
  ) : (
    <WebView
      source={{ html }}
      style={styles.map}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        {mapContent}
        {neighborhood ? (
          <View style={styles.label}>
            <Ionicons name="location" size={12} color={Colors.primary} />
            <Text style={styles.labelText}>{neighborhood}</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity style={styles.directionsBtn} onPress={openMaps} activeOpacity={0.8}>
        <Ionicons name="navigate" size={16} color={Colors.primary} />
        <Text style={styles.directionsBtnText}>Como chegar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 12,
  },
  mapWrapper: { position: 'relative' },
  map: { height: 200, width: '100%' },
  label: {
    position: 'absolute',
    bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'white',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  labelText: { fontSize: 12, fontWeight: '700', color: '#1A1A2E' },
  directionsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    borderTopWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  directionsBtnText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
});
