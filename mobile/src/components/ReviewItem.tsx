import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../constants/colors';
import StarRating from './StarRating';

interface Props {
  review: {
    _id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    userId: { name: string; avatar?: string };
  };
}

export default function ReviewItem({ review }: Props) {
  const date = new Date(review.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const initial = review.userId?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {review.userId?.avatar ? (
            <Image source={{ uri: review.userId.avatar }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Text style={styles.avatarLetter}>{initial}</Text>
          )}
        </View>
        <View style={styles.meta}>
          <Text style={styles.name}>{review.userId?.name}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <StarRating rating={review.rating} size={14} />
      </View>
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  meta: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  date: { fontSize: 12, color: Colors.textMuted },
  comment: { fontSize: 14, color: Colors.text, lineHeight: 20, marginBottom: 12 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
});
