import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, SectionList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/axios';
import { Colors } from '../../src/constants/colors';
import EstablishmentCard from '../../src/components/EstablishmentCard';

const CATEGORIES = ['Todos', 'Supermercado', 'Farmácia', 'Padaria', 'Restaurante', 'Pet Shop', 'Eletrônicos', 'Outros'];
const CATEGORY_MAP: Record<string, string> = {
  'Todos': '', 'Supermercado': 'supermarket', 'Farmácia': 'pharmacy',
  'Padaria': 'bakery', 'Restaurante': 'restaurant', 'Pet Shop': 'petshop',
  'Eletrônicos': 'electronics', 'Outros': 'other',
};

const CATEGORY_LABELS: Record<string, string> = {
  supermarket: 'Supermercado', pharmacy: 'Farmácia', bakery: 'Padaria',
  butcher: 'Açougue', restaurant: 'Restaurante', convenience: 'Conveniência',
  petshop: 'Pet Shop', electronics: 'Eletrônicos', clothing: 'Vestuário', other: 'Outros',
};

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q || '');
  const [search, setSearch] = useState(params.q || '');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
      setSearch(params.q);
    }
  }, [params.q]);

  // Product search (when there's a text query)
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['products', 'search', search, category],
    queryFn: async () => {
      const params: Record<string, string> = { q: search, limit: '50' };
      if (category) params.category = category;
      const { data } = await api.get('/products/search', { params });
      return data.products as any[];
    },
    enabled: search.length > 1,
  });

  // Establishment search (category filter or text search)
  const { data: estData, isLoading: estLoading } = useQuery({
    queryKey: ['establishments', 'search', search, category],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '30' };
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get('/establishments', { params });
      return data.establishments as any[];
    },
    enabled: !!category || search.length > 1,
  });

  const isLoading = productLoading || estLoading;
  const hasSearch = search.length > 1 || !!category;

  // Group products by establishment
  const groupedProducts = (productData || []).reduce((acc: any, p: any) => {
    const est = p.establishmentId;
    if (!est) return acc;
    const key = typeof est === 'object' ? est._id : est;
    const name = typeof est === 'object' ? est.name : 'Estabelecimento';
    if (!acc[key]) acc[key] = { key, title: name, est, data: [] };
    acc[key].data.push(p);
    return acc;
  }, {} as Record<string, any>);

  const sections = Object.values(groupedProducts) as any[];
  const totalProducts = productData?.length ?? 0;

  const handleSearch = () => setSearch(query.trim());

  const SearchHeader = (
    <>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={18} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Buscar produtos ou estabelecimentos..."
            placeholderTextColor={Colors.textLight}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSearch(''); }} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        {query.trim().length > 0 && (
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
            <Text style={styles.searchBtnText}>Buscar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        style={styles.categoriesRow}
        renderItem={({ item }) => {
          const val = CATEGORY_MAP[item] ?? '';
          const active = category === val;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategory(val)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </>
  );

  // Category-only search: show EstablishmentCards
  if (!search && !!category) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <FlatList
          data={isLoading ? [] : (estData || [])}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <EstablishmentCard
              establishment={item}
              onPress={() => router.push(`/establishment/${item._id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {SearchHeader}
              {!isLoading && estData && (
                <Text style={styles.resultsCount}>
                  {estData.length} estabelecimento{estData.length !== 1 ? 's' : ''}
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator style={{ marginTop: 48 }} size="large" color={Colors.primary} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={56} color={Colors.border} />
                <Text style={styles.emptyTitle}>Nenhum resultado</Text>
                <Text style={styles.emptySubtitle}>Tente outro termo ou categoria</Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    );
  }

  // Product search: show grouped by establishment
  if (search.length > 1) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <SectionList
          sections={sections}
          keyExtractor={(item, i) => item._id || String(i)}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => router.push(`/establishment/${section.key}`)}
              activeOpacity={0.8}
            >
              <View style={styles.sectionHeaderInner}>
                <Ionicons name="storefront-outline" size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle} numberOfLines={1}>{section.title}</Text>
                {section.est?.address?.neighborhood && (
                  <Text style={styles.sectionNeighborhood}>{section.est.address.neighborhood}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productItem}
              onPress={() => router.push(`/establishment/${typeof item.establishmentId === 'object' ? item.establishmentId._id : item.establishmentId}`)}
              activeOpacity={0.85}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.productDesc} numberOfLines={1}>{item.description}</Text>
                ) : null}
                {item.category ? (
                  <Text style={styles.productCat}>{item.category}</Text>
                ) : null}
              </View>
              <Text style={styles.productPrice}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.sectionList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {SearchHeader}
              {!isLoading && (estData || []).length > 0 && (
                <>
                  <Text style={styles.resultsCount}>
                    {(estData || []).length} estabelecimento{(estData || []).length !== 1 ? 's' : ''}
                  </Text>
                  {(estData || []).map((item: any) => (
                    <View key={item._id} style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                      <EstablishmentCard
                        establishment={item}
                        onPress={() => router.push(`/establishment/${item._id}`)}
                      />
                    </View>
                  ))}
                </>
              )}
              {!isLoading && totalProducts > 0 && (
                <Text style={[styles.resultsCount, { marginTop: 8 }]}>
                  {totalProducts} produto{totalProducts !== 1 ? 's' : ''} em {sections.length} estabelecimento{sections.length !== 1 ? 's' : ''}
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator style={{ marginTop: 48 }} size="large" color={Colors.primary} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={56} color={Colors.border} />
                <Text style={styles.emptyTitle}>Nenhum resultado</Text>
                <Text style={styles.emptySubtitle}>Tente outro termo ou categoria</Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    );
  }

  // Hint state
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {SearchHeader}
      <View style={styles.hint}>
        <Ionicons name="compass-outline" size={64} color={Colors.border} />
        <Text style={styles.hintTitle}>Descubra perto de você</Text>
        <Text style={styles.hintSubtitle}>Digite o nome de um produto, estabelecimento ou selecione uma categoria</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchIcon: { marginRight: 4 },
  input: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 12, color: Colors.text },
  clearBtn: { padding: 4 },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingHorizontal: 18, justifyContent: 'center',
    shadowColor: Colors.shadowPrimary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
  searchBtnText: { color: Colors.white, fontWeight: '800', fontSize: 14 },

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

  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14, paddingTop: 8 },
  sectionList: { paddingBottom: 32 },

  resultsCount: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 4, paddingHorizontal: 16 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16, paddingVertical: 12,
    marginTop: 12,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
  },
  sectionHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, flex: 1 },
  sectionNeighborhood: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },

  productItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  productInfo: { flex: 1, gap: 2, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  productDesc: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  productCat: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  productPrice: { fontSize: 16, fontWeight: '800', color: Colors.primary },

  empty: { alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },

  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  hintTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: -0.3, textAlign: 'center' },
  hintSubtitle: { fontSize: 14, color: Colors.textMuted, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
});
