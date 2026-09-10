import { create } from 'zustand';
import { WalletState, CheckInStreak } from '../types/wallet';
import { Movie } from '../types/movie';
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
  botResponses,
} from '../mocks/mockData';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
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
  claimDailyCheckIn: () => boolean;
  setWalletBalance: (main: number, bonus: number) => void;

  // Movie
  currentMovie: Movie;
  unlockEpisode: (episodeId: string) => { success: boolean; error?: string };

  // Subscription
  subscription: UserSubscription;
  toggleAutoRenew: () => void;
  cancelSubscription: () => void;

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
}

export const useAppStore = create<AppState>((set, get) => ({
  // ===== AUTH & USER =====
  // Default unauthenticated so user can see guest landing / login banner
  isAuthenticated: false,
  user: null,
  isAuthModalOpen: false,
  authModalMode: 'login',
  initialAuthEmail: '',

  openAuthModal: (mode = 'login', email = '') =>
    set({ isAuthModalOpen: true, authModalMode: mode, initialAuthEmail: email }),

  closeAuthModal: () => set({ isAuthModalOpen: false }),

  login: (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Check demo credentials
    if (trimmedEmail === 'userdemo@gmail.com' && password === '1') {
      const demoUser: UserProfile = {
        id: 'user-demo-001',
        name: 'Phạm Xuân Lộc (Demo User)',
        email: 'userdemo@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        role: 'vip',
        isVIP: true,
        vipExpiresAt: '2026-10-01',
        createdAt: '2026-01-01',
      };

      set({
        isAuthenticated: true,
        user: demoUser,
        isVIPMode: true,
        isAuthModalOpen: false,
        subscription: mockSubscriptionVIP,
        wallet: mockWallet,
      });

      return { success: true };
    }

    // Allow any other valid email/password
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
        wallet: { mainCoin: 50, bonusCoin: 20 },
      });

      return { success: true };
    }

    return { success: false, error: 'Email hoặc mật khẩu không chính xác. Thử lại với userdemo@gmail.com / 1' };
  },

  register: (name, email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password || !trimmedName) {
      return { success: false, error: 'Vui lòng điền đầy đủ thông tin đăng ký!' };
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

    return { success: true };
  },

  logout: () => {
    set({
      isAuthenticated: false,
      user: null,
      isVIPMode: false,
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
  isVIPMode: true,
  toggleVIPMode: () =>
    set((state) => {
      const newIsVIP = !state.isVIPMode;
      return {
        isVIPMode: newIsVIP,
        user: state.user ? { ...state.user, isVIP: newIsVIP } : null,
        subscription: newIsVIP
          ? mockSubscriptionVIP
          : {
              plan: null,
              status: 'none' as const,
              startDate: null,
              endDate: null,
              autoRenew: false,
              paymentMethod: '',
            },
      };
    }),

  // ===== WALLET =====
  wallet: mockWallet,
  checkInStreak: mockCheckInStreak,

  claimDailyCheckIn: () => {
    const state = get();
    if (state.checkInStreak.todayClaimed) return false;

    const todayDay = state.checkInStreak.days.find((d) => d.isToday);
    if (!todayDay) return false;

    const reward = todayDay.reward;

    set((s) => ({
      wallet: {
        ...s.wallet,
        bonusCoin: s.wallet.bonusCoin + reward,
      },
      checkInStreak: {
        ...s.checkInStreak,
        todayClaimed: true,
        currentStreak: s.checkInStreak.currentStreak + 1,
        lastCheckInDate: new Date().toISOString().split('T')[0],
        days: s.checkInStreak.days.map((d) =>
          d.isToday ? { ...d, claimed: true } : d
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

  unlockEpisode: (episodeId: string) => {
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
  subscription: mockSubscriptionVIP,

  toggleAutoRenew: () =>
    set((s) => ({
      subscription: {
        ...s.subscription,
        autoRenew: !s.subscription.autoRenew,
      },
    })),

  cancelSubscription: () =>
    set((s) => ({
      subscription: {
        ...s.subscription,
        autoRenew: false,
        status: 'cancelled' as const,
      },
    })),

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

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        content: botResponses['default'],
        timestamp: new Date().toISOString(),
      };
      set((s) => ({ chatMessages: [...s.chatMessages, botMsg] }));
    }, 1000);
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
  setCheckInModalOpen: (open) => set({ isCheckInModalOpen: open }),

  isUnlockModalOpen: false,
  selectedEpisodeId: null,
  openUnlockModal: (episodeId) => set({ isUnlockModalOpen: true, selectedEpisodeId: episodeId }),
  closeUnlockModal: () => set({ isUnlockModalOpen: false, selectedEpisodeId: null }),

  isTopUpModalOpen: false,
  setTopUpModalOpen: (open) => set({ isTopUpModalOpen: open }),
}));
