import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useChickenRaceStore } from '../../stores/chickenRaceStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChickenRaceEntry, Season } from '../../types';
import type { RootStackParamList } from '../navigation/types';
import CharacterAvatar from '../../components/CharacterAvatar';
import { useWebSocket } from '../../hooks/useWebSocket';

type RaceTab = 'survivors' | 'obituaries';

interface SeasonData {
  season: Season | null;
  survivor_count: number;
  today_eliminated: number;
  total_entries: number;
}

interface MyStatusData {
  entry: ChickenRaceEntry | null;
  season: Season | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function ChickenRaceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const { survivors, obituaries, stats, season, myEntry, setSurvivors, setObituaries, setStats, setSeason, setMyEntry, addObituary } =
    useChickenRaceStore();

  const [activeTab, setActiveTab] = useState<RaceTab>('survivors');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await api.get<SeasonData>('/api/chicken-race/current-season');
      setStats({
        survivor_count: data.survivor_count,
        today_eliminated: data.today_eliminated,
        total_members: data.total_entries,
      });
      if (data.season) {
        setSeason(data.season);

        const [survivorList, obituaryList, myStatus] = await Promise.all([
          api.get<ChickenRaceEntry[]>(`/api/chicken-race/survivors?season_id=${data.season.season_id}`),
          api.get<ChickenRaceEntry[]>(`/api/chicken-race/obituaries?season_id=${data.season.season_id}`),
          api.get<MyStatusData>('/api/chicken-race/my-status'),
        ]);
        setSurvivors(survivorList);
        setObituaries(obituaryList);
        setMyEntry(myStatus.entry);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleWsMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; entry: ChickenRaceEntry };
    if (msg.type === 'elimination' && msg.entry) {
      addObituary(msg.entry);
    }
  }, [addObituary]);

  useWebSocket('/ws/survivors', handleWsMessage);

  async function handleEnter() {
    try {
      await api.post('/api/chicken-race/enter');
      await load(true);
      Alert.alert('エントリー完了', 'チキンレースに参加しました！最後まで生き残れ！');
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '参加に失敗しました');
    }
  }

  async function handleEliminate() {
    Alert.alert('脱落申告', '本当に脱落しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '脱落する',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/api/chicken-race/eliminate?reason=es');
            await load(true);
          } catch (e: unknown) {
            Alert.alert('エラー', e instanceof Error ? e.message : '失敗しました');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!season) {
    return (
      <View style={styles.center}>
        <Text style={styles.noSeasonIcon}>🏁</Text>
        <Text style={styles.noSeasonText}>現在シーズンは開催されていません</Text>
        <Text style={styles.noSeasonSub}>次のシーズン開幕をお待ちください</Text>
      </View>
    );
  }

  const seasonProgress = (() => {
    if (!season.started_at || !season.ended_at) return 0;
    const total = new Date(season.ended_at).getTime() - new Date(season.started_at).getTime();
    const elapsed = Date.now() - new Date(season.started_at).getTime();
    return Math.min(1, Math.max(0, elapsed / total));
  })();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>チキンレース</Text>
        <View style={styles.seasonBadge}>
          <Text style={styles.seasonBadgeText}>{season.name}</Text>
        </View>
      </View>

      <FlatList
        data={activeTab === 'survivors' ? survivors : obituaries}
        keyExtractor={(item) => item.entry_id}
        renderItem={({ item, index }) =>
          activeTab === 'survivors' ? (
            <SurvivorItem
              entry={item}
              rank={index + 1}
              myId={user?.user_id}
              onPress={(uid) => navigation.navigate('OtherMember', { userId: uid })}
            />
          ) : (
            <ObituaryItem entry={item} />
          )
        }
        ListHeaderComponent={
          <View>
            {/* Season Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats?.survivor_count ?? 0}</Text>
                  <Text style={styles.statLabel}>生存者</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: Colors.contamination }]}>
                    {stats?.today_eliminated ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>今日の脱落</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats?.total_members ?? 0}</Text>
                  <Text style={styles.statLabel}>総エントリー</Text>
                </View>
              </View>

              {/* シーズン進捗 */}
              {season.started_at && season.ended_at && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${seasonProgress * 100}%` }]} />
                  </View>
                  <Text style={styles.progressLabel}>
                    {season.status === 'active'
                      ? `シーズン進行中 ${Math.round(seasonProgress * 100)}%`
                      : season.status === 'preseason'
                      ? 'プレシーズン'
                      : 'シーズン終了'}
                  </Text>
                </View>
              )}
            </View>

            {/* My Status Banner */}
            <View style={styles.myStatusBanner}>
              {myEntry ? (
                myEntry.status === 'alive' ? (
                  <View style={styles.aliveRow}>
                    <Text style={styles.aliveIcon}>✅</Text>
                    <View style={styles.aliveInfo}>
                      <Text style={styles.aliveText}>生存中 · {myEntry.survived_days}日</Text>
                      <Text style={styles.aliveSub}>チキンレース参加中</Text>
                    </View>
                    <TouchableOpacity style={styles.eliminateBtn} onPress={handleEliminate}>
                      <Text style={styles.eliminateBtnText}>脱落申告</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.aliveRow}>
                    <Text style={styles.aliveIcon}>💀</Text>
                    <View style={styles.aliveInfo}>
                      <Text style={[styles.aliveText, { color: Colors.muted }]}>
                        {myEntry.survived_days}日目に散る
                      </Text>
                      <Text style={styles.aliveSub}>
                        {myEntry.eliminated_at ? timeAgo(myEntry.eliminated_at) : ''}
                      </Text>
                    </View>
                  </View>
                )
              ) : (
                <View style={styles.enterRow}>
                  <Text style={styles.enterText}>チキンレースに参加する？</Text>
                  <TouchableOpacity style={styles.enterBtn} onPress={handleEnter}>
                    <Text style={styles.enterBtnText}>エントリー</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Tab bar */}
            <View style={styles.tabBar}>
              {(['survivors', 'obituaries'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                    {tab === 'survivors' ? `生存者 (${survivors.length})` : `脱落者 (${obituaries.length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyText}>
              {activeTab === 'survivors' ? 'まだ生存者がいません' : 'まだ脱落者がいません'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function SurvivorItem({
  entry,
  rank,
  myId,
  onPress,
}: {
  entry: ChickenRaceEntry;
  rank: number;
  myId?: string;
  onPress?: (userId: string) => void;
}) {
  const isMe = entry.user_id === myId;
  const rankColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  return (
    <TouchableOpacity
      style={[styles.listItem, isMe && styles.listItemMe]}
      activeOpacity={0.7}
      onPress={() => entry.user && onPress?.(entry.user.user_id)}
    >
      <View style={[styles.rankBadge, rank <= 3 && { backgroundColor: rankColors[rank] }]}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <CharacterAvatar stage={entry.user?.character_stage ?? 'pure'} size={38} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{entry.user?.nickname ?? '名無し'}</Text>
        <Text style={styles.itemSub}>{entry.survived_days}日生存</Text>
      </View>
      <Text style={styles.itemPt}>{entry.user?.contamination_pt ?? 0}pt</Text>
    </TouchableOpacity>
  );
}

function ObituaryItem({ entry }: { entry: ChickenRaceEntry }) {
  return (
    <View style={[styles.listItem, styles.obituaryItem]}>
      <Text style={styles.obituaryIcon}>💀</Text>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { textDecorationLine: 'line-through', color: Colors.muted }]}>
          {entry.user?.nickname ?? '名無し'}
        </Text>
        <Text style={styles.itemSub}>
          {entry.survived_days}日目に散る · {entry.eliminated_at ? timeAgo(entry.eliminated_at) : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noSeasonIcon: { fontSize: 48 },
  noSeasonText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  noSeasonSub: { fontSize: 13, color: Colors.muted },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.onPrimary, flex: 1 },
  seasonBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  seasonBadgeText: { fontSize: 12, color: Colors.onPrimary },
  statsCard: {
    backgroundColor: Colors.primary,
    padding: 20,
    gap: 16,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  statItem: { alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: Colors.survival },
  statLabel: { fontSize: 11, color: Colors.muted },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressSection: { gap: 6 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.contamination, borderRadius: 2 },
  progressLabel: { fontSize: 11, color: Colors.muted, textAlign: 'right' },
  myStatusBanner: {
    backgroundColor: 'rgba(29,158,117,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aliveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aliveIcon: { fontSize: 24 },
  aliveInfo: { flex: 1 },
  aliveText: { fontSize: 15, fontWeight: '700', color: Colors.survival },
  aliveSub: { fontSize: 12, color: Colors.muted },
  eliminateBtn: { borderWidth: 1, borderColor: Colors.contamination, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  eliminateBtnText: { fontSize: 12, color: Colors.contamination, fontWeight: '600' },
  enterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  enterText: { fontSize: 14, color: Colors.primary },
  enterBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  enterBtnText: { color: Colors.onPrimary, fontSize: 13, fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: Colors.topTabIndicator },
  tabLabel: { fontSize: 13, color: Colors.topTabInactive, fontWeight: '500' },
  tabLabelActive: { color: Colors.topTabActive, fontWeight: '700' },
  listContent: { paddingBottom: 80 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemMe: { backgroundColor: 'rgba(29,158,117,0.06)', borderLeftWidth: 3, borderLeftColor: Colors.survival },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  itemSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  itemPt: { fontSize: 13, color: Colors.warning, fontWeight: '600' },
  obituaryItem: { backgroundColor: '#f5f5f5' },
  obituaryIcon: { fontSize: 20 },
  emptyList: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.muted },
});
