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
      console.log('Window available:', typeof window !== 'undefined');
      console.log('Telegram object:', !!(window as any).Telegram);
      console.log('Telegram.WebApp:', !!(window as any).Telegram?.WebApp);
      console.log('Telegram.WebApp.initData:', !!(window as any).Telegram?.WebApp?.initData);
      
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
        const initData = (window as any).Telegram.WebApp.initData;
        console.log('✅ initData available:', initData ? `${initData.substring(0, 50)}...` : 'EMPTY');
        
        const endpoint = getApiEndpoint('/auth/telegram');
        console.log('🌐 Requesting token from:', endpoint);
        
        const authResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData })
        });
        
        console.log('📡 Auth response status:', authResponse.status);
        
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
        }
      } else {
        console.error('❌ Telegram WebApp not available or no initData');
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
