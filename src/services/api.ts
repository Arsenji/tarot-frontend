import { cache, historyCache, dailyAdviceCache, getCurrentDate } from '@/utils/cache';
import { getAccessToken } from '@/utils/auth';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  subscriptionRequired?: boolean;
  subscriptionInfo?: {
    hasSubscription: boolean;
    isExpired: boolean;
    canUseYesNo: boolean;
    canUseThreeCards: boolean;
    canUseDailyAdvice: boolean;
    historyLimit: number;
    freeDailyAdviceUsed: boolean;
    freeYesNoUsed: boolean;
    freeThreeCardsUsed: boolean;
    remainingDailyAdvice: number;
    remainingYesNo: number;
    remainingThreeCards: number;
    cooldowns?: {
      dailyAdviceMsRemaining: number;
      yesNoMsRemaining: number;
      threeCardsMsRemaining: number;
      dailyAdviceHoursRemaining: number;
      yesNoHoursRemaining: number;
      threeCardsHoursRemaining: number;
    };
  };
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

export interface DailyAdviceResponse {
  advice: string;
  card: TarotCard;
}

export interface YesNoResponse {
  readingId: string;
  question: string;
  card: {
    name: string;
    imagePath: string;
    keywords: string;
    meaning: string;
    advice: string;
    isMajorArcana: boolean;
    suit: string;
    number: number;
  };
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
    const startTime = performance.now();
    
    try {
      const token = getAccessToken();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      const duration = performance.now() - startTime;
      const success = response.ok;

      const serverResponse = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        // unify subscriptionRequired handling
        if (response.status === 403) {
          return {
            success: false,
            data: null as T,
            error: (serverResponse as any).error || `HTTP error! status: ${response.status}`,
            subscriptionRequired: (serverResponse as any).subscriptionRequired !== false,
            subscriptionInfo: (serverResponse as any).subscriptionInfo,
          };
        }
        throw new Error((serverResponse as any).error || `HTTP error! status: ${response.status}`);
      }
      
      // Если сервер возвращает структуру { success: true, data: ... }, извлекаем data
      if (serverResponse.success && serverResponse.data) {
        return { 
          success: true, 
          data: serverResponse.data,
          subscriptionRequired: serverResponse.subscriptionRequired,
          subscriptionInfo: serverResponse.subscriptionInfo
        };
      }
      
      // Иначе возвращаем весь ответ
      return { 
        success: true, 
        data: serverResponse,
        subscriptionRequired: serverResponse.subscriptionRequired,
        subscriptionInfo: serverResponse.subscriptionInfo
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
    // Отключаем кэширование для получения разных карт каждый раз
    const response = await this.request<DailyAdviceResponse>('/api/tarot/daily-advice', {
      method: 'POST',
    });

    return response;
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
    card: TarotCard,
    interpretation: string,
    category: string,
    readingId?: string
  ): Promise<ApiResponse<{ answer: string; card: TarotCard }>> {
    return this.request<{ answer: string; card: TarotCard }>('/api/tarot/clarifying-answer', {
      method: 'POST',
      body: JSON.stringify({ question, card, interpretation, category, readingId }),
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

  async getHistory(): Promise<ApiResponse<{ readings: any[] }>> {
    // Делаем запрос напрямую (не используем кэш для проверки подписки)
    const response = await this.request<{ readings: any[] }>('/api/tarot/history', {
      method: 'GET',
    });

    // Сохраняем в кэш только при успешном ответе и наличии подписки
    if (response.success && response.data && !response.subscriptionRequired) {
      historyCache.set(response.data.readings);
    } else if (response.subscriptionRequired) {
      // Очищаем кэш при отсутствии подписки
      historyCache.clear();
    }

    return response;
  }

  // Fast tarot availability (used for UI locking)
  async getTarotSubscriptionStatus(): Promise<ApiResponse<{ subscriptionInfo: any }>> {
    return this.request<{ subscriptionInfo: any }>('/api/tarot/subscription-status', {
      method: 'GET',
    });
  }

  // Новые методы для управления подписками
  async registerUser(userData: {
    telegramId: number;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
  }): Promise<ApiResponse<{ user: any; subscriptionInfo: any }>> {
    return this.request<{ user: any; subscriptionInfo: any }>('/api/subscription/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  }

  async getSubscriptionStatus(userId: string): Promise<ApiResponse<{ subscriptionInfo: any }>> {
    return this.request<{ subscriptionInfo: any }>(`/api/subscription/${userId}/status`, {
      method: 'GET',
    });
  }

  async useSpread(userId: string, spreadType: 'daily' | 'yesno' | 'three_cards'): Promise<ApiResponse<{ subscriptionInfo: any }>> {
    return this.request<{ subscriptionInfo: any }>(`/api/subscription/${userId}/use-spread`, {
      method: 'POST',
      body: JSON.stringify({ spreadType }),
    });
  }

  async activateSubscription(userId: string, subscriptionExpiry: string): Promise<ApiResponse<{ subscriptionInfo: any }>> {
    return this.request<{ subscriptionInfo: any }>(`/api/subscription/${userId}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionExpiry }),
    });
  }
}

export const apiService = new ApiService();
