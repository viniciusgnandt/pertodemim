import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';

function MenuItem({ icon, label, sublabel, color = Colors.primary, bg = '#FFF3EE', onPress, danger = false }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? Colors.errorBg : bg }]}>
        <Ionicons name={icon} size={20} color={danger ? Colors.error : color} />
      </View>
      <View style={styles.menuMeta}>
        <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={danger ? Colors.error : Colors.textLight} style={{ opacity: 0.6 }} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user) {
    return (
      <SafeAreaView style={styles.guestContainer}>
        <View style={styles.guestIllustration}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.border} />
        </View>
        <Text style={styles.guestTitle}>Olá, bem-vindo!</Text>
        <Text style={styles.guestSubtitle}>Entre na sua conta para salvar favoritos e avaliar estabelecimentos</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Entrar na conta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerBtnText}>Criar conta grátis</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive', onPress: async () => {
          await logout();
          Toast.show({ type: 'success', text1: 'Até logo!' });
        }
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{user.name[0].toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Consumidor</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minha conta</Text>
        <View style={styles.card}>
          <MenuItem
            icon="heart"
            label="Meus Favoritos"
            sublabel="Ver estabelecimentos salvos"
            color={Colors.error}
            bg={Colors.errorBg}
            onPress={() => router.push('/(tabs)/favorites')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="star"
            label="Minhas Avaliações"
            sublabel="Ver avaliações feitas"
            color="#F59E0B"
            bg="#FFFBEB"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <MenuItem
            icon="log-out-outline"
            label="Sair da conta"
            sublabel="Encerrar sessão"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 48 },

  guestContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 12, backgroundColor: Colors.white,
  },
  guestIllustration: { marginBottom: 8 },
  guestTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  guestSubtitle: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, fontWeight: '500', marginBottom: 8 },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingVertical: 15, width: '100%', alignItems: 'center',
    shadowColor: Colors.shadowPrimary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 6,
  },
  loginBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  registerBtn: {
    borderRadius: 16, paddingVertical: 15,
    width: '100%', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  registerBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 16 },

  header: {
    alignItems: 'center', padding: 32,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    marginBottom: 20,
    gap: 6,
  },
  avatarWrapper: { marginBottom: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.shadowPrimary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1, shadowRadius: 20, elevation: 8,
  },
  avatarLetter: { color: Colors.white, fontSize: 34, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  email: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  badge: {
    backgroundColor: 'rgba(255,90,31,0.08)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,90,31,0.2)',
    paddingHorizontal: 14, paddingVertical: 5, marginTop: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginLeft: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 64 },

  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuMeta: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  menuSublabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', marginTop: 1 },
});
