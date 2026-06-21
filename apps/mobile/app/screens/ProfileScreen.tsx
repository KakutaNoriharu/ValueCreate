import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Post, User } from '../../types';
import type { RootStackParamList } from '../navigation/types';
import CharacterAvatar from '../../components/CharacterAvatar';

interface BadgeDef {
  key: string;
  label: string;
  icon: string;
  days: number;
}

const STREAK_BADGES: BadgeDef[] = [
  { key: 'week1', label: '1週間の猛者', icon: '🎉', days: 7 },
  { key: 'day30', label: '悟りの境地', icon: '🏅', days: 30 },
  { key: 'day60', label: '無敵モード', icon: '🔥', days: 60 },
  { key: 'day100', label: '伝説のサボリスト', icon: '👑', days: 100 },
];

const STAGE_LABELS: Record<string, string> = {
  pure: '純粋な魂',
  ghost: 'スーツの亡霊',
  slave: 'マイナビの奴隷',
  zombie: 'ガクチカゾンビ',
  banned: '社畜の卵（出禁）',
};

const STAGE_MAX: Record<string, number> = {
  pure: 10,
  ghost: 35,
  slave: 100,
  zombie: 200,
  banned: 200,
};

function streakTitle(days: number): string {
  if (days >= 100) return '伝説のサボリスト';
  if (days >= 60) return '無敵モード';
  if (days >= 30) return '悟りの境地';
  if (days >= 7) return '1週間の猛者';
  if (days >= 3) return '準備運動中';
  return '様子見中';
}

function nextStreakMilestone(days: number): number {
  for (const m of [7, 30, 60, 100]) {
    if (days < m) return m;
  }
  return 100;
}

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [user, setLocalUser] = useState<User | null>(storedUser);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(!storedUser);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [profile, posts] = await Promise.all([
        api.get<User>('/api/users/me'),
        api.get<Post[]>('/api/users/me/posts?limit=3'),
      ]);
      setLocalUser(profile);
      setUser(profile);
      setRecentPosts(posts);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isUniversity = user.auth_type === 'university';
  const contaminPct = Math.min(1, user.contamination_pt / (STAGE_MAX[user.character_stage] ?? 200));
  const nextMilestone = nextStreakMilestone(user.streak_days);
  const streakPct = Math.min(1, user.streak_days / nextMilestone);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.member.profile}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Profile hero */}
      <View style={styles.heroSection}>
        <CharacterAvatar stage={user.character_stage} size={80} />
        <View style={styles.heroInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{user.nickname}</Text>
            <View style={[styles.authBadge, isUniversity ? styles.authBadgeUniversity : styles.authBadgeNormal]}>
              <Text style={styles.authBadgeText}>
                {isUniversity ? '🎓 正規就活生' : '🕵️ 怪しいやつ'}
              </Text>
            </View>
          </View>
          {user.university && user.show_university && (
            <Text style={styles.universityText}>{user.university}{user.faculty ? ` · ${user.faculty}` : ''}</Text>
          )}
          <Text style={styles.stageLabel}>{STAGE_LABELS[user.character_stage]}</Text>
        </View>
      </View>

      {/* 汚染度カード */}
      {isUniversity && (
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statCardTitle}>汚染度</Text>
            <Text style={styles.statCardValue}>{user.contamination_pt}pt</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${contaminPct * 100}%`, backgroundColor: Colors.contamination },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {STAGE_LABELS[user.character_stage]} → 次のステージまで {STAGE_MAX[user.character_stage] - user.contamination_pt}pt
          </Text>
        </View>
      )}

      {/* No-ES Streak カード */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>No-ES Streak 🔥</Text>
          <Text style={styles.statCardValue}>{user.streak_days}日</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${streakPct * 100}%`, backgroundColor: Colors.survival },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {streakTitle(user.streak_days)}
          {user.streak_days < 100 ? ` · 次の称号まで ${nextMilestone - user.streak_days}日` : ' · 殿堂入り'}
        </Text>
      </View>

      {/* 勲章バッジ */}
      {isUniversity && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>勲章</Text>
          <View style={styles.badgeGrid}>
            {STREAK_BADGES.map((badge) => {
              const earned = user.streak_days >= badge.days;
              return (
                <View key={badge.key} style={[styles.badgeItem, !earned && styles.badgeItemLocked]}>
                  <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>
                    {earned ? badge.icon : '🔒'}
                  </Text>
                  <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>
                    {badge.label}
                  </Text>
                  <Text style={styles.badgeDays}>{badge.days}日</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 最近の投稿 */}
      {recentPosts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近の投稿</Text>
          {recentPosts.map((post) => (
            <View key={post.post_id} style={styles.miniPost}>
              <Text style={styles.miniPostContent} numberOfLines={2}>{post.content}</Text>
              <Text style={styles.miniPostDate}>
                {new Date(post.created_at).toLocaleDateString('ja-JP')}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: Colors.onPrimary },
  settingsBtn: { padding: 4 },
  settingsIcon: { fontSize: 22 },
  heroSection: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  nickname: { fontSize: 20, fontWeight: 'bold', color: Colors.onPrimary },
  authBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  authBadgeUniversity: { backgroundColor: 'rgba(29,158,117,0.3)' },
  authBadgeNormal: { backgroundColor: 'rgba(136,135,128,0.3)' },
  authBadgeText: { fontSize: 11, color: Colors.onPrimary, fontWeight: '600' },
  universityText: { fontSize: 13, color: Colors.muted },
  stageLabel: { fontSize: 13, color: Colors.muted, fontStyle: 'italic' },
  statCard: {
    backgroundColor: Colors.white,
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statCardTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  statCardValue: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 12, color: Colors.muted },
  section: { margin: 12, marginBottom: 0 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    width: '47%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeItemLocked: { opacity: 0.5, borderStyle: 'dashed' },
  badgeIcon: { fontSize: 28 },
  badgeIconLocked: { fontSize: 22 },
  badgeLabel: { fontSize: 12, fontWeight: '600', color: Colors.primary, textAlign: 'center' },
  badgeLabelLocked: { color: Colors.muted },
  badgeDays: { fontSize: 11, color: Colors.muted },
  miniPost: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniPostContent: { flex: 1, fontSize: 13, color: Colors.primary, lineHeight: 18 },
  miniPostDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
});
