import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import type { Post } from '../types';
import CharacterAvatar from './CharacterAvatar';

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
  // v13: リアクションは「わかる」の1種のみ
  onReact: (postId: string) => void;
  onSendComment?: (postId: string, content: string, isTemplate: boolean) => void;
  onPressUser?: (userId: string) => void;
}

export default function PostCard({ post, onReact, onSendComment, onPressUser }: Props) {
  const user = post.user ?? null;
  const contaminationPt = user?.contamination_pt ?? 0;
  const [commentOpen, setCommentOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const isElimination = post.post_type === 'elimination';
  // SPEC v13: 15pt以上で⚠️汚染注意バッジ / 35pt以上で🚨バナー
  const isHighContam = contaminationPt >= 35;
  const isMidContam = contaminationPt >= 15 && contaminationPt < 35;

  const wakaruCount = post.reactions.find((r) => r.reaction_type === 'wakaru')?.count ?? 0;
  const isReacted = post.my_reaction === 'wakaru';

  function handleSend(content: string, isTemplate: boolean) {
    const text = content.trim();
    if (!text || !onSendComment) return;
    onSendComment(post.post_id, text, isTemplate);
    setDraft('');
  }

  if (isElimination) {
    return (
      <View style={styles.obituaryCard}>
        <Text style={styles.obituaryTitle}>━━━━ 訃　報 ━━━━</Text>
        <Text style={styles.obituaryContent}>{post.content}</Text>
        <TouchableOpacity onPress={() => user && onPressUser?.(user.user_id)}>
          <Text style={styles.obituaryUser}>
            @{user?.nickname ?? '名無し'} ・ {timeAgo(post.created_at)}
          </Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          onPress={() => user && onPressUser?.(user.user_id)}
          disabled={!user}
        >
          <CharacterAvatar stage={user?.character_stage ?? 'pure'} size={42} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <TouchableOpacity
              onPress={() => user && onPressUser?.(user.user_id)}
              disabled={!user}
            >
              <Text style={styles.nickname}>{user?.nickname ?? '名無し'}</Text>
            </TouchableOpacity>
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.reactionBtn, isReacted && styles.reactionBtnActive]}
          onPress={() => onReact(post.post_id)}
        >
          <Text style={[styles.reactionLabel, isReacted && styles.reactionLabelActive]}>
            {Strings.reaction.wakaru} {wakaruCount > 0 ? wakaruCount : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.commentToggle}
          onPress={() => setCommentOpen((v) => !v)}
        >
          <Text style={styles.commentToggleText}>
            💬 {post.comment_count > 0 ? post.comment_count : 'コメント'}
          </Text>
        </TouchableOpacity>
      </View>

      {commentOpen && onSendComment && (
        <View style={styles.commentArea}>
          {/* テンプレコメント横スクロール */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateBar}
          >
            {Strings.templateComments.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.templateChip}
                onPress={() => handleSend(t, true)}
              >
                <Text style={styles.templateChipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* フリーテキストコメント */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="コメントを書く…"
              placeholderTextColor={Colors.muted}
              value={draft}
              onChangeText={setDraft}
              maxLength={140}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSend(draft, false)}
              disabled={!draft.trim()}
            >
              <Text style={styles.sendBtnText}>送信</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  reactionBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.background,
  },
  reactionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  reactionLabel: {
    fontSize: 13,
    color: Colors.primary,
  },
  reactionLabelActive: {
    color: Colors.onPrimary,
  },
  commentToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentToggleText: {
    fontSize: 13,
    color: Colors.muted,
  },
  commentArea: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  templateBar: {
    gap: 8,
    paddingVertical: 2,
  },
  templateChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
  },
  templateChipText: {
    fontSize: 12,
    color: Colors.primary,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.primary,
    backgroundColor: Colors.background,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: Colors.onPrimary,
    fontSize: 13,
    fontWeight: '600',
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
