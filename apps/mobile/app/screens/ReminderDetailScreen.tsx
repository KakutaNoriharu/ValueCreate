import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';
import type { CalendarEvent, EventType } from '../../types';
import type { RootStackScreenProps } from '../navigation/types';
import { scheduleEventNotifications } from '../../hooks/usePushNotifications';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  es: 'ES締切',
  briefing: '説明会',
  interview: '面接',
  internship_short: 'インターン（短期）',
  internship_long: 'インターン（長期）',
  ob_visit: 'OB/OG訪問',
  spi: 'SPI',
  other: 'その他',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  es: Colors.contamination,
  briefing: Colors.eventBriefing,
  interview: Colors.eventInterview,
  internship_short: Colors.eventInternship,
  internship_long: Colors.eventInternship,
  ob_visit: Colors.eventBriefing,
  spi: Colors.eventOther,
  other: Colors.eventOther,
};

const CONTAMINATION_ACTIONS = new Set(['es', 'briefing', 'internship_short', 'internship_long', 'ob_visit', 'spi']);

export default function ReminderDetailScreen({ route, navigation }: RootStackScreenProps<'ReminderDetail'>) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    try {
      const data = await api.get<CalendarEvent>(`/api/calendar/events/${eventId}`);
      setEvent(data);
    } catch {
      Alert.alert('エラー', 'イベントが見つかりません');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [eventId]);

  async function handleComplete() {
    if (!event) return;
    const pts = event.contamination_points;
    const msg = pts > 0
      ? `「${event.title}」を完了にしますか？\n⚠️ 汚染ポイント +${pts}pt が加算されます。`
      : `「${event.title}」を完了にしますか？`;

    Alert.alert('行った✅', msg, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '行った', style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await api.post<{
              message: string;
              point_added: number;
              contamination_pt: number;
              character_stage: string;
            }>(`/api/calendar/events/${eventId}/complete`, {});
            setEvent(prev => prev ? { ...prev, status: 'done' } : prev);
            if (res.point_added > 0) {
              Alert.alert(
                '⚠️ 汚染されました',
                `+${res.point_added}pt\n累計汚染ポイント: ${res.contamination_pt}pt`,
              );
            }
          } catch (e: unknown) {
            Alert.alert('エラー', e instanceof Error ? e.message : '完了処理に失敗しました');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }

  async function handleSkip() {
    if (!event) return;
    setActionLoading(true);
    try {
      await api.post(`/api/calendar/events/${eventId}/skip`, {});
      setEvent(prev => prev ? { ...prev, status: 'skipped' } : prev);
    } catch {
      /* silent */
    } finally {
      setActionLoading(false);
    }
  }

  async function handleNotifToggle(field: 'notif_day_before' | 'notif_one_hour' | 'notif_followup', value: boolean) {
    if (!event) return;
    try {
      const updated = await api.patch<CalendarEvent>(`/api/calendar/events/${eventId}/settings`, { [field]: value });
      setEvent(updated);
      if (value) {
        await scheduleEventNotifications(updated).catch(() => {});
      }
    } catch { /* silent */ }
  }

  async function handleDelete() {
    Alert.alert('削除', 'このイベントを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/calendar/events/${eventId}`);
            navigation.goBack();
          } catch { /* silent */ }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!event) return null;

  const scheduledDate = new Date(event.scheduled_at);
  const isPast = scheduledDate < new Date();
  const color = EVENT_TYPE_COLORS[event.event_type];
  const label = EVENT_TYPE_LABELS[event.event_type];
  const isDone = event.status === 'done';
  const isSkipped = event.status === 'skipped';
  const hasContamination = event.contamination_points > 0;

  return (
    <View style={styles.container}>
      {/* Back header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>イベント詳細</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>削除</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Event card */}
        <View style={[styles.eventCard, { borderTopColor: color }]}>
          <View style={styles.typeBadge}>
            <View style={[styles.typeDot, { backgroundColor: color }]} />
            <Text style={[styles.typeLabel, { color }]}>{label}</Text>
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDate}>
            {scheduledDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            {'  '}
            {scheduledDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isPast && <Text style={styles.pastLabel}>（過去のイベント）</Text>}

          {hasContamination && (
            <View style={styles.contaminationBadge}>
              <Text style={styles.contaminationText}>⚠️ 行くと汚染 +{event.contamination_points}pt</Text>
            </View>
          )}

          {event.memo ? (
            <View style={styles.memoSection}>
              <Text style={styles.memoLabel}>メモ</Text>
              <Text style={styles.memoText}>{event.memo}</Text>
            </View>
          ) : null}

          {/* Status badge */}
          {isDone && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>✅ 完了済み</Text>
            </View>
          )}
          {isSkipped && (
            <View style={[styles.statusBanner, styles.statusBannerSkip]}>
              <Text style={styles.statusBannerText}>🛋️ サボった</Text>
            </View>
          )}
        </View>

        {/* Action buttons — only when pending/ignored */}
        {!isDone && !isSkipped && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>今日どうした？</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDone, actionLoading && styles.btnDisabled]}
                onPress={handleComplete}
                disabled={actionLoading}
              >
                <Text style={styles.actionBtnDoneText}>✅ 行った</Text>
                {hasContamination && <Text style={styles.actionBtnSub}>+{event.contamination_points}pt</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSkip, actionLoading && styles.btnDisabled]}
                onPress={handleSkip}
                disabled={actionLoading}
              >
                <Text style={styles.actionBtnSkipText}>🛋️ サボった</Text>
                <Text style={styles.actionBtnSub}>ポイントなし</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notification settings */}
        <View style={styles.notifSection}>
          <Text style={styles.sectionTitle}>通知設定</Text>
          <View style={styles.notifCard}>
            <View style={styles.notifRow}>
              <View style={styles.notifInfo}>
                <Text style={styles.notifLabel}>前日リマインダー</Text>
                <Text style={styles.notifSub}>イベント前日の同時刻に通知</Text>
              </View>
              <Switch
                value={event.notif_day_before}
                onValueChange={(v) => handleNotifToggle('notif_day_before', v)}
                trackColor={{ true: Colors.primary }}
              />
            </View>
            <View style={[styles.notifRow, styles.notifRowBorder]}>
              <View style={styles.notifInfo}>
                <Text style={styles.notifLabel}>1時間前リマインダー</Text>
                <Text style={styles.notifSub}>イベント1時間前に通知</Text>
              </View>
              <Switch
                value={event.notif_one_hour}
                onValueChange={(v) => handleNotifToggle('notif_one_hour', v)}
                trackColor={{ true: Colors.primary }}
              />
            </View>
            <View style={[styles.notifRow, styles.notifRowBorder]}>
              <View style={styles.notifInfo}>
                <Text style={styles.notifLabel}>フォローアップ</Text>
                <Text style={styles.notifSub}>翌日9時に「どうでしたか？」通知</Text>
              </View>
              <Switch
                value={event.notif_followup}
                onValueChange={(v) => handleNotifToggle('notif_followup', v)}
                trackColor={{ true: Colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Contamination info */}
        {CONTAMINATION_ACTIONS.has(event.event_type) && (
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              💡 「行った✅」ボタンを押すと汚染ポイントが加算されます。登録・通知受信だけでは加算されません。
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 70 },
  backBtnText: { fontSize: 15, color: Colors.primary },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.primary },
  deleteBtn: { width: 70, alignItems: 'flex-end' },
  deleteBtnText: { fontSize: 14, color: Colors.contamination },
  eventCard: { margin: 16, backgroundColor: Colors.white, borderRadius: 14, padding: 18, borderTopWidth: 4, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeLabel: { fontSize: 12, fontWeight: '700' },
  eventTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  eventDate: { fontSize: 15, color: Colors.muted },
  pastLabel: { fontSize: 12, color: Colors.muted },
  contaminationBadge: { backgroundColor: '#FFF5F5', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.contamination },
  contaminationText: { fontSize: 13, color: Colors.contamination, fontWeight: '600' },
  memoSection: { gap: 4 },
  memoLabel: { fontSize: 12, color: Colors.muted },
  memoText: { fontSize: 14, color: Colors.primary, lineHeight: 20 },
  statusBanner: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.success },
  statusBannerSkip: { backgroundColor: '#F3F4F6', borderColor: Colors.border },
  statusBannerText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  actionSection: { marginHorizontal: 16, marginBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', gap: 4 },
  actionBtnDone: { backgroundColor: Colors.contamination },
  actionBtnSkip: { backgroundColor: Colors.success },
  actionBtnDoneText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  actionBtnSkipText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  actionBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  btnDisabled: { opacity: 0.5 },
  notifSection: { marginHorizontal: 16, marginBottom: 16, gap: 12 },
  notifCard: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  notifRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  notifRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  notifInfo: { flex: 1, gap: 2 },
  notifLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  notifSub: { fontSize: 12, color: Colors.muted },
  infoSection: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  infoText: { fontSize: 12, color: '#1D4ED8', lineHeight: 18 },
});
