import { historyCache } from '@/utils/cache';
import { getAccessToken } from '@/utils/auth';
import type { WalletInfo } from '@/state/tokenStore';
import type { TokenPackageId } from '@/constants/tokenPackages';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
  insufficientTokens?: boolean;
  required?: number;
  balance?: number;
  walletInfo?: WalletInfo;
  tokensBalance?: number;
  reason?: string;
  cooldown?: {
    msRemaining?: number;
    hoursRemaining?: number;
    nextAvailableAt?: string;
  };
  payment?: {
    id: string;
    paymentId: string;
    confirmationUrl: string;
    amount: string;
    currency: string;
    tokenPackage: TokenPackageId;
  };
  tokensSpent?: number;
  usedFree?: boolean;
  fallback?: boolean;
}

export interface TarotCard {
  name: string;
  image?: string;
  keywords: string;
  advice: string;
  meaning: string;
  isMajorArcana: boolean;
  suit: string;
  number: number;
  detailedDescription?: {
    general: string;
    love: string;
    career: string;
    personal: string;
    reversed?: string;
    displayDescription?: string;
  };
}

export interface ApiCard {
  name: string;
  image?: string;
  imagePath?: string;
  uprightImage?: string;
  reversedImage?: string;
  isReversed?: boolean;
  keywords?: string;
  meaning?: string;
  advice?: string;
  uprightInterpretation?: string;
  reversedInterpretation?: string;
  isMajorArcana?: boolean;
  category?: string;
  suit?: string;
  number?: number;
}

export interface DailyAdviceResponse {
  advice: string;
  card: ApiCard;
}

export interface YesNoResponse {
  readingId: string;
  question: string;
  card: ApiCard;
  answer: string;
  interpretation: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://tarot-tg-backend.onrender.com'
      : 'http://localhost:3001';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = getAccessToken();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      const serverResponse = await response.json().catch(() => ({} as Record<string, unknown>));

      const walletInfo = serverResponse.walletInfo as WalletInfo | undefined;
      const tokensBalance = serverResponse.tokensBalance as number | undefined;
      const tokensSpent = serverResponse.tokensSpent as number | undefined;
      const usedFree = serverResponse.usedFree as boolean | undefined;
      const fallback = serverResponse.fallback as boolean | undefined;
      const cooldown = serverResponse.cooldown as ApiResponse<T>['cooldown'];

      const extras = { walletInfo, tokensBalance, tokensSpent, usedFree, fallback, cooldown };

      if (!response.ok) {
        if (response.status === 402) {
          return {
            success: false,
            data: null as T,
            error: (serverResponse.error as string) || 'Insufficient tokens',
            code: (serverResponse.code as string) || 'INSUFFICIENT_TOKENS',
            insufficientTokens: true,
            required: serverResponse.required as number | undefined,
            balance: serverResponse.balance as number | undefined,
            ...extras,
          };
        }

        if (response.status === 403) {
          return {
            success: false,
            data: null as T,
            error: (serverResponse.error as string) || `HTTP error! status: ${response.status}`,
            reason: serverResponse.reason as string | undefined,
            cooldown: serverResponse.cooldown as ApiResponse<T>['cooldown'],
            ...extras,
          };
        }

        throw new Error((serverResponse.error as string) || `HTTP error! status: ${response.status}`);
      }

      if (serverResponse.success && serverResponse.data) {
        return {
          success: true,
          data: serverResponse.data as T,
          ...extras,
        };
      }

      return {
        success: true,
        data: serverResponse as T,
        ...extras,
      };
    } catch (error) {
      console.error('API request failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        data: null as T,
        error: errorMessage,
      };
    }
  }

  async getDailyAdvice(): Promise<ApiResponse<DailyAdviceResponse>> {
    return this.request<DailyAdviceResponse>('/api/tarot/daily-advice', {
      method: 'POST',
    });
  }

  async getThreeCardsReading(category: string, userQuestion?: string): Promise<ApiResponse<{
    readingId: string;
    cards: TarotCard[];
    interpretation: string;
    category: string;
  }>> {
    return this.request<{
      readingId: string;
      cards: TarotCard[];
      interpretation: string;
      category: string;
    }>('/api/tarot/three-cards', {
      method: 'POST',
      body: JSON.stringify({ category, userQuestion }),
    });
  }

  async getYesNoAnswer(question: string): Promise<ApiResponse<YesNoResponse>> {
    return this.request<YesNoResponse>('/api/tarot/yes-no', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getClarifyingAnswer(
    question: string,
    card: TarotCard | ApiCard | Record<string, unknown>,
    interpretation: string,
    category: string,
    readingId?: string,
    originalQuestion?: string
  ): Promise<ApiResponse<{ answer: string; card: ApiCard; yesNoAnswer?: 'Да' | 'Нет'; data?: { answer: string; card: ApiCard; yesNoAnswer?: 'Да' | 'Нет' } }>> {
    return this.request<{ answer: string; card: ApiCard; yesNoAnswer?: 'Да' | 'Нет'; data?: { answer: string; card: ApiCard; yesNoAnswer?: 'Да' | 'Нет' } }>('/api/tarot/clarifying-answer', {
      method: 'POST',
      body: JSON.stringify({
        clarifyingQuestion: question,
        originalCard: card,
        originalInterpretation: interpretation,
        readingType: category,
        readingId,
        originalQuestion,
      }),
    });
  }

  async saveClarifyingQuestion(
    readingId: string,
    question: string,
    card: TarotCard,
    interpretation: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/api/tarot/clarifying-question', {
      method: 'POST',
      body: JSON.stringify({ readingId, question, card, interpretation }),
    });
  }

  async getCardDetailedDescription(cardName: string, category: string): Promise<ApiResponse<{ description: string }>> {
    return this.request<{ description: string }>('/api/tarot/card-details', {
      method: 'POST',
      body: JSON.stringify({ cardName, category }),
    });
  }

  async getHistory(): Promise<ApiResponse<{ readings: unknown[] }>> {
    const response = await this.request<{ readings: unknown[] }>('/api/tarot/history', {
      method: 'GET',
    });

    const raw = response.data as { readings?: unknown[] } | null;
    const topLevel = response as unknown as { readings?: unknown[] };
    const readings = raw?.readings ?? topLevel.readings ?? [];

    const normalized: ApiResponse<{ readings: unknown[] }> = {
      ...response,
      data: { readings },
    };

    if (normalized.success) {
      historyCache.set(readings);
    }

    return normalized;
  }

  async getWalletStatus(): Promise<ApiResponse<WalletInfo>> {
    return this.request<WalletInfo>('/api/tarot/wallet-status', {
      method: 'GET',
    });
  }

  /** @deprecated alias for getWalletStatus */
  async getTarotSubscriptionStatus(): Promise<ApiResponse<{ walletInfo: WalletInfo }>> {
    const resp = await this.getWalletStatus();
    return {
      ...resp,
      data: resp.walletInfo ? { walletInfo: resp.walletInfo } : (resp.data as { walletInfo: WalletInfo }),
    };
  }

  async createTokenPayment(tokenPackage: TokenPackageId): Promise<ApiResponse<{ payment: NonNullable<ApiResponse<unknown>['payment']> }>> {
    const resp = await this.request<{ payment: NonNullable<ApiResponse<unknown>['payment']> }>(
      '/api/subscription/create-payment',
      {
        method: 'POST',
        body: JSON.stringify({ tokenPackage }),
      }
    );

    const payment =
      resp.data?.payment ??
      (resp as unknown as { payment?: NonNullable<ApiResponse<unknown>['payment']> }).payment;

    return { ...resp, payment };
  }

  async getTokenPackages(): Promise<ApiResponse<{ packages: unknown[] }>> {
    return this.request<{ packages: unknown[] }>('/api/subscription/packages', {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
