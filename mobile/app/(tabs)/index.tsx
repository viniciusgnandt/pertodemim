import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/axios';
import { Colors } from '../../src/constants/colors';
import EstablishmentCard from '../../src/components/EstablishmentCard';

const CATEGORIES = [
  { label: 'Todos', value: '' },
  { label: '🛒 Mercado', value: 'supermarket' },
  { label: '💊 Farmácia', value: 'pharmacy' },
  { label: '🥖 Padaria', value: 'bakery' },
  { label: '🍽️ Restaurante', value: 'restaurant' },
  { label: '🐾 Pet Shop', value: 'petshop' },
  { label: '📱 Eletrônicos', value: 'electronics' },
  { label: '🏬 Outros', value: 'other' },
];

interface Coords { lat: number; lng: number }

export default function HomeScreen() {
  const router = useRouter();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [category, setCategory] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError(true); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['establishments', 'nearby', coords, category],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '20' };
      if (coords) { params.lat = String(coords.lat); params.lng = String(coords.lng); }
      if (category) params.category = category;
      const { data } = await api.get('/establishments', { params });
      return data.establishments as any[];
    },
  });

  const ListHeader = (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
          <Ionicons name="search" size={16} color={Colors.textLight} />
          <Text style={styles.searchPlaceholder}>Buscar estabelecimentos...</Text>
        </TouchableOpacity>
        {locationError && (
          <View style={styles.locationBanner}>
            <Ionicons name="location-outline" size={14} color={Colors.warning} />
            <Text style={styles.locationText}>Localização desativada</Text>
          </View>
        )}
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => {
          const active = category === item.value;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategory(item.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={styles.sectionTitle}>
        {coords ? 'Próximos de você' : 'Estabelecimentos'}
      </Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={isLoading ? [] : (data || [])}
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
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={56} color={Colors.border} />
              <Text style={styles.emptyTitle}>Nenhum estabelecimento</Text>
              <Text style={styles.emptySubtitle}>Tente mudar a categoria ou o raio de busca</Text>
            </View>
          )
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
    borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
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

  categoriesRow: { flexGrow: 0 },
  categories: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 40, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  chipTextActive: { color: Colors.white },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.text,
    letterSpacing: -0.3, marginBottom: 14, paddingHorizontal: 16, marginTop: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, fontWeight: '500', textAlign: 'center' },
});
