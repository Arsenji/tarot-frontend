/**
 * Утилиты для работы с аутентификацией через Telegram WebApp
 */

import { getApiEndpoint } from './config';

export interface AuthTokenData {
  token: string;
  userId: string;
  telegramId: number;
  expires: number;
}

// ✅ TEMP_FALLBACK_TOKEN УДАЛЕН!
// Backend /api/auth/telegram работает стабильно
// Все пользователи получают токены динамически через Telegram WebApp initData

/**
 * Получение токена аутентификации через Telegram WebApp
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    console.log('🔐 getAuthToken called');
    
    // Сначала проверяем, есть ли токен в localStorage
    let token = localStorage.getItem('authToken');
    console.log('📦 Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NULL');
    
    if (!token) {
      console.log('🔍 No token in localStorage, checking Telegram WebApp...');
      
      // ✅ FIX: Добавляем retry логику для ожидания инициализации Telegram WebApp
      let initData: string | null = null;
      const maxRetries = 3;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        console.log(`🔄 Attempt ${attempt + 1}/${maxRetries} to get Telegram initData`);
        console.log('Window available:', typeof window !== 'undefined');
        console.log('Telegram object:', !!(window as any).Telegram);
        console.log('Telegram.WebApp:', !!(window as any).Telegram?.WebApp);
        console.log('Telegram.WebApp.initData:', !!(window as any).Telegram?.WebApp?.initData);
        
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
          initData = (window as any).Telegram.WebApp.initData;
          console.log('✅ initData found on attempt', attempt + 1);
          break;
        }
        
        // Если не последняя попытка, ждем 200ms перед следующей
        if (attempt < maxRetries - 1) {
          console.log('⏳ Waiting 200ms before retry...');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      if (typeof window !== 'undefined' && initData) {
        console.log('✅ initData available:', initData ? `${initData.substring(0, 50)}...` : 'EMPTY');
        
        const endpoint = getApiEndpoint('/auth/telegram');
        console.log('🌐 Requesting token from:', endpoint);
        
        try {
          // Добавляем timeout 60 секунд (для cold start на Render)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // ⚡ УМЕНЬШЕНО до 20 сек
          
          console.log('⏱️ Timeout set: 20 seconds (waiting for backend cold start)');
          
          const authResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const responseTime = Date.now();
          console.log('📡 Auth response status:', authResponse.status);
          console.log('⏱️ Response time: ~' + Math.round((responseTime - Date.now()) / 1000) + 's (should be fast)');
          
          if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('✅ Auth successful, token received');
            token = authData.token;
            
            // Сохраняем токен в localStorage
            localStorage.setItem('authToken', token);
            if (authData.expires) {
              localStorage.setItem('tokenExpires', authData.expires.toString());
            }
            console.log('💾 Token saved to localStorage');
          } else {
            const errorText = await authResponse.text();
            console.error('❌ Auth response failed:', authResponse.status, authResponse.statusText);
            console.error('Error body:', errorText);
            console.error('🚨 Cannot authenticate - backend returned error');
            return null;
          }
        } catch (error) {
          console.error('❌ Auth request failed:', error);
          
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.error('⏱️ TIMEOUT after 20 seconds - backend is not responding!');
              console.error('🚨 This indicates a serious backend problem:');
              console.error('   1. Backend is sleeping (cold start)');
              console.error('   2. MongoDB connection timeout');
              console.error('   3. Неправильный MONGODB_URI на Render');
              console.error('📋 CHECK BACKEND LOGS ON RENDER!');
              
              // ✅ FIX: Показываем пользователю понятное сообщение
              if (typeof window !== 'undefined') {
                alert('⚠️ Сервер временно недоступен\n\nПопробуйте обновить страницу через 30 секунд.\nЕсли проблема повторяется - обратитесь в поддержку.');
              }
            } else {
              console.error('🌐 Network error:', error.message);
            }
          }
          
          console.error('🚨 Cannot authenticate - no fallback available');
          return null;
        }
      } else {
        console.error('❌ Telegram WebApp not available or no initData');
        console.error('🚨 Cannot authenticate without Telegram WebApp');
        return null;
      }
    } else {
      console.log('✅ Using existing token from localStorage');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
};

/**
 * Проверка валидности токена
 */
export const isTokenValid = (): boolean => {
  try {
    const token = localStorage.getItem('authToken');
    const expires = localStorage.getItem('tokenExpires');
    
    if (!token || !expires) return false;
    
    const now = Date.now();
    return now < parseInt(expires);
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

/**
 * Очистка токенов
 */
export const clearAuthTokens = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpires');
};

/**
 * Получение токена с автоматическим обновлением
 */
export const getValidAuthToken = async (): Promise<string | null> => {
  console.log('🔑 getValidAuthToken called');
  
  const tokenValid = isTokenValid();
  console.log('Token valid:', tokenValid);
  
  if (!tokenValid) {
    console.log('Token invalid or missing, clearing old tokens...');
    clearAuthTokens();
  }
  
  return await getAuthToken();
};
