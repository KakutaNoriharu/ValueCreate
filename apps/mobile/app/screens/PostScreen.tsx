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

type PostTab = 'normal' | 'contamination';

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

  const [activeTab, setActiveTab] = useState<PostTab>('normal');
  const [content, setContent] = useState('');
  const [dailyEnabled, setDailyEnabled] = useState(false); // 通常投稿内のデイリーフォーマットトグル
  const [dailySkip, setDailySkip] = useState('');
  const [dailyInstead, setDailyInstead] = useState('');
  const [dailyComment, setDailyComment] = useState('');
  const [alsoPost, setAlsoPost] = useState(false); // 汚染申告: タイムラインにも投稿する（OFF=記録のみ=経路A）
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const MAX = 140;
  const remaining = MAX - content.length;

  function handleClose() {
    navigation.navigate('Home');
  }

  function resetForm() {
    setContent('');
    setDailyEnabled(false);
    setDailySkip('');
    setDailyInstead('');
    setDailyComment('');
    setAlsoPost(false);
    setSelectedAction(null);
  }

  async function handleSubmit() {
    if (activeTab === 'normal' && !content.trim()) {
      Alert.alert('エラー', '内容を入力してください');
      return;
    }
    if (activeTab === 'contamination' && !selectedAction) {
      Alert.alert('エラー', '就活行動を選択してください');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'normal') {
        // 通常投稿（デイリートグルONなら post_type=daily）
        const body: Record<string, unknown> = {
          content: content.trim(),
          post_type: dailyEnabled ? 'daily' : 'normal',
        };
        if (dailyEnabled) {
          body.daily_skip = dailySkip.trim() || undefined;
          body.daily_instead = dailyInstead.trim() || undefined;
          body.daily_comment = dailyComment.trim() || undefined;
        }
        const post = await api.post<Post>('/api/posts', body);
        prependPost(post);
      } else {
        // 汚染申告: alsoPost=OFF は記録のみ(経路A) / ON はタイムラインにも投稿(経路C)
        const source = alsoPost ? 'post' : 'manual';
        await api.post('/api/contamination/report', {
          action_type: selectedAction,
          source,
        });
        if (alsoPost) {
          const post = await api.post<Post>('/api/posts', {
            content: content.trim() || '就活してしまった…',
            post_type: 'normal',
          });
          prependPost(post);
        }
      }

      resetForm();
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
    { key: 'contamination', label: '汚染申告' },
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
              {user?.streak_days ? `🔥 ${user.streak_days}日連続サボり中` : 'NNCメンバー'}
            </Text>
          </View>
        </View>

        {/* 通常投稿タブ */}
        {activeTab === 'normal' && (
          <>
            <TextInput
              style={styles.textInput}
              placeholder="今日も就活しなかった理由…（最大140文字）"
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

            {/* デイリーフォーマットのトグル（オプション・1日1回） */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setDailyEnabled((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, dailyEnabled && styles.checkboxOn]}>
                {dailyEnabled && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>📋 デイリー報告フォーマットを使う</Text>
            </TouchableOpacity>

            {dailyEnabled && (
              <View style={styles.dailySection}>
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
          </>
        )}

        {/* 汚染申告タブ */}
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

            {/* タイムラインにも投稿する（OFF=記録のみ） */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setAlsoPost((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, alsoPost && styles.checkboxOn]}>
                {alsoPost && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>タイムラインにも投稿する</Text>
            </TouchableOpacity>
            <Text style={styles.toggleHint}>
              {alsoPost ? 'みんなのタイムラインに表示されます' : 'OFF：記録のみ（タイムラインには流れません）'}
            </Text>

            {alsoPost && (
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxMark: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleLabel: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  toggleHint: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 6,
    marginLeft: 32,
  },
  dailySection: {
    gap: 10,
    marginTop: 12,
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
});
