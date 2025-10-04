'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { FloatingCard } from '@/components/FloatingCard';
import { TarotLogo } from '@/components/TarotLogo';
import BottomNavigation from '@/components/BottomNavigation';
import { SparklesIcon, Calendar, HelpCircle, Crown, Lock } from 'lucide-react';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { apiService } from '@/services/api';
import { getApiEndpoint } from '@/utils/config';
import { getValidAuthToken } from '@/utils/auth';

const sparklesData = [
  { left: 10, top: 20, delay: 0, duration: 2.5 },
  { left: 85, top: 15, delay: 0.5, duration: 3 },
  { left: 25, top: 80, delay: 1, duration: 2.8 },
  { left: 70, top: 60, delay: 1.5, duration: 3.2 },
  { left: 45, top: 30, delay: 2, duration: 2.7 },
  { left: 90, top: 40, delay: 2.5, duration: 3.1 },
  { left: 15, top: 50, delay: 3, duration: 2.9 },
  { left: 60, top: 85, delay: 3.5, duration: 2.6 },
  { left: 35, top: 10, delay: 4, duration: 3.3 },
  { left: 80, top: 75, delay: 4.5, duration: 2.4 },
  { left: 5, top: 65, delay: 0.2, duration: 2.8 },
  { left: 95, top: 25, delay: 0.7, duration: 3.1 },
  { left: 20, top: 35, delay: 1.2, duration: 2.9 },
  { left: 75, top: 50, delay: 1.7, duration: 2.7 },
  { left: 50, top: 70, delay: 2.2, duration: 3.2 },
];

const SparklesBackground = () => (
  <div className="absolute inset-0">
    {sparklesData.map((sparkle, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-amber-300 rounded-full"
        style={{
          left: `${sparkle.left}%`,
          top: `${sparkle.top}%`,
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
        }}
        transition={{
          duration: sparkle.duration,
          repeat: Infinity,
          delay: sparkle.delay,
        }}
      />
    ))}
  </div>
);

const tarotCards = [
  {
    src: "/rider-waite-tarot/major_arcana_fool.png",
    alt: "Шут"
  },
  {
    src: "/rider-waite-tarot/major_arcana_magician.png",
    alt: "Маг"
  },
  {
    src: "/rider-waite-tarot/major_arcana_priestess.png",
    alt: "Жрица"
  },
  {
    src: "/rider-waite-tarot/major_arcana_empress.png",
    alt: "Императрица"
  },
  {
    src: "/rider-waite-tarot/major_arcana_emperor.png",
    alt: "Император"
  },
  {
    src: "/rider-waite-tarot/major_arcana_lovers.png",
    alt: "Влюбленные"
  },
  {
    src: "/rider-waite-tarot/major_arcana_chariot.png",
    alt: "Колесница"
  },
  {
    src: "/rider-waite-tarot/major_arcana_strength.png",
    alt: "Сила"
  },
  {
    src: "/rider-waite-tarot/major_arcana_hermit.png",
    alt: "Отшельник"
  },
  {
    src: "/rider-waite-tarot/major_arcana_fortune.png",
    alt: "Колесо Фортуны"
  }
];

interface MainScreenProps {
  onOneCard: () => void;
  onThreeCards: () => void;
  onYesNo: () => void;
  activeTab: 'home' | 'history';
  onTabChange: (tab: 'home' | 'history') => void;
}

export function MainScreen({ onOneCard, onThreeCards, onYesNo, activeTab, onTabChange }: MainScreenProps) {
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [showSubscriptionStatus, setShowSubscriptionStatus] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalData, setSubscriptionModalData] = useState<{
    title: string;
    message: string;
    showHistoryMessage?: boolean;
  }>({ title: '', message: '' });

  useEffect(() => {
    // Загружаем информацию о подписке при монтировании
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      console.log('🔄 loadSubscriptionInfo started');
      
      // Получаем валидный токен (из localStorage или через Telegram WebApp)
      const token = await getValidAuthToken();
      console.log('🔑 Token received:', token ? `${token.substring(0, 20)}...` : 'NULL');
      
      if (!token) {
        console.error('❌ No auth token available');
        return;
      }

      const endpoint = getApiEndpoint('/tarot/subscription-status');
      console.log('🌐 Fetching from:', endpoint);

      // Используем endpoint для получения статуса подписки
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error body:', errorText);
      return;
      }
      
      const data = await response.json();
      console.log('📊 Subscription data received:', JSON.stringify(data, null, 2));
      
      if (data.subscriptionInfo) {
        console.log('✅ Setting subscriptionInfo:', data.subscriptionInfo);
        console.log('   - hasSubscription:', data.subscriptionInfo.hasSubscription);
        console.log('   - canUseYesNo:', data.subscriptionInfo.canUseYesNo);
        console.log('   - canUseThreeCards:', data.subscriptionInfo.canUseThreeCards);
        console.log('   - canUseDailyAdvice:', data.subscriptionInfo.canUseDailyAdvice);
        
        setSubscriptionInfo(data.subscriptionInfo);
        setShowSubscriptionStatus(true);
      } else {
        console.error('❌ No subscriptionInfo in response');
      }
    } catch (error) {
      console.error('❌ Error loading subscription info:', error);
    }
  };

  const showSubscriptionModalForFeature = (feature: string) => {
    setSubscriptionModalData({
      title: 'Требуется подписка',
      message: 'Подписка — это ваш доступ к полному функционалу. Оформите её прямо сейчас и продолжайте работу без ограничений.',
      showHistoryMessage: false
    });
    setShowSubscriptionModal(true);
  };

  const handleOneCard = () => {
    if (subscriptionInfo?.canUseDailyAdvice) {
      onOneCard();
    } else {
      showSubscriptionModalForFeature('daily');
    }
  };

  const handleThreeCards = () => {
    if (subscriptionInfo?.canUseThreeCards) {
      onThreeCards();
    } else {
      showSubscriptionModalForFeature('three_cards');
    }
  };

  const handleYesNo = () => {
    if (subscriptionInfo?.canUseYesNo) {
      onYesNo();
    } else {
      showSubscriptionModalForFeature('yesno');
    }
  };

  const handleUpgradeSubscription = () => {
    // Открываем Telegram бота для покупки подписки
    if (typeof window !== 'undefined') {
      window.open('https://t.me/your_bot_username', '_blank');
    }
  };

  const getRemainingCount = (type: string) => {
    if (!subscriptionInfo) return 0;
    
    switch (type) {
      case 'daily':
        return subscriptionInfo.remainingDailyAdvice ?? 0;
      case 'three_cards':
        return subscriptionInfo.remainingThreeCards ?? 0;
      case 'yesno':
        return subscriptionInfo.remainingYesNo ?? 0;
      default:
        return 0;
    }
  };

  const getRemainingText = (type: string) => {
    const remaining = getRemainingCount(type);
    
    // Если у пользователя есть подписка - не показываем счетчик
    if (subscriptionInfo?.hasSubscription) return '';
    
    // Неограниченно (для бесплатных функций с подпиской)
    if (remaining === -1) return '';
    
    // Использовано
    if (remaining === 0) return 'Использовано';
    
    // Осталось N раскладов
    return `Осталось: ${remaining}`;
  };


  return (
    <div className="relative h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background with stars */}
      <div 
        className="absolute inset-0 opacity-20"
            style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1623489956130-64c5f8e84590?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxzdGFycyUyMG5pZ2h0JTIwc2t5JTIwbWFnaWNhbHxlbnwxfHx8fDE3NTc2NjA3NzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Floating sparkles */}
      <SparklesBackground />

      {/* Floating Tarot Cards with elegant shadows */}
      <FloatingCard
        src={tarotCards[0].src}
        alt={tarotCards[0].alt}
        delay={0.5}
        duration={6}
        x={5}
        y={15}
        rotation={-20}
        scale={0.6}
      />
      <FloatingCard
        src={tarotCards[1].src}
        alt={tarotCards[1].alt}
        delay={1.5}
        duration={7}
        x={85}
        y={25}
        rotation={25}
        scale={0.5}
      />
      <FloatingCard
        src={tarotCards[0].src}
        alt={tarotCards[0].alt}
        delay={2.5}
        duration={5.5}
        x={90}
        y={65}
        rotation={-15}
        scale={0.4}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between px-4 py-6 pt-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo and Title */}
          <motion.div
            className="flex-1 flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TarotLogo size="sm" showText={false} animated={true} />
            <div>
              <h1 className="text-xl text-white">Выберите расклад</h1>
              <p className="text-xs text-gray-300">Откройте тайны будущего</p>
            </div>
          </motion.div>

        </motion.div>

        {/* Subscription Status */}
        {showSubscriptionStatus && subscriptionInfo && (
          <motion.div
            className="px-4 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <SubscriptionStatus
              subscriptionInfo={subscriptionInfo}
              onUpgrade={handleUpgradeSubscription}
              compact={true}
            />
          </motion.div>
        )}

        {/* Reading Options */}
        <div className="flex-1 flex flex-col items-center justify-start px-6 pt-4 space-y-6">
          <motion.div
            className="w-full max-w-sm space-y-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* One Card Button */}
            <motion.div 
              whileHover={{ scale: subscriptionInfo?.canUseDailyAdvice ? 1.02 : 1 }} 
              whileTap={{ scale: subscriptionInfo?.canUseDailyAdvice ? 0.98 : 1 }}
              className="relative"
            >
              <Button
                onClick={handleOneCard}
                className={`w-full h-20 text-white border-2 rounded-3xl shadow-xl transition-all duration-300 backdrop-blur-sm ${
                  subscriptionInfo?.canUseDailyAdvice
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 border-amber-400/30 hover:border-amber-400/50 hover:shadow-2xl'
                    : 'bg-slate-800/30 border-slate-600/30 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-6 w-full pl-2">
                  <div className={`p-3 rounded-2xl border flex-shrink-0 ${
                    subscriptionInfo?.canUseDailyAdvice
                      ? 'bg-amber-600/20 border-amber-400/30'
                      : 'bg-slate-600/20 border-slate-500/30'
                  }`}>
                    {subscriptionInfo?.canUseDailyAdvice ? (
                      <SparklesIcon className="w-6 h-6 text-amber-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                          <div className="text-left flex-1">
                            <div className={`text-lg font-semibold ${
                              subscriptionInfo?.canUseDailyAdvice ? 'text-white' : 'text-slate-400'
                            }`}>Одна карта</div>
                            <div className={`text-sm ${
                              subscriptionInfo?.canUseDailyAdvice ? 'text-gray-300' : 'text-slate-500'
                            }`}>Совет дня</div>
                            {!subscriptionInfo?.hasSubscription && (
                              <div className="text-xs text-amber-400 mt-1">
                                {getRemainingText('daily')}
                              </div>
                            )}
                          </div>
              </div>
              </Button>
              
              {/* Tooltip */}
              {showTooltip === 'daily' && (
                <motion.div
                  className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800/90 text-white text-xs px-3 py-2 rounded-lg border border-slate-600/30 shadow-lg backdrop-blur-sm z-50 max-w-xs text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                            Подписка — это ваш доступ к полному функционалу. Оформите её прямо сейчас и продолжайте работу без ограничений.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800/90"></div>
                </motion.div>
              )}
            </motion.div>

            {/* Yes/No Button */}
            <motion.div 
              whileHover={{ scale: subscriptionInfo?.canUseYesNo ? 1.02 : 1 }} 
              whileTap={{ scale: subscriptionInfo?.canUseYesNo ? 0.98 : 1 }}
              className="relative"
            >
              <Button
                onClick={handleYesNo}
                className={`w-full h-20 text-white border-2 rounded-3xl shadow-xl transition-all duration-300 backdrop-blur-sm ${
                  subscriptionInfo?.canUseYesNo
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 border-emerald-400/30 hover:border-emerald-400/50 hover:shadow-2xl'
                    : 'bg-slate-800/30 border-slate-600/30 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-6 w-full pl-2">
                  <div className={`p-3 rounded-2xl border flex-shrink-0 ${
                    subscriptionInfo?.canUseYesNo
                      ? 'bg-emerald-600/20 border-emerald-400/30'
                      : 'bg-slate-600/20 border-slate-500/30'
                  }`}>
                    {subscriptionInfo?.canUseYesNo ? (
                      <HelpCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                          <div className="text-left flex-1">
                            <div className={`text-lg font-semibold ${
                              subscriptionInfo?.canUseYesNo ? 'text-white' : 'text-slate-400'
                            }`}>Да/Нет</div>
                            <div className={`text-sm ${
                              subscriptionInfo?.canUseYesNo ? 'text-gray-300' : 'text-slate-500'
                            }`}>Быстрый ответ</div>
                            {!subscriptionInfo?.hasSubscription && (
                              <div className="text-xs text-emerald-400 mt-1">
                                {getRemainingText('yesno')}
                              </div>
                            )}
                          </div>
              </div>
              </Button>
              
              {/* Tooltip */}
              {showTooltip === 'yesno' && (
                <motion.div
                  className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800/90 text-white text-xs px-3 py-2 rounded-lg border border-slate-600/30 shadow-lg backdrop-blur-sm z-50 max-w-xs text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                            Подписка — это ваш доступ к полному функционалу. Оформите её прямо сейчас и продолжайте работу без ограничений.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800/90"></div>
                </motion.div>
              )}
            </motion.div>

            {/* Three Cards Button */}
            <motion.div 
              whileHover={{ scale: subscriptionInfo?.canUseThreeCards ? 1.02 : 1 }} 
              whileTap={{ scale: subscriptionInfo?.canUseThreeCards ? 0.98 : 1 }}
              className="relative"
            >
              <Button
                onClick={handleThreeCards}
                className={`w-full h-20 text-white border-2 rounded-3xl shadow-xl transition-all duration-300 backdrop-blur-sm ${
                  subscriptionInfo?.canUseThreeCards
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 border-purple-400/30 hover:border-purple-400/50 hover:shadow-2xl'
                    : 'bg-slate-800/30 border-slate-600/30 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-6 w-full pl-2">
                  <div className={`p-3 rounded-2xl border flex-shrink-0 ${
                    subscriptionInfo?.canUseThreeCards
                      ? 'bg-purple-600/20 border-purple-400/30'
                      : 'bg-slate-600/20 border-slate-500/30'
                  }`}>
                    {subscriptionInfo?.canUseThreeCards ? (
                      <Calendar className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                          <div className="text-left flex-1">
                            <div className={`text-lg font-semibold ${
                              subscriptionInfo?.canUseThreeCards ? 'text-white' : 'text-slate-400'
                            }`}>Три карты</div>
                            <div className={`text-sm ${
                              subscriptionInfo?.canUseThreeCards ? 'text-gray-300' : 'text-slate-500'
                            }`}>Прошлое–Настоящее–Будущее</div>
                            {!subscriptionInfo?.hasSubscription && (
                              <div className="text-xs text-purple-400 mt-1">
                                {getRemainingText('three_cards')}
                              </div>
                            )}
                          </div>
            </div>
              </Button>
              
              {/* Tooltip */}
              {showTooltip === 'three_cards' && (
                <motion.div
                  className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800/90 text-white text-xs px-3 py-2 rounded-lg border border-slate-600/30 shadow-lg backdrop-blur-sm z-50 max-w-xs text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                            Подписка — это ваш доступ к полному функционалу. Оформите её прямо сейчас и продолжайте работу без ограничений.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800/90"></div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Mystical decoration */}
          <motion.div
            className="text-3xl text-amber-400/60 mt-8"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            ✦ ❋ ✦
          </motion.div>
        </div>

        {/* Bottom Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
        </motion.div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title={subscriptionModalData.title}
        message={subscriptionModalData.message}
        showHistoryMessage={subscriptionModalData.showHistoryMessage}
      />
    </div>
  );
}

export default MainScreen;