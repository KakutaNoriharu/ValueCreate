import { create } from 'zustand';
import type { Post } from '../types';

interface PostState {
  feedPosts: Post[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  activeTab: 'all' | 'following';

  setPosts: (posts: Post[], cursor: string | null) => void;
  appendPosts: (posts: Post[], cursor: string | null) => void;
  setActiveTab: (tab: 'all' | 'following') => void;
  setLoading: (loading: boolean) => void;
  prependPost: (post: Post) => void;
  reset: () => void;
}

export const usePostStore = create<PostState>((set) => ({
  feedPosts: [],
  cursor: null,
  hasMore: true,
  isLoading: false,
  activeTab: 'all',

  setPosts: (posts, cursor) =>
    set({ feedPosts: posts, cursor, hasMore: !!cursor }),

  appendPosts: (posts, cursor) =>
    set((state) => ({
      feedPosts: [...state.feedPosts, ...posts],
      cursor,
      hasMore: !!cursor,
    })),

  setActiveTab: (tab) => set({ activeTab: tab, feedPosts: [], cursor: null, hasMore: true }),

  setLoading: (loading) => set({ isLoading: loading }),

  prependPost: (post) =>
    set((state) => ({ feedPosts: [post, ...state.feedPosts] })),

  reset: () => set({ feedPosts: [], cursor: null, hasMore: true }),
}));
