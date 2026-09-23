import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletState, CheckInStreak } from '../types/wallet';
import { Movie, WatchHistoryItem } from '../types/movie';
import { UserSubscription } from '../types/subscription';
import { Transaction } from '../types/transaction';
import { ChatMessage, ChatPhase, SupportTicket } from '../types/chat';
import { UserProfile } from '../types/auth';
import {
  mockWallet,
  mockCheckInStreak,
  mockSubscriptionVIP,
  mockMovie,
  mockTransactions,
  mockInitialMessages,
  mockWatchHistory,
  botResponses,
  allMockMovies,
} from '../mocks/mockData';
import {
  authService,
  movieService,
  walletService,
  subscriptionService,
  chatService,
} from '../services';
import { apiClient } from '../services/apiClient';
import {
  adaptApiMovieToMovie,
  adaptApiWalletToWallet,
  adaptApiCheckInToStreak,
  adaptUserProfile,
} from '../lib/apiAdapter';
import { getTodayDayIndex, getTodayDateString } from '../utils/date';

export const emptySubscription: UserSubscription = {
  plan: null,
  status: 'none',
  startDate: null,
  endDate: null,
  autoRenew: false,
  paymentMethod: '',
};

interface AppState {
  // Movies Data & Loading
  movies: Movie[];
  isLoadingMovies: boolean;
  loadInitialData: () => Promise<void>;
  fetchMovies: (params?: { search?: string; genre?: string }) => Promise<void>;

  // Auth
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string; role?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string; role?: string }>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  initialAuthEmail: string;
  openAuthModal: (mode?: 'login' | 'register', email?: string) => void;
  closeAuthModal: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // VIP Mode
  isVIPMode: boolean;
  toggleVIPMode: () => void;

  // Wallet
  wallet: WalletState;
  checkInStreak: CheckInStreak;
  claimDailyCheckIn: () => Promise<boolean>;
  syncCheckInStreak: () => void;
  setWalletBalance: (main: number, bonus: number) => void;

  // Movie
  currentMovie: Movie;
  unlockEpisode: (episodeId: string) => Promise<{ success: boolean; error?: string }>;

  // Subscription
  subscription: UserSubscription;
  toggleAutoRenew: () => Promise<void>;
  cancelSubscription: () => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;

  // Chat
  chatMessages: ChatMessage[];
  chatPhase: ChatPhase;
  chatIsOpen: boolean;
  chatTicket: SupportTicket | null;
  estimatedWaitMinutes: number;
  toggleChat: () => void;
  sendMessage: (content: string) => void;
  handleQuickAction: (actionId: string) => void;
  escalateToAgent: () => void;

  // Modals
  isCheckInModalOpen: boolean;
  setCheckInModalOpen: (open: boolean) => void;
  isUnlockModalOpen: boolean;
  selectedEpisodeId: string | null;
  openUnlockModal: (episodeId: string) => void;
  closeUnlockModal: () => void;
  isTopUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;

  // My List
  myList: string[];
  toggleMyList: (movieId: string) => void;

  // Watch History
  watchHistory: WatchHistoryItem[];
  addToWatchHistory: (item: Omit<WatchHistoryItem, 'id' | 'lastWatchedAt'>) => void;

  // Deposit
  depositCoins: (amountVnd: number, mainCoin: number, bonusCoin: number, paymentMethod: string) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ===== MOVIES & DATA LOADING =====
      movies: allMockMovies,
      isLoadingMovies: false,

      loadInitialData: async () => {
        try {
          set({ isLoadingMovies: true });

          const moviesRes = await movieService.listMovies({ limit: 20 });

          const updates: Partial<AppState> = { isLoadingMovies: false };

          if (moviesRes.success && moviesRes.data) {
            const rawList = Array.isArray(moviesRes.data)
              ? moviesRes.data
              : (moviesRes.data as any).items || (moviesRes.data as any).data || [];
            if (Array.isArray(rawList) && rawList.length > 0) {
              const adaptedMovies = rawList.map(adaptApiMovieToMovie);
              updates.movies = adaptedMovies;
              if (adaptedMovies[0]) {
                updates.currentMovie = adaptedMovies[0];
              }
            }
          }

          set(updates);
        } catch (e) {
          console.warn('loadInitialData fallback to local data:', e);
          set({ isLoadingMovies: false });
        }
      },

      fetchMovies: async (params) => {
        try {
          set({ isLoadingMovies: true });
          const res = await movieService.listMovies(params);
          if (res.success && res.data) {
            const rawList = Array.isArray(res.data)
              ? res.data
              : (res.data as any).items || (res.data as any).data || [];
            if (Array.isArray(rawList) && rawList.length > 0) {
              set({ movies: rawList.map(adaptApiMovieToMovie), isLoadingMovies: false });
              return;
            }
          }
          set({ isLoadingMovies: false });
        } catch (e) {
          set({ isLoadingMovies: false });
        }
      },

      // ===== AUTH & USER =====
      isAuthenticated: false,
      user: null,
      isAuthModalOpen: false,
      authModalMode: 'login',
      initialAuthEmail: '',

      openAuthModal: (mode = 'login', email = '') =>
        set({ isAuthModalOpen: true, authModalMode: mode, initialAuthEmail: email }),

      closeAuthModal: () => set({ isAuthModalOpen: false }),

      login: async (email, password) => {
        const trimmedEmail = email.trim().toLowerCase();

        // 1. Chặn tài khoản Maker / Checker trên Mobile - chỉ hỗ trợ trên Web Studio
        if (trimmedEmail === 'creator@gmail.com' || trimmedEmail === 'reviewer@gmail.com') {
          return {
            success: false,
            error: 'Tài khoản Sản xuất & Kiểm duyệt (Maker/Checker) chỉ hỗ trợ trên phiên bản Web Studio máy tính. Ứng dụng di động chỉ dành riêng cho Khán giả!',
          };
        }

        try {
          // 2. Tra cứu tài khoản trực tiếp từ database thật của Backend (/api/users)
          const usersRes = await apiClient.get('/users');
          if (usersRes.success && Array.isArray(usersRes.data)) {
            const dbUser = usersRes.data.find(
              (u: any) => u.email?.toLowerCase() === trimmedEmail
            );
            if (dbUser) {
              const profile = adaptUserProfile(dbUser);
              const isVip = trimmedEmail === 'vipdemo@gmail.com' || profile.role === 'vip' || profile.isVIP;

              set({
                isAuthenticated: true,
                user: {
                  ...profile,
                  role: isVip ? 'vip' : 'user',
                  isVIP: isVip,
                },
                isVIPMode: isVip,
                isAuthModalOpen: false,
                subscription: isVip ? mockSubscriptionVIP : emptySubscription,
              });

              return {
                success: true,
                redirectUrl: '/',
                role: isVip ? 'vip' : 'user',
              };
            }
          }
        } catch (e) {
          console.warn('Database user lookup failed, falling back:', e);
        }

        // 3. Fallback Demo accounts
        if (trimmedEmail === 'userdemo@gmail.com' && password === '1') {
          const demoUser: UserProfile = {
            id: '7315fdbf-081a-4f18-9273-41b50dc93928',
            name: 'Phạm Xuân Lộc (Khán Giả)',
            email: 'userdemo@gmail.com',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            role: 'user',
            isVIP: false,
            createdAt: '2026-01-01',
          };

          set({
            isAuthenticated: true,
            user: demoUser,
            isVIPMode: false,
            isAuthModalOpen: false,
            subscription: emptySubscription,
          });

          return { success: true, redirectUrl: '/', role: 'user' };
        }

        if (trimmedEmail === 'vipdemo@gmail.com' && password === '1') {
          const vipUser: UserProfile = {
            id: 'fe9b4427-c5b0-4b3a-85f0-4406d56eb3b6',
            name: 'Phạm Xuân Lộc (Khán Giả VIP)',
            email: 'vipdemo@gmail.com',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            role: 'vip',
            isVIP: true,
            vipExpiresAt: '2026-10-01',
            createdAt: '2026-01-01',
          };

          set({
            isAuthenticated: true,
            user: vipUser,
            isVIPMode: true,
            isAuthModalOpen: false,
            subscription: mockSubscriptionVIP,
          });

          return { success: true, redirectUrl: '/', role: 'vip' };
        }

        if (trimmedEmail && password) {
          const customUser: UserProfile = {
            id: `user-${Date.now()}`,
            name: trimmedEmail.split('@')[0] || 'Khán giả AI',
            email: trimmedEmail,
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            role: 'user',
            isVIP: false,
            createdAt: new Date().toISOString(),
          };

          set({
            isAuthenticated: true,
            user: customUser,
            isVIPMode: false,
            isAuthModalOpen: false,
            subscription: emptySubscription,
          });

          return { success: true, redirectUrl: '/', role: 'user' };
        }

        return { success: false, error: 'Email hoặc mật khẩu không chính xác. Thử lại với userdemo@gmail.com / 1' };
      },

      register: async (name, email, password) => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        if (!trimmedEmail || !password || !trimmedName) {
          return { success: false, error: 'Vui lòng điền đầy đủ thông tin đăng ký!' };
        }

        try {
          const res = await authService.register({ name: trimmedName, email: trimmedEmail, password });
          if (res.success && res.data) {
            const profile = adaptUserProfile(res.data.user);
            set({
              isAuthenticated: true,
              user: profile,
              isVIPMode: false,
              isAuthModalOpen: false,
              subscription: emptySubscription,
            });

            get().addTransaction({
              type: 'checkin',
              typeLabel: 'Quà tân thủ',
              description: 'Tặng 50 Coin Thưởng chào mừng thành viên mới AI Cinema Mobile',
              mainCoinDelta: 0,
              bonusCoinDelta: 50,
              totalAmount: 50,
              status: 'success',
              statusLabel: 'Thành công',
            });

            return { success: true, redirectUrl: '/', role: 'user' };
          }
        } catch (e) {
          console.warn('API register error, falling back:', e);
        }

        const newUser: UserProfile = {
          id: `user-reg-${Date.now()}`,
          name: trimmedName,
          email: trimmedEmail,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          role: 'user',
          isVIP: false,
          createdAt: new Date().toISOString(),
        };

        set({
          isAuthenticated: true,
          user: newUser,
          isVIPMode: false,
          isAuthModalOpen: false,
          subscription: emptySubscription,
          wallet: {
            mainCoin: 0,
            bonusCoin: 50,
          },
        });

        get().addTransaction({
          type: 'checkin',
          typeLabel: 'Quà tân thủ',
          description: 'Tặng 50 Coin Thưởng chào mừng thành viên mới AI Cinema Mobile',
          mainCoinDelta: 0,
          bonusCoinDelta: 50,
          totalAmount: 50,
          status: 'success',
          statusLabel: 'Thành công',
        });

        return { success: true, redirectUrl: '/', role: 'user' };
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (e) {
          console.warn('Logout error:', e);
        }
        set({
          isAuthenticated: false,
          user: null,
          isVIPMode: false,
          subscription: emptySubscription,
        });
      },

      // ===== THEME (Default Pure White Light Mode) =====
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: nextTheme });
      },

      // ===== VIP MODE =====
      isVIPMode: false,
      toggleVIPMode: () =>
        set((state) => {
          const newIsVIP = !state.isVIPMode;
          return {
            isVIPMode: newIsVIP,
            user: state.user ? { ...state.user, isVIP: newIsVIP } : null,
            subscription: newIsVIP ? mockSubscriptionVIP : emptySubscription,
          };
        }),

      // ===== WALLET & CHECK-IN (PERSISTENT) =====
      wallet: mockWallet,
      checkInStreak: mockCheckInStreak,

      syncCheckInStreak: () => {
        const todayIdx = getTodayDayIndex();
        const todayStr = getTodayDateString();
        set((s) => {
          const current = s.checkInStreak || mockCheckInStreak;
          const isTodayClaimed = current.lastCheckInDate === todayStr && current.todayClaimed;
          const updatedDays = current.days.map((d, idx) => ({
            ...d,
            isToday: idx === todayIdx,
            claimed: idx < todayIdx ? true : idx === todayIdx ? isTodayClaimed : false,
          }));
          return {
            checkInStreak: {
              ...current,
              todayClaimed: isTodayClaimed,
              currentStreak: isTodayClaimed ? Math.max(current.currentStreak, todayIdx + 1) : Math.max(current.currentStreak, todayIdx),
              days: updatedDays,
            },
          };
        });
      },

      claimDailyCheckIn: async () => {
        const state = get();
        const todayIdx = getTodayDayIndex();
        const todayStr = getTodayDateString();

        if (state.checkInStreak.todayClaimed && state.checkInStreak.lastCheckInDate === todayStr) {
          return false;
        }

        const todayDay =
          state.checkInStreak.days[todayIdx] ||
          state.checkInStreak.days.find((d) => d.isToday);
        const reward = todayDay ? todayDay.reward : 10;

        try {
          await walletService.checkIn();
        } catch (e) {
          console.warn('claimDailyCheckIn API fallback:', e);
        }

        // Cập nhật State bền vững (được persist tự động vào AsyncStorage / localStorage)
        set((s) => ({
          wallet: {
            ...s.wallet,
            bonusCoin: s.wallet.bonusCoin + reward,
          },
          checkInStreak: {
            ...s.checkInStreak,
            todayClaimed: true,
            currentStreak: Math.max(s.checkInStreak.currentStreak, todayIdx + 1),
            lastCheckInDate: todayStr,
            days: s.checkInStreak.days.map((d, idx) =>
              idx === todayIdx || d.isToday ? { ...d, claimed: true, isToday: true } : d
            ),
          },
        }));

        get().addTransaction({
          type: 'checkin',
          typeLabel: 'Điểm danh',
          description: `Điểm danh nhận thưởng +${reward} Coin`,
          mainCoinDelta: 0,
          bonusCoinDelta: reward,
          totalAmount: reward,
          status: 'success',
          statusLabel: 'Thành công',
        });

        return true;
      },

      setWalletBalance: (main, bonus) =>
        set((s) => ({ wallet: { ...s.wallet, mainCoin: main, bonusCoin: bonus } })),

      // ===== MOVIE =====
      currentMovie: mockMovie,

      unlockEpisode: async (episodeId: string) => {
        const state = get();
        const episode = state.currentMovie.episodes.find((ep) => ep.id === episodeId);
        if (!episode) return { success: false, error: 'Tập phim không tồn tại' };
        if (episode.isUnlocked || episode.isFree) return { success: true };

        const price = episode.price;
        const { mainCoin, bonusCoin } = state.wallet;
        const total = mainCoin + bonusCoin;

        if (total < price) {
          return { success: false, error: `Số dư không đủ. Cần ${price} Coin, hiện có ${total} Coin.` };
        }

        try {
          await walletService.unlockEpisode({
            movieId: state.currentMovie.id,
            episodeId,
          });
        } catch (e) {
          console.warn('unlockEpisode API fallback:', e);
        }

        let mainDeduct = Math.min(mainCoin, price);
        let bonusDeduct = price - mainDeduct;

        set((s) => ({
          wallet: {
            mainCoin: s.wallet.mainCoin - mainDeduct,
            bonusCoin: s.wallet.bonusCoin - bonusDeduct,
          },
          currentMovie: {
            ...s.currentMovie,
            episodes: s.currentMovie.episodes.map((ep) =>
              ep.id === episodeId ? { ...ep, isUnlocked: true } : ep
            ),
          },
        }));

        get().addTransaction({
          type: 'episode_purchase',
          typeLabel: 'Mua tập phim',
          description: `Mở khóa "${state.currentMovie.title}" - Tập ${episode.episodeNumber}: ${episode.title}`,
          mainCoinDelta: -mainDeduct,
          bonusCoinDelta: -bonusDeduct,
          totalAmount: -price,
          status: 'success',
          statusLabel: 'Thành công',
          episodeInfo: `${state.currentMovie.title} - Tập ${episode.episodeNumber}`,
        });

        return { success: true };
      },

      // ===== SUBSCRIPTION =====
      subscription: emptySubscription,

      toggleAutoRenew: async () => {
        const nextVal = !get().subscription.autoRenew;
        try {
          await subscriptionService.toggleAutoRenew(nextVal);
        } catch (e) {
          console.warn('toggleAutoRenew API fallback:', e);
        }
        set((s) => ({
          subscription: {
            ...s.subscription,
            autoRenew: nextVal,
          },
        }));
      },

      cancelSubscription: async () => {
        try {
          await subscriptionService.cancelSubscription();
        } catch (e) {
          console.warn('cancelSubscription API fallback:', e);
        }
        set((s) => ({
          subscription: {
            ...s.subscription,
            autoRenew: false,
            status: 'cancelled' as const,
          },
        }));
      },

      // ===== TRANSACTIONS =====
      transactions: mockTransactions,

      addTransaction: (tx) => {
        const id = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
          Math.floor(Math.random() * 1000)
        ).padStart(3, '0')}`;
        const newTx: Transaction = {
          ...tx,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          transactions: [newTx, ...s.transactions],
        }));
      },

      // ===== CHAT =====
      chatMessages: mockInitialMessages,
      chatPhase: 'bot' as ChatPhase,
      chatIsOpen: false,
      chatTicket: null,
      estimatedWaitMinutes: 5,

      toggleChat: () => set((s) => ({ chatIsOpen: !s.chatIsOpen })),

      sendMessage: (content: string) => {
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'user',
          content,
          timestamp: new Date().toISOString(),
        };

        set((s) => ({ chatMessages: [...s.chatMessages, userMsg] }));

        chatService
          .sendMessage(content)
          .then((res) => {
            const reply = res.data?.content || botResponses['default'];
            const botMsg: ChatMessage = {
              id: `msg-${Date.now()}`,
              sender: 'bot',
              content: reply,
              timestamp: new Date().toISOString(),
            };
            set((s) => ({ chatMessages: [...s.chatMessages, botMsg] }));
          })
          .catch(() => {
            const botMsg: ChatMessage = {
              id: `msg-${Date.now()}`,
              sender: 'bot',
              content: botResponses['default'],
              timestamp: new Date().toISOString(),
            };
            set((s) => ({ chatMessages: [...s.chatMessages, botMsg] }));
          });
      },

      handleQuickAction: (actionId: string) => {
        const actionLabels: Record<string, string> = {
          'coin-error': 'Tôi gặp lỗi trừ Coin',
          'cancel-renew': 'Tôi muốn hủy gia hạn tự động',
          'report': 'Tôi muốn báo cáo vi phạm',
        };

        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'user',
          content: actionLabels[actionId] || actionId,
          timestamp: new Date().toISOString(),
        };

        set((s) => ({ chatMessages: [...s.chatMessages, userMsg] }));

        setTimeout(() => {
          const botMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: 'bot',
            content: botResponses[actionId] || botResponses['default'],
            timestamp: new Date().toISOString(),
          };
          set((s) => ({ chatMessages: [...s.chatMessages, botMsg] }));
        }, 1000);
      },

      escalateToAgent: () => {
        const state = get();
        const ticket: SupportTicket = {
          id: `TK-${Date.now()}`,
          summary: state.chatMessages
            .filter((m) => m.sender === 'user')
            .map((m) => m.content)
            .join(' | '),
          userMessages: state.chatMessages.filter((m) => m.sender === 'user').map((m) => m.content),
          createdAt: new Date().toISOString(),
        };

        const systemMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'system',
          content: `📋 Đã tạo phiếu hỗ trợ #${ticket.id}. Đang kết nối Chuyên viên...`,
          timestamp: new Date().toISOString(),
        };

        set({
          chatPhase: 'waiting',
          chatTicket: ticket,
          chatMessages: [...state.chatMessages, systemMsg],
          estimatedWaitMinutes: Math.floor(Math.random() * 5) + 3,
        });
      },

      // ===== MODALS =====
      isCheckInModalOpen: false,
      setCheckInModalOpen: (open) => {
        if (open) {
          get().syncCheckInStreak();
        }
        set({ isCheckInModalOpen: open });
      },

      isUnlockModalOpen: false,
      selectedEpisodeId: null,
      openUnlockModal: (episodeId) => set({ isUnlockModalOpen: true, selectedEpisodeId: episodeId }),
      closeUnlockModal: () => set({ isUnlockModalOpen: false, selectedEpisodeId: null }),

      isTopUpModalOpen: false,
      setTopUpModalOpen: (open) => set({ isTopUpModalOpen: open }),

      // ===== MY LIST =====
      myList: ['movie-001', 'movie-002'],
      toggleMyList: (movieId) =>
        set((s) => ({
          myList: s.myList.includes(movieId)
            ? s.myList.filter((id) => id !== movieId)
            : [...s.myList, movieId],
        })),

      // ===== WATCH HISTORY =====
      watchHistory: mockWatchHistory,
      addToWatchHistory: (item) =>
        set((s) => {
          const existing = s.watchHistory.filter((h) => h.movieId !== item.movieId);
          const newItem: WatchHistoryItem = {
            ...item,
            id: `wh-${Date.now()}`,
            lastWatchedAt: 'Vừa xong',
          };
          return { watchHistory: [newItem, ...existing] };
        }),

      // ===== DEPOSIT COINS =====
      depositCoins: async (amountVnd, mainCoin, bonusCoin, paymentMethod) => {
        try {
          await walletService.deposit({
            amountVnd,
            mainCoin,
            bonusCoin,
            paymentMethod,
          });
        } catch (e) {
          console.warn('depositCoins API fallback:', e);
        }

        set((s) => ({
          wallet: {
            mainCoin: s.wallet.mainCoin + mainCoin,
            bonusCoin: s.wallet.bonusCoin + bonusCoin,
          },
        }));

        get().addTransaction({
          type: 'deposit',
          typeLabel: 'Nạp Coin',
          description: `Nạp gói ${amountVnd.toLocaleString('vi-VN')}đ qua ${paymentMethod}`,
          mainCoinDelta: mainCoin,
          bonusCoinDelta: bonusCoin,
          totalAmount: mainCoin + bonusCoin,
          status: 'success',
          statusLabel: 'Thành công',
        });
      },
    }),
    {
      name: 'ai_cinema_mobile_app_store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && typeof state.syncCheckInStreak === 'function') {
          state.syncCheckInStreak();
        }
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isVIPMode: state.isVIPMode,
        wallet: state.wallet,
        checkInStreak: state.checkInStreak,
        subscription: state.subscription,
        transactions: state.transactions,
        myList: state.myList,
        watchHistory: state.watchHistory,
        theme: state.theme,
      }),
    }
  )
);
