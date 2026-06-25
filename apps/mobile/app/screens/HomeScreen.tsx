import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { usePostStore } from '../../stores/postStore';
import type { Post, ReactionType, SurvivorStats } from '../../types';
import PostCard from '../../components/PostCard';
import type { MainTabScreenProps } from '../navigation/types';

interface FeedResponse {
  posts: Post[];
  cursor: string | null;
}

export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const user = useAuthStore((s) => s.user);
  const { feedPosts, cursor, hasMore, isLoading, activeTab, setPosts, appendPosts, setActiveTab, setLoading } =
    usePostStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SurvivorStats | null>(null);
  const initialLoaded = useRef(false);

  async function loadFeed(reset = false) {
    if (isLoading && !reset) return;
    setLoading(true);
    try {
      const c = reset ? undefined : (cursor ?? undefined);
      const res = await api.get<FeedResponse>(
        `/api/posts/feed?tab=${activeTab}${c ? `&cursor=${encodeURIComponent(c)}` : ''}`,
      );
      if (reset) {
        setPosts(res.posts, res.cursor);
      } else {
        appendPosts(res.posts, res.cursor);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const s = await api.get<SurvivorStats>('/api/stats/survivors');
      setStats(s);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (!initialLoaded.current) {
      initialLoaded.current = true;
      loadFeed(true);
      loadStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadFeed(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadFeed(true), loadStats()]);
    setRefreshing(false);
  }

  async function handleReact(postId: string, type: ReactionType) {
    try {
      await api.post(`/api/posts/${postId}/reactions?reaction_type=${type}`);
      await loadFeed(true);
    } catch {
      // silent
    }
  }

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading) loadFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, cursor]);

  const ListHeader = (
    <View>
      {/* SurvivorBanner */}
      <View style={styles.survivorBanner}>
        <View style={styles.survivorStat}>
          <Text style={styles.survivorNumber}>{stats?.survivor_count?.toLocaleString() ?? '—'}</Text>
          <Text style={styles.survivorLabel}>生存者</Text>
        </View>
        <View style={styles.survivorDivider} />
        <View style={styles.survivorStat}>
          <Text style={[styles.survivorNumber, { color: Colors.contamination }]}>
            {stats?.today_eliminated?.toLocaleString() ?? '—'}
          </Text>
          <Text style={styles.survivorLabel}>本日の脱落</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['all', 'following'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'all' ? '全体' : 'フォロー中'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick post bar */}
      <TouchableOpacity
        style={styles.quickPost}
        onPress={() => navigation.navigate('Post')}
        activeOpacity={0.7}
      >
        <Text style={styles.quickPostText}>今日もサボった？記録する…</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>NNC</Text>
        <Text style={styles.headerSub}>{Strings.appFullName}</Text>
      </View>

      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.post_id}
        renderItem={({ item }) => (
          <PostCard post={item} onReact={handleReact} />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛋️</Text>
              <Text style={styles.emptyText}>まだ投稿がありません</Text>
              <Text style={styles.emptySubText}>最初のサボりを記録しよう</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading ? <ActivityIndicator style={styles.loader} color={Colors.muted} /> : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={feedPosts.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.onPrimary,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  survivorBanner: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 32,
  },
  survivorStat: {
    alignItems: 'center',
  },
  survivorNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.survival,
  },
  survivorLabel: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  survivorDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.topTabIndicator,
  },
  tabLabel: {
    fontSize: 14,
    color: Colors.topTabInactive,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.topTabActive,
    fontWeight: '700',
  },
  quickPost: {
    margin: 12,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickPostText: {
    fontSize: 14,
    color: Colors.muted,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.muted,
  },
  loader: {
    marginVertical: 24,
  },
});
