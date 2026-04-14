import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/axios';
import { Colors } from '../../src/constants/colors';
import EstablishmentCard from '../../src/components/EstablishmentCard';
import { useAuthStore } from '../../src/store/authStore';

export default function FavoritesScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await api.get('/favorites');
      return data.favorites as any[];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="heart-outline" size={64} color={Colors.border} />
        <Text style={styles.title}>Seus favoritos</Text>
        <Text style={styles.subtitle}>Entre na sua conta para salvar estabelecimentos favoritos</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={Colors.primary} />
      ) : (
        <FlatList
          data={data || []}
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
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={36} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
              <Text style={styles.emptySubtitle}>Toque no coração nos estabelecimentos para salvar aqui</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: Colors.white },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32, gap: 14 },
  empty: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 32, gap: 10 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: 'rgba(255,90,31,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
});
