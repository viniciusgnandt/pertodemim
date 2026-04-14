import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/axios';
import { Colors } from '../../src/constants/colors';
import EstablishmentCard from '../../src/components/EstablishmentCard';
import HomeMapView from '../../src/components/HomeMapView';

const CATEGORIES = [
  { label: 'Todos', value: '', icon: '🏠' },
  { label: 'Mercado', value: 'supermarket', icon: '🛒' },
  { label: 'Farmácia', value: 'pharmacy', icon: '💊' },
  { label: 'Padaria', value: 'bakery', icon: '🥖' },
  { label: 'Açougue', value: 'butcher', icon: '🥩' },
  { label: 'Restaurante', value: 'restaurant', icon: '🍽️' },
  { label: 'Conveniência', value: 'convenience', icon: '🏪' },
  { label: 'Pet Shop', value: 'petshop', icon: '🐾' },
  { label: 'Eletrônicos', value: 'electronics', icon: '📱' },
  { label: 'Outros', value: 'other', icon: '🏬' },
];

const CATEGORY_COLOR: Record<string, string> = {
  supermarket: '#10B981', pharmacy: '#3B82F6', bakery: '#F59E0B',
  butcher: '#EF4444', restaurant: '#F97316', convenience: '#8B5CF6',
  petshop: '#EC4899', electronics: '#06B6D4', other: '#6B7280',
};

interface Coords { lat: number; lng: number }

const PAGE_SIZE = 12;
const RADIUS_OPTIONS = [1, 2, 5, 10, 20];

export default function HomeScreen() {
  const router = useRouter();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [category, setCategory] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [radius, setRadius] = useState(5);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setLocationError(true),
          { enableHighAccuracy: false, timeout: 10000 },
        );
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError(true); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['establishments', 'nearby', coords, category, radius],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' };
      if (coords) {
        params.lat = String(coords.lat);
        params.lng = String(coords.lng);
        params.radius = String(radius * 1000);
      }
      if (category) params.category = category;
      const { data } = await api.get('/establishments', { params });
      return data.establishments as any[];
    },
    onSuccess: () => setVisibleCount(PAGE_SIZE),
  });

  const allItems = data || [];
  const visibleItems = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;
  const activeColor = category ? (CATEGORY_COLOR[category] || Colors.primary) : Colors.primary;

  // ── Toolbar ──────────────────────────────────────────────────────────────
  const Toolbar = (
    <>
      {/* Search bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push({ pathname: '/(tabs)/search' })}>
          <Ionicons name="search" size={16} color={Colors.textLight} />
          <Text style={styles.searchPlaceholder}>Buscar produtos ou estabelecimentos...</Text>
        </TouchableOpacity>
        {locationError && (
          <View style={styles.locationBanner}>
            <Ionicons name="location-outline" size={14} color={Colors.warning} />
            <Text style={styles.locationText}>Localização desativada</Text>
          </View>
        )}
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => {
          const active = category === item.value;
          const color = item.value ? (CATEGORY_COLOR[item.value] || Colors.primary) : Colors.primary;
          return (
            <TouchableOpacity
              style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
              onPress={() => { setCategory(item.value); setVisibleCount(PAGE_SIZE); }}
              activeOpacity={0.75}
            >
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Actions row: toggle + filters */}
      <View style={styles.actionsRow}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
            onPress={() => setView('list')}
            activeOpacity={0.85}
          >
            <Ionicons name="list" size={15} color={view === 'list' ? Colors.white : Colors.textMuted} />
            <Text style={[styles.toggleLabel, view === 'list' && styles.toggleLabelActive]}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
            onPress={() => setView('map')}
            activeOpacity={0.85}
          >
            <Ionicons name="map" size={15} color={view === 'map' ? Colors.white : Colors.textMuted} />
            <Text style={[styles.toggleLabel, view === 'map' && styles.toggleLabelActive]}>Mapa</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.filtersBtn, showFilters && styles.filtersBtnActive]}
          onPress={() => setShowFilters(v => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="options" size={15} color={showFilters ? Colors.white : Colors.textMuted} />
          <Text style={[styles.filtersBtnText, showFilters && styles.filtersBtnTextActive]}>Filtros</Text>
          {coords && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>
            Raio de busca: <Text style={styles.filterValue}>{radius} km</Text>
          </Text>
          {Platform.OS === 'web' ? (
            <View style={styles.radiusBtns}>
              {RADIUS_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                  onPress={() => setRadius(r)}
                >
                  <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>{r}km</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={20}
              step={1}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
          )}
          <View style={styles.radiusLabels}>
            <Text style={styles.radiusLabelText}>1 km</Text>
            <Text style={styles.radiusLabelText}>20 km</Text>
          </View>
        </View>
      )}
    </>
  );

  // ── Map view ──────────────────────────────────────────────────────────────
  if (view === 'map') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {Toolbar}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <HomeMapView
              establishments={allItems}
              userLat={coords?.lat}
              userLng={coords?.lng}
            />
            <View style={styles.mapCount}>
              <Text style={styles.mapCountText}>{allItems.length} estabelecimento{allItems.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={isLoading ? [] : visibleItems}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <EstablishmentCard
            establishment={item}
            onPress={() => router.push(`/establishment/${item._id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {Toolbar}
            <Text style={styles.sectionTitle}>
              {coords ? `Próximos de você (${allItems.length})` : `Estabelecimentos (${allItems.length})`}
            </Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={56} color={Colors.border} />
              <Text style={styles.emptyTitle}>Nenhum estabelecimento</Text>
              <Text style={styles.emptySubtitle}>Tente mudar a categoria ou aumentar o raio</Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setVisibleCount(c => c + PAGE_SIZE)}>
              <Text style={styles.showMoreText}>Mostrar mais ({allItems.length - visibleCount} restantes)</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchPlaceholder: { color: Colors.textLight, fontSize: 14, fontWeight: '500', flex: 1 },
  locationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFBEB', padding: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  locationText: { fontSize: 12, color: Colors.warning, fontWeight: '600' },

  categories: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 40, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  chipTextActive: { color: Colors.white },

  actionsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 16, paddingBottom: 10,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 40, borderWidth: 1.5, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  toggleBtnActive: { backgroundColor: Colors.primary },
  toggleLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  toggleLabelActive: { color: Colors.white },

  filtersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 40, borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  filtersBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtersBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  filtersBtnTextActive: { color: Colors.white },
  filterDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#10B981', marginLeft: 2,
  },

  filterPanel: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: Colors.white,
    borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border,
    padding: 16, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  filterLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterValue: { color: Colors.primary, fontWeight: '800' },
  slider: { width: '100%', height: 36 },
  radiusBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  radiusBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  radiusBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radiusBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  radiusBtnTextActive: { color: Colors.white },
  radiusLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  radiusLabelText: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },

  mapContainer: { flex: 1, position: 'relative' },
  mapCount: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'white', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
    zIndex: 999,
  },
  mapCountText: { fontSize: 12, fontWeight: '700', color: Colors.text },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.text,
    letterSpacing: -0.3, marginBottom: 14, paddingHorizontal: 16, marginTop: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },

  showMoreBtn: {
    margin: 16, padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', backgroundColor: Colors.white,
  },
  showMoreText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, fontWeight: '500', textAlign: 'center' },
});
