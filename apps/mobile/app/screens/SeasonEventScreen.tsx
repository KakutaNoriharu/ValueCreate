import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';
import type { Season } from '../../types';

interface SeasonData {
  season: Season | null;
  survivor_count: number;
  today_eliminated: number;
  total_entries: number;
}

// シーズンイベント（開幕速報・中間報告・カウントダウン・終了速報）
interface EventItem {
  icon: string;
  title: string;
  body: string;
}

export default function SeasonEventScreen() {
  const [data, setData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<SeasonData>('/api/chicken-race/current-season');
      setData(res);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const season = data?.season ?? null;

  if (!season) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🏁</Text>
        <Text style={styles.emptyText}>開催中のシーズンはありません</Text>
      </View>
    );
  }

  const daysLeft = season.ended_at
    ? Math.max(0, Math.ceil((new Date(season.ended_at).getTime() - Date.now()) / 86400000))
    : null;

  const events: EventItem[] = [];
  if (season.started_at) {
    events.push({
      icon: '🚀',
      title: '開幕速報',
      body: `${new Date(season.started_at).toLocaleDateString('ja-JP')} にシーズン開幕。${data?.total_entries ?? 0}人がエントリー。`,
    });
  }
  events.push({
    icon: '📊',
    title: '中間報告',
    body: `現在の生存者は ${data?.survivor_count ?? 0}人。本日の脱落は ${data?.today_eliminated ?? 0}人。`,
  });
  if (daysLeft != null && season.status === 'active') {
    events.push({
      icon: '⏳',
      title: 'カウントダウン',
      body: daysLeft > 0 ? `シーズン終了まであと ${daysLeft}日。` : '本日シーズン最終日！',
    });
  }
  if (season.status === 'finished') {
    events.push({ icon: '🏆', title: '終了速報', body: 'シーズンは終了しました。生き残ったメンバーに称賛を。' });
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }} />
      }
    >
      {/* シーズンテーマ */}
      <View style={styles.themeCard}>
        <Text style={styles.seasonName}>{season.name}</Text>
        {season.theme ? <Text style={styles.theme}>🎯 {season.theme}</Text> : null}
        {daysLeft != null && season.status === 'active' && (
          <Text style={styles.daysLeft}>終了まで {daysLeft}日</Text>
        )}
      </View>

      {/* イベントタイムライン */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>シーズンイベント</Text>
        {events.map((e, i) => (
          <View key={i} style={styles.eventCard}>
            <Text style={styles.eventIcon}>{e.icon}</Text>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{e.title}</Text>
              <Text style={styles.eventBody}>{e.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 15, color: Colors.muted },
  themeCard: { backgroundColor: Colors.primary, padding: 20, gap: 8 },
  seasonName: { fontSize: 18, fontWeight: '900', color: Colors.onPrimary },
  theme: { fontSize: 14, color: Colors.survival, fontWeight: '600' },
  daysLeft: { fontSize: 12, color: Colors.contamination },
  section: { padding: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  eventCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventIcon: { fontSize: 24 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  eventBody: { fontSize: 13, color: Colors.muted, lineHeight: 19 },
});
