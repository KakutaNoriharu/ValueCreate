import React, { useState } from 'react';
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
import { Strings } from '../../constants/strings';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';
import type { RootStackScreenProps } from '../navigation/types';

type SettingField =
  | 'notif_obituary'
  | 'notif_reminder'
  | 'show_contamination'
  | 'show_university';

export default function SettingsScreen({ navigation }: RootStackScreenProps<'Settings'>) {
  const { user, setUser, logout } = useAuthStore();
  const [saving, setSaving] = useState<SettingField | null>(null);

  async function toggleSetting(field: SettingField, value: boolean) {
    if (!user) return;
    setSaving(field);
    try {
      await api.patch('/api/users/me/settings', { [field]: value });
      setUser({ ...user, [field]: value });
    } catch {
      /* silent — toggle reverts via no state change */
    } finally {
      setSaving(null);
    }
  }

  async function handleWithdraw() {
    Alert.alert(
      'クラブを脱退する',
      'アカウントと全データが削除されます。この操作は取り消せません。本当に脱退しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '脱退する', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/api/users/me');
              await logout();
            } catch (e: unknown) {
              Alert.alert('エラー', e instanceof Error ? e.message : '脱退に失敗しました');
            }
          },
        },
      ],
    );
  }

  async function handleSelfBan() {
    Alert.alert(
      '内定を報告して追放される',
      '内定を報告すると「社畜の卵」として永久追放されます。\n\n「裏切り者」の烙印がつきます。\n\n本当に宜しいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '内定です。追放されます。', style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/api/users/me/banned', {});
              Alert.alert(
                '👔 内定おめでとうございます',
                'あなたはクラブから永久追放されました。\nお体に気をつけて社畜生活をお過ごしください。',
                [{ text: 'OK', onPress: logout }],
              );
            } catch (e: unknown) {
              Alert.alert('エラー', e instanceof Error ? e.message : '処理に失敗しました');
            }
          },
        },
      ],
    );
  }

  function handleLogout() {
    Alert.alert('退出', 'クラブから退出しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '退出する', style: 'destructive', onPress: logout },
    ]);
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Auth Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>認証ステータス</Text>
          <View style={styles.card}>
            <View style={styles.authRow}>
            <View>
              <Text style={styles.authBadge}>NNCメンバー</Text>
              <Text style={styles.authEmail}>{user.contact_email}</Text>
            </View>
          </View>
          </View>
        </View>

        {/* Notification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知設定</Text>
          <View style={styles.card}>
            <SettingRow
              label="訃報速報"
              description="誰かがチキンレースで脱落したとき通知"
              value={user.notif_obituary}
              disabled={saving !== null}
              onValueChange={(v) => toggleSetting('notif_obituary', v)}
            />
            <SettingRow
              label="リマインダー通知"
              description="就活イベントのリマインド通知"
              value={user.notif_reminder}
              disabled={saving !== null}
              onValueChange={(v) => toggleSetting('notif_reminder', v)}
              borderTop
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プライバシー設定</Text>
          <View style={styles.card}>
            <SettingRow
              label="汚染度を公開"
              description="他のメンバーに汚染度ポイントを表示"
              value={user.show_contamination}
              disabled={saving !== null}
              onValueChange={(v) => toggleSetting('show_contamination', v)}
            />
            <SettingRow
              label="大学名を公開"
              description="プロフィールに大学名を表示"
              value={user.show_university}
              disabled={saving !== null}
              onValueChange={(v) => toggleSetting('show_university', v)}
              borderTop
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>規約・情報</Text>
          <View style={styles.card}>
            <LegalRow label="クラブ規約" />
            <LegalRow label="プライバシーポリシー" borderTop />
            <LegalRow label="お問い合わせ" borderTop />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>クラブから退出する（ログアウト）</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ 危険ゾーン</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.dangerRow} onPress={handleWithdraw}>
              <View>
                <Text style={styles.dangerLabel}>クラブを脱退する</Text>
                <Text style={styles.dangerDesc}>アカウントと全データを削除します</Text>
              </View>
              <Text style={styles.dangerChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dangerRow, styles.dangerRowBan]} onPress={handleSelfBan}>
              <View>
                <Text style={styles.banLabel}>内定を報告して追放される</Text>
                <Text style={styles.dangerDesc}>👔 社畜の卵として永久追放されます</Text>
              </View>
              <Text style={styles.dangerChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

    </View>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (v: boolean) => void;
  borderTop?: boolean;
}

function SettingRow({ label, description, value, disabled, onValueChange, borderTop }: SettingRowProps) {
  return (
    <View style={[styles.settingRow, borderTop && styles.settingRowBorder]}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: Colors.primary, false: Colors.border }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

function LegalRow({ label, borderTop }: { label: string; borderTop?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.legalRow, borderTop && styles.settingRowBorder]}
      onPress={() => Alert.alert(label, `${label}はリリース時に掲載予定です。`)}
    >
      <Text style={styles.legalLabel}>{label}</Text>
      <Text style={styles.legalChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 20, marginHorizontal: 16, gap: 8 },
  sectionTitle: { fontSize: 12, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  authRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  authBadge: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  authEmail: { fontSize: 13, color: Colors.muted },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  settingInfo: { flex: 1, gap: 2 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  settingDesc: { fontSize: 12, color: Colors.muted },
  legalRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  legalLabel: { flex: 1, fontSize: 15, color: Colors.primary },
  legalChevron: { fontSize: 18, color: Colors.muted },
  logoutBtn: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  logoutBtnText: { fontSize: 15, color: Colors.muted, fontWeight: '500' },
  dangerRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  dangerRowBan: { borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: '#1a1a1a' },
  dangerLabel: { fontSize: 15, color: Colors.contamination, fontWeight: '600' },
  banLabel: { fontSize: 15, color: Colors.contamination, fontWeight: '600' },
  dangerDesc: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  dangerChevron: { fontSize: 20, color: Colors.muted, marginLeft: 8 },
});
