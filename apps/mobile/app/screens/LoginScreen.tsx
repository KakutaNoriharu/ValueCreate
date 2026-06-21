import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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

export default function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<TokenResponse>('/api/auth/login', { email, password });
      await setAuth(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ログインに失敗しました';
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
      <View style={styles.inner}>
        <Text style={styles.heading}>クラブに入る</Text>
        <Text style={styles.sub}>既存メンバーのログイン</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="パスワード"
            placeholderTextColor={Colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? '確認中…' : Strings.auth.login}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>まだメンバーではない方</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('SignUp', { authType: 'university' })}
        >
          <Text style={styles.signupButtonText}>🎓 大学メールで入会する</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signupButtonSecondary}
          onPress={() => navigation.navigate('SignUp', { authType: 'normal' })}
        >
          <Text style={styles.signupButtonSecondaryText}>🕵️ 普通メールで入会する</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    padding: 24,
    paddingTop: 72,
    gap: 12,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sub: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 8,
  },
  form: {
    gap: 12,
    marginTop: 8,
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
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.muted,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  signupButtonText: {
    color: Colors.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  signupButtonSecondary: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  signupButtonSecondaryText: {
    color: Colors.primary,
    fontSize: 15,
  },
});
