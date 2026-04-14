import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../../src/api/axios';
import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import ReviewItem from '../../src/components/ReviewItem';
import StarRating from '../../src/components/StarRating';
import MapView from '../../src/components/MapView';

export default function EstablishmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();

  const [reviewModal, setReviewModal] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');

  const { data: est, isLoading } = useQuery({
    queryKey: ['establishment', id],
    queryFn: async () => {
      const { data } = await api.get(`/establishments/${id}`);
      return data.establishment;
    },
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${id}`);
      return data;
    },
  });

  const { data: favData, refetch: refetchFav } = useQuery({
    queryKey: ['favorite', id],
    queryFn: async () => {
      const { data } = await api.get(`/favorites/check/${id}`);
      return data.isFavorite as boolean;
    },
    enabled: !!user,
  });

  const toggleFavMutation = useMutation({
    mutationFn: async () => {
      if (favData) {
        await api.delete(`/favorites/${id}`);
      } else {
        await api.post(`/favorites/${id}`);
      }
    },
    onSuccess: () => {
      refetchFav();
      qc.invalidateQueries({ queryKey: ['favorites'] });
      Toast.show({ type: 'success', text1: favData ? 'Removido dos favoritos' : 'Adicionado aos favoritos' });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/reviews/${id}`, { rating: myRating, comment: myComment.trim() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', id] });
      setReviewModal(false);
      setMyComment('');
      Toast.show({ type: 'success', text1: 'Avaliação enviada!' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: err?.response?.data?.error || 'Erro ao enviar avaliação' });
    },
  });

  const handleFavorite = () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    toggleFavMutation.mutate();
  };

  const handleReview = () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setReviewModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!est) return null;

  const photo = est.photos?.[0];
  const isFav = favData ?? false;
  const avgRating = reviewsData?.avgRating ?? 0;
  const totalReviews = reviewsData?.total ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero Image */}
        <View style={styles.hero}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="storefront-outline" size={64} color={Colors.white} />
            </View>
          )}
          <TouchableOpacity style={styles.favBtn} onPress={handleFavorite}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={26}
              color={isFav ? Colors.error : Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.name}>{est.name}</Text>
          <Text style={styles.category}>{est.category}</Text>

          {avgRating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={Colors.star} />
              <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({totalReviews} avaliações)</Text>
            </View>
          )}

          {est.description && (
            <Text style={styles.description}>{est.description}</Text>
          )}

          {est.address?.street && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>{est.address.street}, {est.address.city}</Text>
            </View>
          )}

          {est.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>{est.phone}</Text>
            </View>
          )}
        </View>

        {/* Map */}
        {est.location?.coordinates && (
          <View style={styles.mapSection}>
            <MapView
              lat={est.location.coordinates[1]}
              lng={est.location.coordinates[0]}
              name={est.name}
              neighborhood={est.address?.neighborhood}
              category={est.category}
            />
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avaliações</Text>
            <TouchableOpacity style={styles.reviewBtn} onPress={handleReview}>
              <Ionicons name="star-outline" size={16} color={Colors.primary} />
              <Text style={styles.reviewBtnText}>Avaliar</Text>
            </TouchableOpacity>
          </View>

          {(reviewsData?.reviews || []).length === 0 ? (
            <View style={styles.noReviews}>
              <Ionicons name="chatbubble-outline" size={36} color={Colors.border} />
              <Text style={styles.noReviewsText}>Nenhuma avaliação ainda. Seja o primeiro!</Text>
            </View>
          ) : (
            reviewsData.reviews.map((r: any) => <ReviewItem key={r._id} review={r} />)
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avaliar {est.name}</Text>

            <StarRating rating={myRating} onRate={setMyRating} size={36} />

            <TextInput
              style={styles.commentInput}
              placeholder="Deixe um comentário (opcional)"
              value={myComment}
              onChangeText={setMyComment}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReviewModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitReviewMutation.isPending && styles.btnDisabled]}
                onPress={() => submitReviewMutation.mutate()}
                disabled={submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.submitBtnText}>Enviar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  favBtn: {
    position: 'absolute', top: 56, right: 16,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 24, padding: 10,
  },
  card: { backgroundColor: Colors.white, padding: 20, marginBottom: 12 },
  name: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  category: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  ratingText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  ratingCount: { fontSize: 13, color: Colors.textMuted },
  description: { fontSize: 15, color: Colors.textMuted, lineHeight: 22, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, color: Colors.text, flex: 1 },
  mapSection: { paddingHorizontal: 16, paddingBottom: 4 },
  section: { backgroundColor: Colors.white, padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  reviewBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  noReviews: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  noReviewsText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  commentInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    padding: 12, fontSize: 15, color: Colors.text, minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textMuted },
  submitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
