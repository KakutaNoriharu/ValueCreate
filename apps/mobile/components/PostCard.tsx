import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import type { Post, ReactionType } from '../types';
import CharacterAvatar from './CharacterAvatar';

const REACTIONS: { type: ReactionType; label: string }[] = [
  { type: 'wakaru', label: Strings.reaction.wakaru },
  { type: 'toutoi', label: Strings.reaction.toutoi },
  { type: 'kusa', label: Strings.reaction.kusa },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

interface Props {
  post: Post;
  onReact: (postId: string, type: ReactionType) => void;
  isNormal?: boolean;
}

export default function PostCard({ post, onReact, isNormal = false }: Props) {
  const { user, contamination_pt } = post.user
    ? { user: post.user, contamination_pt: post.user.contamination_pt }
    : { user: null, contamination_pt: 0 };

  const isElimination = post.post_type === 'elimination';
  const isHighContam = contamination_pt >= 35;
  const isMidContam = contamination_pt >= 10 && contamination_pt < 35;

  function getReactionCount(type: ReactionType): number {
    return post.reactions.find((r) => r.reaction_type === type)?.count ?? 0;
  }

  if (isElimination) {
    return (
      <View style={styles.obituaryCard}>
        <Text style={styles.obituaryTitle}>━━━━ 訃　報 ━━━━</Text>
        <Text style={styles.obituaryContent}>{post.content}</Text>
        <Text style={styles.obituaryUser}>
          @{user?.nickname ?? '名無し'} ・ {timeAgo(post.created_at)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, isHighContam && styles.cardContaminated]}>
      {isHighContam && (
        <View style={styles.contaminBanner}>
          <Text style={styles.contaminBannerText}>{Strings.contamination.warningHigh}</Text>
        </View>
      )}

      <View style={styles.header}>
        <CharacterAvatar stage={user?.character_stage ?? 'pure'} size={42} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{user?.nickname ?? '名無し'}</Text>
            {user?.auth_type === 'university' && (
              <Text style={styles.badge}>🎓</Text>
            )}
            {isMidContam && (
              <Text style={styles.warnBadge}>{Strings.contamination.warningLow}</Text>
            )}
          </View>
          <Text style={styles.timestamp}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.post_type === 'daily' && (
        <View style={styles.dailyCard}>
          {post.daily_skip ? (
            <Text style={styles.dailyLine}>📋 スキップ：{post.daily_skip}</Text>
          ) : null}
          {post.daily_instead ? (
            <Text style={styles.dailyLine}>🛋️ 代わりに：{post.daily_instead}</Text>
          ) : null}
          {post.daily_comment ? (
            <Text style={styles.dailyLine}>💬 {post.daily_comment}</Text>
          ) : null}
        </View>
      )}

      <View style={styles.reactions}>
        {REACTIONS.map(({ type, label }) => {
          const count = getReactionCount(type);
          const isActive = post.my_reaction === type;
          const disabled = isNormal && type !== 'kusa';
          return (
            <TouchableOpacity
              key={type}
              style={[styles.reactionBtn, isActive && styles.reactionBtnActive, disabled && styles.reactionBtnDisabled]}
              onPress={() => !disabled && onReact(post.post_id, type)}
              disabled={disabled}
            >
              <Text style={[styles.reactionLabel, isActive && styles.reactionLabelActive]}>
                {label} {count > 0 ? count : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 5,
    gap: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContaminated: {
    backgroundColor: Colors.contaminatedCharacter,
    borderWidth: 1,
    borderColor: Colors.contamination,
  },
  contaminBanner: {
    backgroundColor: Colors.contamination,
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  contaminBannerText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  nickname: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  badge: {
    fontSize: 13,
  },
  warnBadge: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.muted,
  },
  content: {
    fontSize: 15,
    color: Colors.primary,
    lineHeight: 22,
  },
  dailyCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  dailyLine: {
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 20,
  },
  reactions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  reactionBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
  },
  reactionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  reactionBtnDisabled: {
    opacity: 0.35,
  },
  reactionLabel: {
    fontSize: 13,
    color: Colors.primary,
  },
  reactionLabelActive: {
    color: Colors.onPrimary,
  },
  obituaryCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 12,
    marginVertical: 5,
    gap: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  obituaryTitle: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    letterSpacing: 2,
  },
  obituaryContent: {
    fontSize: 14,
    color: Colors.onPrimary,
    textAlign: 'center',
    lineHeight: 22,
    textDecorationLine: 'line-through',
    textDecorationColor: '#888',
  },
  obituaryUser: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
  },
});
