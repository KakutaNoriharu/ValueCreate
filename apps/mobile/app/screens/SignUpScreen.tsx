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
import { Strings } from '../../constants/strings';
import type { AuthStackScreenProps } from '../navigation/types';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { TokenResponse } from '../../types';

type AuthType = 'university' | 'normal';

const GRADE_OPTIONS = ['学部3年', '学部4年', '修士1年', '修士2年', 'その他'];

export default function SignUpScreen({ route, navigation }: AuthStackScreenProps<'SignUp'>) {
  const initialType = route.params?.authType ?? 'normal';
  const [authType, setAuthType] = useState<AuthType>(initialType);
  const { setAuth } = useAuthStore();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [grade, setGrade] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isUniversity = authType === 'university';

  async function handleSubmit() {
    if (!nickname.trim()) {
      Alert.alert('エラー', 'ニックネームを入力してください');
      return;
    }
    if (nickname.trim().length > 50) {
      Alert.alert('エラー', 'ニックネームは50文字以内で入力してください');
      return;
    }
    if (!email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }
    if (isUniversity && !email.toLowerCase().endsWith('.ac.jp')) {
      Alert.alert('エラー', '大学メールは .ac.jp ドメインのみ有効です');
      return;
    }
    if (password.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で入力してください');
      return;
    }
    if (!agreed) {
      Alert.alert('エラー', 'クラブ規約に同意してください');
      return;
    }

    const gradeNum = GRADE_OPTIONS.indexOf(grade);

    setLoading(true);
    try {
      const res = await api.post<TokenResponse>('/api/auth/signup', {
        nickname: nickname.trim(),
        email: email.trim(),
        password,
        auth_type: authType,
        university: university.trim() || undefined,
        faculty: faculty.trim() || undefined,
        grade: gradeNum >= 0 ? gradeNum + 3 : undefined,
      });
      await setAuth(res);
      navigation.replace('EmailVerifyPending', { email: email.trim() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '入会に失敗しました';
      Alert.alert('エラー', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>入会手続き</Text>

        {/* AuthType セレクター */}
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeCard, isUniversity && styles.typeCardActive]}
            onPress={() => setAuthType('university')}
          >
            <Text style={styles.typeIcon}>🎓</Text>
            <Text style={[styles.typeLabel, isUniversity && styles.typeLabelActive]}>
              正規就活生
            </Text>
            <Text style={styles.typeDesc}>.ac.jp 限定</Text>
            {isUniversity && <View style={styles.typeCheck}><Text style={styles.typeCheckText}>✓</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeCard, !isUniversity && styles.typeCardActive]}
            onPress={() => setAuthType('normal')}
          >
            <Text style={styles.typeIcon}>🕵️</Text>
            <Text style={[styles.typeLabel, !isUniversity && styles.typeLabelActive]}>
              怪しいやつ
            </Text>
            <Text style={styles.typeDesc}>普通メール</Text>
            {!isUniversity && <View style={styles.typeCheck}><Text style={styles.typeCheckText}>✓</Text></View>}
          </TouchableOpacity>
        </View>

        {isUniversity && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              🎓 大学メール認証で正規就活生になれます。チキンレース参加・全リアクション・汚染度システムが解放されます。
            </Text>
          </View>
        )}
        {!isUniversity && (
          <View style={[styles.infoBanner, styles.infoBannerWarning]}>
            <Text style={styles.infoBannerText}>
              🕵️ 普通メールでの入会は一部機能が制限されます。後から大学メールでアップグレード可能です。
            </Text>
          </View>
        )}

        {/* フォーム */}
        <TextInput
          style={styles.input}
          placeholder="ニックネーム（必須・1〜50文字）"
          placeholderTextColor={Colors.muted}
          value={nickname}
          onChangeText={setNickname}
          maxLength={50}
        />
        <TextInput
          style={styles.input}
          placeholder={isUniversity ? '大学メール（.ac.jp 必須）' : 'メールアドレス'}
          placeholderTextColor={Colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="パスワード（8文字以上）"
          placeholderTextColor={Colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="大学名（任意）"
          placeholderTextColor={Colors.muted}
          value={university}
          onChangeText={setUniversity}
        />
        <TextInput
          style={styles.input}
          placeholder="学部（任意）"
          placeholderTextColor={Colors.muted}
          value={faculty}
          onChangeText={setFaculty}
        />

        {/* 学年選択 */}
        <Text style={styles.fieldLabel}>学年（任意）</Text>
        <View style={styles.gradeRow}>
          {GRADE_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.gradeChip, grade === g && styles.gradeChipActive]}
              onPress={() => setGrade(grade === g ? '' : g)}
            >
              <Text style={[styles.gradeChipText, grade === g && styles.gradeChipTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 規約同意 */}
        <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkText}>
            クラブ規約・プライバシーポリシーに同意する
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? '処理中…' : Strings.auth.verifyEmail}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>すでにメンバーの方はこちら</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 60, gap: 12 },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  typeIcon: {
    fontSize: 28,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  typeLabelActive: {
    color: Colors.onPrimary,
  },
  typeDesc: {
    fontSize: 11,
    color: Colors.muted,
  },
  typeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.survival,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCheckText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoBanner: {
    backgroundColor: 'rgba(29,158,117,0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.survival,
  },
  infoBannerWarning: {
    backgroundColor: 'rgba(136,135,128,0.1)',
    borderLeftColor: Colors.muted,
  },
  infoBannerText: {
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: Colors.white,
    color: Colors.primary,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: -4,
  },
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.white,
  },
  gradeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  gradeChipText: {
    fontSize: 13,
    color: Colors.primary,
  },
  gradeChipTextActive: {
    color: Colors.onPrimary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: Colors.onPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkText: {
    fontSize: 13,
    color: Colors.primary,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 13,
    color: Colors.muted,
    textDecorationLine: 'underline',
  },
});
