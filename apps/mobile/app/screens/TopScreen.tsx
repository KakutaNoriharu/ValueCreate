import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import type { AuthStackScreenProps } from '../navigation/types';
import { api } from '../../services/api';
import type { SurvivorStats } from '../../types';

interface ObituaryPreview {
  post_id: string;
  content: string;
  created_at: string;
  user: { user_id: string; nickname: string; character_stage: string } | null;
}

const CLUB_RULES = [
  '就活を始めた者は即時追放',
  '内定を取った者は永久追放',
  '最後まで残った者が優勝',
];

export default function TopScreen({ navigation }: AuthStackScreenProps<'Top'>) {
  const [stats, setStats] = useState<SurvivorStats | null>(null);
  const [obituaries, setObituaries] = useState<ObituaryPreview[]>([]);

  useEffect(() => {
    api.get<SurvivorStats>('/api/stats/survivors').then(setStats).catch(() => {});
    api.get<ObituaryPreview[]>('/api/posts/obituaries/recent').then(setObituaries).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.icon}>⚰️</Text>
        <Text style={styles.title}>内定ないクラブへようこそ</Text>
        <Text style={styles.subtitle}>内定取れば即サービス出禁</Text>

        {/* 生存者カウンター */}
        <View style={styles.counterCard}>
          {stats ? (
            <>
              <Text style={styles.counterLabel}>現在の生存者</Text>
              <Text style={styles.counterNumber}>{stats.survivor_count.toLocaleString()}人</Text>
              <Text style={styles.counterSub}>本日の脱落者 {stats.today_eliminated}人</Text>
            </>
          ) : (
            <ActivityIndicator color={Colors.onPrimary} />
          )}
        </View>
      </View>

      {/* CTA ボタン */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SignUp', { authType: 'university' })}
        >
          <Text style={styles.primaryButtonText}>🎓 大学メールで入会</Text>
          <Text style={styles.primaryButtonSub}>正規就活生として参加</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SignUp', { authType: 'normal' })}
        >
          <Text style={styles.secondaryButtonText}>🕵️ 普通メールで入会</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButtonText}>すでにメンバーの方はこちら →</Text>
        </TouchableOpacity>
      </View>

      {/* クラブの掟 */}
      <View style={styles.rulesSection}>
        <Text style={styles.sectionTitle}>クラブの掟</Text>
        {CLUB_RULES.map((rule, i) => (
          <View key={i} style={styles.ruleRow}>
            <Text style={styles.ruleNumber}>{i + 1}</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>

      {/* 最新の訃報フィード */}
      {obituaries.length > 0 && (
        <View style={styles.obituarySection}>
          <Text style={styles.sectionTitle}>最新の訃報</Text>
          {obituaries.map((post) => (
            <View key={post.post_id} style={styles.obituaryCard}>
              <Text style={styles.obituaryUser}>@{post.user?.nickname ?? '名無し'}</Text>
              <Text style={styles.obituaryContent} numberOfLines={2}>
                {post.content}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* フッター入会ボタン */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SignUp', { authType: 'university' })}
        >
          <Text style={styles.primaryButtonText}>大学メールで入会する</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SignUp', { authType: 'normal' })}
        >
          <Text style={styles.secondaryButtonText}>普通メールで入会する</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  icon: {
    fontSize: 72,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.onPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  counterCard: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  counterLabel: {
    fontSize: 12,
    color: Colors.muted,
  },
  counterNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.survival,
    marginVertical: 4,
  },
  counterSub: {
    fontSize: 12,
    color: Colors.contamination,
  },
  ctaSection: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: Colors.onPrimary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonSub: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.onPrimary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  loginButton: {
    alignItems: 'center',
    padding: 8,
  },
  loginButtonText: {
    color: Colors.muted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  rulesSection: {
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.contamination,
    width: 28,
  },
  ruleText: {
    fontSize: 15,
    color: Colors.onPrimary,
    flex: 1,
    lineHeight: 22,
  },
  obituarySection: {
    marginHorizontal: 24,
    marginBottom: 32,
    gap: 10,
  },
  obituaryCard: {
    backgroundColor: 'rgba(226,75,74,0.12)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.contamination,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  obituaryUser: {
    fontSize: 12,
    color: Colors.contamination,
    fontWeight: '600',
  },
  obituaryContent: {
    fontSize: 13,
    color: Colors.onPrimary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
  },
});
