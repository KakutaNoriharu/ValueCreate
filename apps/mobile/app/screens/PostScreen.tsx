import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { usePostStore } from '../../stores/postStore';
import type { Post } from '../../types';
import CharacterAvatar from '../../components/CharacterAvatar';
import type { MainTabScreenProps } from '../navigation/types';

type PostTab = 'normal' | 'daily' | 'contamination';

const CONTAMINATION_ACTIONS = [
  { key: 'es', label: 'ES提出', points: 10 },
  { key: 'briefing', label: '説明会参加', points: 5 },
  { key: 'internship_short', label: 'インターン（短期）', points: 20 },
  { key: 'internship_long', label: 'インターン（長期）', points: 50 },
  { key: 'ob_visit', label: 'OB/OG訪問', points: 15 },
  { key: 'spi', label: 'SPIの勉強', points: 8 },
  { key: 'suit', label: 'スーツ購入', points: 30 },
  { key: 'naitei', label: '内定獲得（即追放）', points: 0 },
] as const;

export default function PostScreen({ navigation }: MainTabScreenProps<'Post'>) {
  const user = useAuthStore((s) => s.user);
  const { prependPost } = usePostStore();
  const isNormal = user?.auth_type === 'normal';
  const isUniversity = user?.auth_type === 'university';

  const [activeTab, setActiveTab] = useState<PostTab>('normal');
  const [content, setContent] = useState('');
  const [dailySkip, setDailySkip] = useState('');
  const [dailyInstead, setDailyInstead] = useState('');
  const [dailyComment, setDailyComment] = useState('');
  const [didJobHunt, setDidJobHunt] = useState<boolean | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const MAX = 140;
  const remaining = MAX - content.length;

  function handleClose() {
    navigation.navigate('Home');
  }

  async function handleSubmit() {
    if (!content.trim() && activeTab !== 'contamination') {
      Alert.alert('エラー', '内容を入力してください');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'contamination' && selectedAction) {
        await api.post('/api/contamination/report', { action_type: selectedAction });
      }

      if (activeTab !== 'contamination' || content.trim()) {
        const body: Record<string, unknown> = {
          content: content.trim() || '汚染申告しました',
          post_type: activeTab === 'daily' ? 'daily' : 'normal',
        };
        if (activeTab === 'daily') {
          body.daily_skip = dailySkip.trim() || undefined;
          body.daily_instead = dailyInstead.trim() || undefined;
          body.daily_comment = dailyComment.trim() || undefined;
        }
        const post = await api.post<Post>('/api/posts', body);
        prependPost(post);
      }

      setContent('');
      setDailySkip('');
      setDailyInstead('');
      setDailyComment('');
      setDidJobHunt(null);
      setSelectedAction(null);
      navigation.navigate('Home');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '投稿に失敗しました';
      Alert.alert('エラー', msg);
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: PostTab; label: string }[] = [
    { key: 'normal', label: '通常投稿' },
    { key: 'daily', label: 'デイリー' },
    ...(isUniversity ? [{ key: 'contamination' as PostTab, label: '汚染申告' }] : []),
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>記録＆投稿</Text>
        <TouchableOpacity
          style={[styles.postBtn, loading && styles.postBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.postBtnText}>{loading ? '…' : '投稿'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab selector */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {/* User info row */}
        <View style={styles.userRow}>
          <CharacterAvatar stage={user?.character_stage ?? 'pure'} size={44} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.nickname}</Text>
            <Text style={styles.userMeta}>
              {user?.auth_type === 'university' ? '🎓 正規就活生' : '🕵️ 怪しいやつ'}
              {user?.streak_days ? `　🔥 ${user.streak_days}日連続サボり中` : ''}
            </Text>
          </View>
        </View>

        {/* Normal / Daily: text input */}
        {activeTab !== 'contamination' && (
          <>
            <TextInput
              style={styles.textInput}
              placeholder={
                activeTab === 'daily'
                  ? '📋 今日のサボり報告を書こう…'
                  : '今日も就活しなかった理由…（最大140文字）'
              }
              placeholderTextColor={Colors.muted}
              value={content}
              onChangeText={(t) => setContent(t.slice(0, MAX))}
              multiline
              maxLength={MAX}
              autoFocus
            />
            <Text style={[styles.charCount, remaining <= 20 && styles.charCountWarn]}>
              {remaining}
            </Text>
          </>
        )}

        {/* Daily extra fields */}
        {activeTab === 'daily' && (
          <View style={styles.dailySection}>
            <Text style={styles.dailySectionTitle}>📋 今日のサボり報告</Text>
            <TextInput
              style={styles.subInput}
              placeholder="スキップした就活行動（例：説明会3社）"
              placeholderTextColor={Colors.muted}
              value={dailySkip}
              onChangeText={setDailySkip}
            />
            <TextInput
              style={styles.subInput}
              placeholder="代わりにやったこと（例：Netflix4時間）"
              placeholderTextColor={Colors.muted}
              value={dailyInstead}
              onChangeText={setDailyInstead}
            />
            <TextInput
              style={styles.subInput}
              placeholder="一言（例：後悔はない）"
              placeholderTextColor={Colors.muted}
              value={dailyComment}
              onChangeText={setDailyComment}
            />
          </View>
        )}

        {/* Activity selector for normal/daily tabs */}
        {activeTab !== 'contamination' && isUniversity && (
          <View style={styles.activitySection}>
            <Text style={styles.activityLabel}>今日は就活しましたか？</Text>
            <View style={styles.activityRow}>
              <TouchableOpacity
                style={[styles.activityBtn, didJobHunt === false && styles.activityBtnSafe]}
                onPress={() => setDidJobHunt(false)}
              >
                <Text style={styles.activityBtnText}>してない（セーフ）</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.activityBtn, didJobHunt === true && styles.activityBtnDanger]}
                onPress={() => { setDidJobHunt(true); setActiveTab('contamination'); }}
              >
                <Text style={styles.activityBtnText}>した（汚染申告）</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contamination tab */}
        {activeTab === 'contamination' && (
          <View style={styles.contamSection}>
            <Text style={styles.contamTitle}>⚠️ 汚染申告</Text>
            <Text style={styles.contamSub}>やってしまった就活行動を正直に報告してください</Text>
            {CONTAMINATION_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.actionItem,
                  selectedAction === action.key && styles.actionItemSelected,
                ]}
                onPress={() => setSelectedAction(action.key)}
              >
                <Text style={styles.actionLabel}>{action.label}</Text>
                {action.points > 0 ? (
                  <Text style={styles.actionPoints}>+{action.points}pt</Text>
                ) : (
                  <Text style={[styles.actionPoints, { color: Colors.contamination }]}>即追放</Text>
                )}
              </TouchableOpacity>
            ))}
            {selectedAction && (
              <TextInput
                style={[styles.textInput, { marginTop: 12 }]}
                placeholder="一言コメント（任意）…"
                placeholderTextColor={Colors.muted}
                value={content}
                onChangeText={(t) => setContent(t.slice(0, MAX))}
                multiline
              />
            )}
          </View>
        )}

        {isNormal && activeTab === 'normal' && (
          <View style={styles.limitNote}>
            <Text style={styles.limitNoteText}>🕵️ 怪しいやつは1日3回まで投稿できます</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: Colors.primary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  postBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
  postBtnText: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.topTabIndicator,
  },
  tabLabel: {
    fontSize: 13,
    color: Colors.topTabInactive,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.topTabActive,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    padding: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  userMeta: {
    fontSize: 12,
    color: Colors.muted,
  },
  textInput: {
    minHeight: 100,
    fontSize: 16,
    color: Colors.primary,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
  charCountWarn: {
    color: Colors.contamination,
    fontWeight: '700',
  },
  dailySection: {
    gap: 10,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
  },
  dailySectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  subInput: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.primary,
  },
  activitySection: {
    marginTop: 20,
    gap: 10,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  activityBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  activityBtnSafe: {
    borderColor: Colors.survival,
    backgroundColor: 'rgba(29,158,117,0.08)',
  },
  activityBtnDanger: {
    borderColor: Colors.contamination,
    backgroundColor: 'rgba(226,75,74,0.08)',
  },
  activityBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  contamSection: {
    gap: 10,
  },
  contamTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.contamination,
  },
  contamSub: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionItemSelected: {
    borderColor: Colors.contamination,
    backgroundColor: 'rgba(226,75,74,0.06)',
  },
  actionLabel: {
    fontSize: 14,
    color: Colors.primary,
  },
  actionPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.warning,
  },
  limitNote: {
    marginTop: 16,
    backgroundColor: 'rgba(136,135,128,0.1)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  limitNoteText: {
    fontSize: 12,
    color: Colors.muted,
  },
});
