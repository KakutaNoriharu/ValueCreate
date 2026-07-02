import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';
import type { CharacterStage, Post } from '../../types';
import type { RootStackScreenProps } from '../navigation/types';
import CharacterAvatar from '../../components/CharacterAvatar';
import { getStageDef } from '../../constants/characterStages';

// P-07 他メンバー手帳（読み取り専用プロフィール）
interface MemberProfile {
  user_id: string;
  nickname: string;
  character_stage: CharacterStage;
  contamination_pt: number | null;
  show_contamination: boolean;
  streak_days: number;
  is_banned: boolean;
  university: string | null;
  faculty: string | null;
  created_at: string;
}

export default function OtherMemberScreen({ route }: RootStackScreenProps<'OtherMember'>) {
  const { userId } = route.params;
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [m, p] = await Promise.all([
          api.get<MemberProfile>(`/api/users/${userId}`),
          api.get<Post[]>(`/api/users/${userId}/posts?limit=10`),
        ]);
        setMember(m);
        setPosts(p);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>メンバーが見つかりません</Text>
      </View>
    );
  }

  const stageDef = getStageDef(member.character_stage);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <CharacterAvatar stage={member.character_stage} size={80} />
        <View style={styles.heroInfo}>
          <Text style={styles.nickname}>
            {member.is_banned ? '👼 ' : ''}{member.nickname}
          </Text>
          {member.university && (
            <Text style={styles.university}>
              {member.university}{member.faculty ? ` · ${member.faculty}` : ''}
            </Text>
          )}
          <View style={styles.stageRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv.{stageDef.level} / 8</Text>
            </View>
            <Text style={styles.stageLabel}>{stageDef.icon} {stageDef.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {member.show_contamination && member.contamination_pt != null
              ? `${member.contamination_pt}pt`
              : '非公開'}
          </Text>
          <Text style={styles.statLabel}>汚染度</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{member.streak_days}日</Text>
          <Text style={styles.statLabel}>No-ES Streak</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>投稿</Text>
        {posts.length === 0 ? (
          <Text style={styles.empty}>まだ投稿がありません</Text>
        ) : (
          posts.map((post) => (
            <View key={post.post_id} style={styles.postCard}>
              <Text style={styles.postContent}>{post.content}</Text>
              <Text style={styles.postDate}>
                {new Date(post.created_at).toLocaleDateString('ja-JP')}
              </Text>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 14, color: Colors.muted },
  hero: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroInfo: { flex: 1, gap: 6 },
  nickname: { fontSize: 20, fontWeight: 'bold', color: Colors.onPrimary },
  university: { fontSize: 13, color: Colors.muted },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.onPrimary },
  stageLabel: { fontSize: 14, color: Colors.onPrimary, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 12, padding: 12 },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.muted },
  section: { padding: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  empty: { fontSize: 13, color: Colors.muted, textAlign: 'center', paddingVertical: 20 },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  postContent: { fontSize: 14, color: Colors.primary, lineHeight: 20 },
  postDate: { fontSize: 11, color: Colors.muted },
});
