import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';
import type { Company, CompanyStatus } from '../../types';

const STATUS_LABELS: Record<CompanyStatus, string> = {
  pending: '未着手',
  es_submitted: 'ES提出済',
  in_progress: '選考中',
  done: '終了',
};

const STATUS_COLORS: Record<CompanyStatus, string> = {
  pending: Colors.muted,
  es_submitted: Colors.eventBriefing,
  in_progress: Colors.primary,
  done: Colors.contamination,
};

const FILTER_TABS: Array<'all' | CompanyStatus> = ['all', 'pending', 'es_submitted', 'in_progress', 'done'];
const FILTER_LABELS: Record<string, string> = { all: 'すべて', ...STATUS_LABELS };

const DEADLINE_WARNING_DAYS = 7;

interface AddCompanyForm {
  name: string;
  mypage_url: string;
  status: CompanyStatus;
  deadline: string;
  memo: string;
}

const DEFAULT_FORM: AddCompanyForm = {
  name: '',
  mypage_url: '',
  status: 'pending',
  deadline: '',
  memo: '',
};

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default function CompanyLinksScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filter, setFilter] = useState<'all' | CompanyStatus>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [form, setForm] = useState<AddCompanyForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const data = await api.get<Company[]>('/api/companies');
      setCompanies(data);
    } catch { /* silent */ }
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? companies : companies.filter((c) => c.status === filter);

  const warnings = companies.filter((c) => {
    if (!c.deadline || c.status === 'done') return false;
    const d = daysUntil(c.deadline);
    return d >= 0 && d <= DEADLINE_WARNING_DAYS;
  }).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  function openAddModal() {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setModalVisible(true);
  }

  function openEditModal(company: Company) {
    setEditTarget(company);
    setForm({
      name: company.name,
      mypage_url: company.mypage_url ?? '',
      status: company.status,
      deadline: company.deadline ? company.deadline.slice(0, 10) : '',
      memo: company.memo ?? '',
    });
    setModalVisible(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { Alert.alert('エラー', '企業名を入力してください'); return; }
    if (form.deadline && !form.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('エラー', '締切日はYYYY-MM-DD形式で入力してください');
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      mypage_url: form.mypage_url.trim() || undefined,
      status: form.status,
      deadline: form.deadline || undefined,
      memo: form.memo.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (editTarget) {
        const updated = await api.patch<Company>(`/api/companies/${editTarget.company_id}`, payload);
        setCompanies(prev => prev.map(c => c.company_id === updated.company_id ? updated : c));
      } else {
        const created = await api.post<Company>('/api/companies', payload);
        setCompanies(prev => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(company: Company) {
    Alert.alert('削除', `「${company.name}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/companies/${company.company_id}`);
            setCompanies(prev => prev.filter(c => c.company_id !== company.company_id));
          } catch { /* silent */ }
        },
      },
    ]);
  }

  async function handleOpenUrl(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert('エラー', 'URLを開けませんでした');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>企業リンク帳</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Security notice */}
      <View style={styles.securityNote}>
        <Text style={styles.securityNoteText}>⚠️ IDとパスワードは保存できません</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        {/* Deadline warnings */}
        {warnings.length > 0 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>⏰ 締切が近い企業</Text>
            {warnings.map((c) => {
              const d = daysUntil(c.deadline!);
              return (
                <Text key={c.company_id} style={styles.warningItem}>
                  {d === 0 ? '今日' : `${d}日後`} — {c.name}
                </Text>
              );
            })}
          </View>
        )}

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {FILTER_TABS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
                {FILTER_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Company list */}
        <View style={styles.list}>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>企業が登録されていません</Text>
          ) : (
            filtered.map((company) => (
              <View key={company.company_id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[company.status] + '20', borderColor: STATUS_COLORS[company.status] }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[company.status] }]}>
                        {STATUS_LABELS[company.status]}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(company)}>
                      <Text style={styles.editBtnText}>編集</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(company)}>
                      <Text style={styles.deleteBtnText}>削除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {company.deadline && (
                  <Text style={[styles.deadline, daysUntil(company.deadline) <= DEADLINE_WARNING_DAYS && { color: Colors.contamination, fontWeight: '600' }]}>
                    締切: {new Date(company.deadline).toLocaleDateString('ja-JP')}
                    {'  '}({daysUntil(company.deadline) < 0 ? '期限切れ' : daysUntil(company.deadline) === 0 ? '今日' : `${daysUntil(company.deadline)}日後`})
                  </Text>
                )}
                {company.memo ? <Text style={styles.memo}>{company.memo}</Text> : null}
                {company.mypage_url ? (
                  <TouchableOpacity style={styles.urlBtn} onPress={() => handleOpenUrl(company.mypage_url!)}>
                    <Text style={styles.urlBtnText}>🔗 マイページを開く</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editTarget ? '企業を編集' : '企業を追加'}</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              <Text style={[styles.modalSave, submitting && { opacity: 0.4 }]}>保存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.modalSecurityNote}>
              <Text style={styles.modalSecurityText}>🔒 ID・パスワードは入力しないでください</Text>
            </View>

            <Text style={styles.modalLabel}>企業名（必須）</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="例: ○○株式会社"
              placeholderTextColor={Colors.muted}
              value={form.name}
              onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
              autoFocus
            />

            <Text style={styles.modalLabel}>マイページURL（任意）</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://..."
              placeholderTextColor={Colors.muted}
              value={form.mypage_url}
              onChangeText={(v) => setForm(f => ({ ...f, mypage_url: v }))}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.modalLabel}>ステータス</Text>
            <View style={styles.statusGrid}>
              {(['pending', 'es_submitted', 'in_progress', 'done'] as CompanyStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, form.status === s && { borderColor: STATUS_COLORS[s], backgroundColor: STATUS_COLORS[s] + '20' }]}
                  onPress={() => setForm(f => ({ ...f, status: s }))}
                >
                  <Text style={[styles.statusChipText, form.status === s && { color: STATUS_COLORS[s], fontWeight: '700' }]}>
                    {STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>締切日（YYYY-MM-DD、任意）</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="例: 2026-07-01"
              placeholderTextColor={Colors.muted}
              value={form.deadline}
              onChangeText={(v) => setForm(f => ({ ...f, deadline: v }))}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.modalLabel}>メモ（任意）</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="採用サイト情報など"
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
  securityNote: { backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F59E0B' },
  securityNoteText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  warningBanner: { margin: 16, backgroundColor: '#FFF5F5', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.contamination },
  warningTitle: { fontSize: 13, fontWeight: '700', color: Colors.contamination, marginBottom: 6 },
  warningItem: { fontSize: 13, color: Colors.primary, paddingVertical: 2 },
  filterRow: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  filterLabel: { fontSize: 13, color: Colors.muted },
  filterLabelActive: { color: Colors.onPrimary, fontWeight: '600' },
  list: { padding: 16, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.muted, padding: 8 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardLeft: { flex: 1, gap: 4 },
  companyName: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 6 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  editBtnText: { fontSize: 12, color: Colors.primary },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#FEE2E2' },
  deleteBtnText: { fontSize: 12, color: Colors.contamination },
  deadline: { fontSize: 12, color: Colors.muted },
  memo: { fontSize: 12, color: Colors.muted, lineHeight: 18 },
  urlBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primary + '10', borderWidth: 1, borderColor: Colors.primary },
  urlBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalCancel: { fontSize: 15, color: Colors.muted, width: 70 },
  modalTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.primary },
  modalSave: { fontSize: 15, color: Colors.primary, fontWeight: '700', width: 70, textAlign: 'right' },
  modalBody: { flex: 1, padding: 16 },
  modalSecurityNote: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F59E0B' },
  modalSecurityText: { fontSize: 12, color: '#92400E', fontWeight: '600', textAlign: 'center' },
  modalLabel: { fontSize: 12, color: Colors.muted, marginTop: 16, marginBottom: 6 },
  modalInput: { backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 14, fontSize: 15, color: Colors.primary },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.white },
  statusChipText: { fontSize: 13, color: Colors.primary },
});
