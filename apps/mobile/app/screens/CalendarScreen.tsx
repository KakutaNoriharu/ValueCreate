import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';
import type { CalendarEvent, EventType } from '../../types';
import type { RootStackParamList } from '../navigation/types';
import { scheduleEventNotifications } from '../../hooks/usePushNotifications';

const EVENT_TYPES: { key: EventType; label: string; color: string }[] = [
  { key: 'es', label: 'ES締切', color: Colors.eventES },
  { key: 'briefing', label: '説明会', color: Colors.eventBriefing },
  { key: 'interview', label: '面接', color: Colors.eventInterview },
  { key: 'internship_short', label: 'インターン', color: Colors.eventInternship },
  { key: 'ob_visit', label: 'OB/OG訪問', color: Colors.eventBriefing },
  { key: 'spi', label: 'SPI', color: Colors.eventOther },
  { key: 'other', label: 'その他', color: Colors.eventOther },
];

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getEventColor(type: EventType): string {
  return EVENT_TYPES.find((t) => t.key === type)?.color ?? Colors.eventOther;
}

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const tail = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < tail; i++) cells.push(null);
  return cells;
}

interface AddEventForm {
  title: string;
  event_type: EventType;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  remind_before: number;
  memo: string;
}

const DEFAULT_FORM: AddEventForm = {
  title: '',
  event_type: 'briefing',
  date: '',
  time: '10:00',
  remind_before: 1440,
  memo: '',
};

const REMIND_OPTIONS = [
  { label: '前日', value: 1440 },
  { label: '当日1時間前', value: 60 },
  { label: 'なし', value: 0 },
];

export default function CalendarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<AddEventForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function load(y = year, m = month) {
    try {
      const data = await api.get<CalendarEvent[]>(`/api/calendar/events?year=${y}&month=${m}`);
      setEvents(data);
    } catch { /* silent */ }
  }

  useEffect(() => { load(); }, [year, month]);

  const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (const e of events) {
      const d = new Date(e.scheduled_at).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    return map;
  }, [events]);

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  function openAddModal() {
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = selectedDay ?? today.getDate();
    setForm({
      ...DEFAULT_FORM,
      date: `${year}-${pad(month)}-${pad(d)}`,
    });
    setModalVisible(true);
  }

  async function handleAdd() {
    if (!form.title.trim()) { Alert.alert('エラー', 'イベント名を入力してください'); return; }
    if (!form.date.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('エラー', '日付をYYYY-MM-DD形式で入力してください'); return; }

    setSubmitting(true);
    try {
      const scheduled_at = `${form.date}T${form.time || '10:00'}:00`;
      const event = await api.post<CalendarEvent>('/api/calendar/events', {
        title: form.title.trim(),
        event_type: form.event_type,
        scheduled_at,
        remind_before: form.remind_before,
        memo: form.memo.trim() || undefined,
      });
      setEvents(prev => [...prev, event].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)));
      await scheduleEventNotifications(event).catch(() => {});
      setModalVisible(false);
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '追加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    Alert.alert('削除', 'このイベントを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/calendar/events/${eventId}`);
            setEvents(prev => prev.filter(e => e.event_id !== eventId));
          } catch { /* silent */ }
        },
      },
    ]);
  }

  function daysUntil(iso: string): string {
    const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
    if (diff < 0) return '期限切れ';
    if (diff === 0) return '今日';
    return `${diff}日後`;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>各種イベント</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
            <Text style={styles.monthBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{year}年 {MONTHS[month - 1]}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
            <Text style={styles.monthBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day names */}
        <View style={styles.dayNames}>
          {DAY_NAMES.map((d, i) => (
            <Text key={d} style={[styles.dayName, i === 0 && styles.sunday, i === 6 && styles.saturday]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={styles.cell} />;
            const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
            const isSelected = day === selectedDay;
            const dayEvents = eventsByDay[day] ?? [];
            const dow = idx % 7;
            return (
              <TouchableOpacity key={`day-${day}`} style={styles.cell} onPress={() => setSelectedDay(day)}>
                <View style={[styles.dayCircle, isToday && styles.todayCircle, isSelected && styles.selectedCircle]}>
                  <Text style={[styles.dayText, dow === 0 && styles.sundayText, dow === 6 && styles.saturdayText, isToday && styles.todayText, isSelected && styles.selectedText]}>
                    {day}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: getEventColor(e.event_type) }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Color legend */}
        <View style={styles.legend}>
          {EVENT_TYPES.slice(0, 4).map((t) => (
            <View key={t.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: t.color }]} />
              <Text style={styles.legendLabel}>{t.label}</Text>
            </View>
          ))}
        </View>

        {/* Selected day events */}
        <View style={styles.eventList}>
          <Text style={styles.eventListTitle}>
            {selectedDay ? `${month}月${selectedDay}日のイベント` : `${month}月のすべてのイベント`}
          </Text>
          {(selectedDay ? selectedEvents : events).length === 0 ? (
            <Text style={styles.emptyText}>イベントなし</Text>
          ) : (
            (selectedDay ? selectedEvents : events).map((event) => (
              <TouchableOpacity
                key={event.event_id}
                style={styles.eventItem}
                onPress={() => navigation.navigate('ReminderDetail', { eventId: event.event_id })}
                onLongPress={() => handleDelete(event.event_id)}
              >
                <View style={[styles.eventColorBar, { backgroundColor: getEventColor(event.event_type) }]} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(event.scheduled_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {'  '}{daysUntil(event.scheduled_at)}
                  </Text>
                </View>
                {event.status === 'done' && <Text style={styles.doneTag}>✅</Text>}
                {event.status === 'skipped' && <Text style={styles.skipTag}>🛋️</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>イベントを追加</Text>
            <TouchableOpacity onPress={handleAdd} disabled={submitting}>
              <Text style={[styles.modalSave, submitting && { opacity: 0.4 }]}>追加</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.modalInput}
              placeholder="イベント名（必須）"
              placeholderTextColor={Colors.muted}
              value={form.title}
              onChangeText={(v) => setForm(f => ({ ...f, title: v }))}
              autoFocus
            />

            <Text style={styles.modalLabel}>種別</Text>
            <View style={styles.typeGrid}>
              {EVENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeChip, form.event_type === t.key && { borderColor: t.color, backgroundColor: t.color + '20' }]}
                  onPress={() => setForm(f => ({ ...f, event_type: t.key }))}
                >
                  <View style={[styles.typeDot, { backgroundColor: t.color }]} />
                  <Text style={styles.typeLabel}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>日付（YYYY-MM-DD）</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`例: ${year}-${String(month).padStart(2, '0')}-01`}
              placeholderTextColor={Colors.muted}
              value={form.date}
              onChangeText={(v) => setForm(f => ({ ...f, date: v }))}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.modalLabel}>時刻（HH:MM）</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="例: 14:00"
              placeholderTextColor={Colors.muted}
              value={form.time}
              onChangeText={(v) => setForm(f => ({ ...f, time: v }))}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.modalLabel}>リマインダー</Text>
            <View style={styles.remindRow}>
              {REMIND_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.remindChip, form.remind_before === opt.value && styles.remindChipActive]}
                  onPress={() => setForm(f => ({ ...f, remind_before: opt.value }))}
                >
                  <Text style={[styles.remindLabel, form.remind_before === opt.value && styles.remindLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>メモ（任意）</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="メモを入力"
              placeholderTextColor={Colors.muted}
              value={form.memo}
              onChangeText={(v) => setForm(f => ({ ...f, memo: v }))}
              multiline
              textAlignVertical="top"
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.onPrimary },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 20, color: Colors.onPrimary, lineHeight: 24 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  monthBtn: { padding: 8 },
  monthBtnText: { fontSize: 24, color: Colors.primary, fontWeight: '300' },
  monthLabel: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  dayNames: { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: 4 },
  dayName: { flex: 1, textAlign: 'center', fontSize: 12, color: Colors.muted, paddingVertical: 6 },
  sunday: { color: Colors.contamination },
  saturday: { color: Colors.eventBriefing },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.white, paddingHorizontal: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cell: { width: '14.28%', alignItems: 'center', paddingVertical: 4, gap: 2 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: Colors.primary },
  selectedCircle: { borderWidth: 2, borderColor: Colors.topTabIndicator },
  dayText: { fontSize: 13, color: Colors.primary },
  sundayText: { color: Colors.contamination },
  saturdayText: { color: Colors.eventBriefing },
  todayText: { color: Colors.onPrimary, fontWeight: '700' },
  selectedText: { fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, height: 6 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 8, gap: 12, backgroundColor: Colors.white },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: Colors.muted },
  eventList: { padding: 16, gap: 8 },
  eventListTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  emptyText: { fontSize: 13, color: Colors.muted, padding: 8 },
  eventItem: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  eventColorBar: { width: 4 },
  eventInfo: { flex: 1, padding: 12, gap: 3 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  eventDate: { fontSize: 12, color: Colors.muted },
  doneTag: { padding: 10, fontSize: 16, alignSelf: 'center' },
  skipTag: { padding: 10, fontSize: 16, alignSelf: 'center' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalCancel: { fontSize: 15, color: Colors.muted, width: 70 },
  modalTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.primary },
  modalSave: { fontSize: 15, color: Colors.primary, fontWeight: '700', width: 70, textAlign: 'right' },
  modalBody: { flex: 1, padding: 16 },
  modalLabel: { fontSize: 12, color: Colors.muted, marginTop: 16, marginBottom: 6 },
  modalInput: { backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 14, fontSize: 15, color: Colors.primary },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.white },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeLabel: { fontSize: 13, color: Colors.primary },
  remindRow: { flexDirection: 'row', gap: 8 },
  remindChip: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, alignItems: 'center', backgroundColor: Colors.white },
  remindChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  remindLabel: { fontSize: 13, color: Colors.primary },
  remindLabelActive: { color: Colors.onPrimary, fontWeight: '600' },
});
