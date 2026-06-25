import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { AuthStackScreenProps } from '../navigation/types';
import { useAuthStore } from '../../stores/authStore';

export default function EmailVerifyPendingScreen({
  route,
}: AuthStackScreenProps<'EmailVerifyPending'>) {
  const { email } = route.params;
  const { logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✉️</Text>
      <Text style={styles.title}>メールを確認してください</Text>
      <Text style={styles.description}>
        {`${email} に確認メールを送りました。\nメールのリンクをクリックしてメンバー登録を完了してください。`}
      </Text>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>届かない場合</Text>
        <Text style={styles.noteText}>
          • 迷惑メールフォルダをご確認ください{'\n'}
          • メールアドレスを確認して再度入会してください
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await logout();
        }}
      >
        <Text style={styles.logoutButtonText}>別のアカウントで入会する</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  icon: {
    fontSize: 72,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  noteText: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.muted,
    fontSize: 14,
  },
  backButton: {
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
