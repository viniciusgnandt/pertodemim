import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  establishment: any;
  onPress: () => void;
}

function formatDistance(meters: number | null) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function isOpenNow(businessHours: any[]): boolean | null {
  if (!businessHours?.length) return null;
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const now = new Date();
  const day = businessHours.find(h => h.day === days[now.getDay()]);
  if (!day || day.closed) return false;
  const [oh, om] = day.open.split(':').map(Number);
  const [ch, cm] = day.close.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= oh * 60 + om && cur < ch * 60 + cm;
}

const CATEGORY_ICONS: Record<string, string> = {
  supermarket: '🛒', pharmacy: '💊', bakery: '🥖', butcher: '🥩',
  restaurant: '🍽️', convenience: '🏪', petshop: '🐾', electronics: '📱',
  clothing: '👔', other: '🏬',
};

const CATEGORY_LABELS: Record<string, string> = {
  supermarket: 'Supermercado', pharmacy: 'Farmácia', bakery: 'Padaria',
  butcher: 'Açougue', restaurant: 'Restaurante', convenience: 'Conveniência',
  petshop: 'Pet Shop', electronics: 'Eletrônicos', clothing: 'Vestuário', other: 'Outros',
};

export default function EstablishmentCard({ establishment: est, onPress }: Props) {
  const photo = est.photos?.[0] || est.coverImage;
  const distance = formatDistance(est.distance);
  const open = isOpenNow(est.businessHours);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.imageWrapper}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.emoji}>{CATEGORY_ICONS[est.category] || '🏬'}</Text>
          </View>
        )}

        <View style={styles.imageOverlay} />

        {est.isSponsored && (
          <View style={styles.sponsoredBadge}>
            <Ionicons name="flash" size={10} color="white" />
            <Text style={styles.sponsoredText}>Destaque</Text>
          </View>
        )}

        {open !== null && (
          <View style={[styles.statusBadge, open ? styles.statusOpen : styles.statusClosed]}>
            <Text style={[styles.statusText, open ? styles.statusTextOpen : styles.statusTextClosed]}>
              {open ? '● Aberto' : '● Fechado'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{est.name}</Text>
          {distance && (
            <View style={styles.distanceBadge}>
              <Ionicons name="location" size={11} color={Colors.primary} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {CATEGORY_ICONS[est.category] || '🏬'} {CATEGORY_LABELS[est.category] || est.category}
          </Text>
        </View>

        {est.address?.street && (
          <View style={styles.addressRow}>
            <Ionicons name="map-outline" size={12} color={Colors.textLight} />
            <Text style={styles.address} numberOfLines={1}>
              {est.address.street}{est.address.neighborhood ? `, ${est.address.neighborhood}` : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', height: 170 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3EE' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'transparent' },
  emoji: { fontSize: 52 },
  sponsoredBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    shadowColor: Colors.shadowPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  sponsoredText: { color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  statusBadge: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  statusOpen: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  statusClosed: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusTextOpen: { color: '#065F46' },
  statusTextClosed: { color: '#991B1B' },
  info: { padding: 16, gap: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: Colors.text, flex: 1, letterSpacing: -0.3 },
  distanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,90,31,0.08)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  distanceText: { fontSize: 11, color: Colors.primary, fontWeight: '800' },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  address: { fontSize: 12, color: Colors.textLight, fontWeight: '500', flex: 1 },
});
