'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { TarotLogo } from '@/components/TarotLogo';
import BottomNavigation from '@/components/BottomNavigation';
import { SparklesIcon, Calendar, HelpCircle, Lock, Loader2, AlertCircle } from 'lucide-react';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { BlockedTarotModal } from '@/components/BlockedTarotModal';
import {
  bootstrapSubscriptionStatus,
  getTarotAvailability,
  type TarotAvailability,
  type TarotType,
  useSubscriptionStatus,
} from '@/state/subscriptionStore';

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
        style={{ left: `${sparkle.left}%`, top: `${sparkle.top}%` }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
        transition={{ duration: sparkle.duration, repeat: Infinity, delay: sparkle.delay }}
      />
    ))}
  </div>
);

interface HomeScreenProps {
  activeTab: 'home' | 'history';
  onTabChange: (tab: 'home' | 'history') => void;
  onOneCard: () => void;
  onYesNo: () => void;
  onThreeCards: () => void;
}

export const MainScreen = ({ activeTab, onTabChange, onOneCard, onYesNo, onThreeCards }: HomeScreenProps) => {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedType, setBlockedType] = useState<TarotType>('daily');
  const [blockedNextAvailableAt, setBlockedNextAvailableAt] = useState<Date | undefined>(undefined);

  const { loaded, loading, subscriptionInfo, error } = useSubscriptionStatus();
  const loadError = !loaded && !loading && !!error;
  const isStatusLoading = !loaded && !loadError;

  const dailyAvail = getTarotAvailability('daily');
  const yesNoAvail = getTarotAvailability('yesNo');
  const threeCardsAvail = getTarotAvailability('threeCards');

  const handleOpenSubscriptionModal = () => setIsSubscriptionModalOpen(true);
  const handleCloseSubscriptionModal = () => setIsSubscriptionModalOpen(false);

  const openBlockedModal = (type: TarotType) => {
    const availability = getTarotAvailability(type);
    setBlockedType(type);
    setBlockedNextAvailableAt(availability.nextAvailableAt);
    setBlockedModalOpen(true);
  };

  const closeBlockedModal = () => setBlockedModalOpen(false);

  const getStatusText = (type: TarotType, avail: TarotAvailability) => {
    if (loadError) return '';
    if (isStatusLoading) return 'Загрузка...';
    if (subscriptionInfo?.hasSubscription) return '';
    if (avail.allowed) return 'Доступно';
    if (avail.nextAvailableAt) {
      const ms = avail.nextAvailableAt.getTime() - Date.now();
      const hours = Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
      return `Использовано (осталось ${hours} ч)`;
    }
    return 'Использовано';
  };

  const onTarotClick = (type: TarotType, start: () => void) => {
    if (!loaded || loadError) return;
    const availability = getTarotAvailability(type);
    if (!availability.allowed) {
      openBlockedModal(type);
      return;
    }
    start();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-between pt-20 pb-16">
      <SparklesBackground />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4">
        <TarotLogo />
        <h1 className="text-3xl font-bold mt-4 mb-2 text-center">AI-Таролог</h1>
        <p className="text-gray-300 text-center mb-8">Ваш личный проводник в мир Таро</p>

        {loadError && (
          <div className="w-full max-w-sm mb-4 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4 text-center">
            <p className="text-amber-200 text-sm mb-3">{error}</p>
            <Button
              type="button"
              onClick={() => bootstrapSubscriptionStatus({ force: true })}
              className="w-full bg-amber-600/30 hover:bg-amber-600/40 text-amber-100 border border-amber-400/40 rounded-xl py-2"
            >
              Повторить
            </Button>
          </div>
        )}

        <div className="w-full max-w-sm space-y-4 mt-8">
          <motion.div
            whileHover={{ scale: dailyAvail.allowed ? 1.02 : 1 }}
            whileTap={{ scale: dailyAvail.allowed ? 0.98 : 1 }}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => onTarotClick('daily', onOneCard)}
              className={`w-full h-20 text-white border-2 rounded-3xl shadow-xl transition-all duration-300 backdrop-blur-sm ${
                isStatusLoading || loadError
                  ? 'bg-slate-800/40 border-slate-600/30 cursor-wait'
                  : dailyAvail.allowed
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 border-amber-400/30 hover:border-amber-400/50 hover:shadow-2xl cursor-pointer'
                    : 'bg-slate-800/30 border-slate-600/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-6 w-full pl-2">
                <div
                  className={`p-3 rounded-2xl border flex-shrink-0 ${
                    isStatusLoading || loadError
                      ? 'bg-slate-600/20 border-slate-500/30'
                      : dailyAvail.allowed
                        ? 'bg-amber-600/20 border-amber-400/30'
                        : 'bg-slate-600/20 border-slate-500/30'
                  }`}
                >
                  {isStatusLoading ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : loadError ? (
                    <AlertCircle className="w-6 h-6 text-amber-400/80" />
                  ) : dailyAvail.allowed ? (
                    <SparklesIcon className="w-6 h-6 text-amber-400" />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className={`text-lg font-semibold ${isStatusLoading || loadError ? 'text-slate-300' : dailyAvail.allowed ? 'text-white' : 'text-slate-400'}`}>
                    Одна карта
                  </div>
                  <div className={`text-sm ${isStatusLoading || loadError ? 'text-slate-500' : dailyAvail.allowed ? 'text-gray-300' : 'text-slate-500'}`}>
                    Совет дня
                  </div>
                  {(!subscriptionInfo?.hasSubscription || isStatusLoading) && (
                    <div className="text-xs text-amber-400 mt-1">{getStatusText('daily', dailyAvail)}</div>
                  )}
                </div>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: yesNoAvail.allowed ? 1.02 : 1 }}
            whileTap={{ scale: yesNoAvail.allowed ? 0.98 : 1 }}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => onTarotClick('yesNo', onYesNo)}
              className={`w-full h-20 text-white border-2 rounded-3xl shadow-xl transition-all duration-300 backdrop-blur-sm ${
                isStatusLoading || loadError
                  ? 'bg-slate-800/40 border-slate-600/30 cursor-wait'
                  : yesNoAvail.allowed
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 border-emerald-400/30 hover:border-emerald-400/50 hover:shadow-2xl'
                    : 'bg-slate-800/30 border-slate-600/30 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-6 w-full pl-2">
                <div
                  className={`p-3 rounded-2xl border flex-shrink-0 ${
                    isStatusLoading || loadError
                      ? 'bg-slate-600/20 border-slate-500/30'
                      : yesNoAvail.allowed
                        ? 'bg-emerald-600/20 border-emerald-400/30'
                        : 'bg-slate-600/20 border-slate-500/30'
                  }`}
                >
                  {isStatusLoading ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : loadError ? (
                    <AlertCircle className="w-6 h-6 text-emerald-400/80" />
                  ) : yesNoAvail.allowed ? (
                    <HelpCircle className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className={`text-lg font-semibold ${isStatusLoading || loadError ? 'text-slate-300' : yesNoAvail.allowed ? 'text-white' : 'text-slate-400'}`}>
                    Да/Нет
                  </div>
                  <div className={`text-sm ${isStatusLoading || loadError ? 'text-slate-500' : yesNoAvail.allowed ? 'text-gray-300' : 'text-slate-500'}`}>
                    Быстрый ответ
                  </div>
                  {(!subscriptionInfo?.hasSubscription || isStatusLoading) && (
                    <div className="text-xs text-emerald-400 mt-1">{getStatusText('yesNo', yesNoAvail)}</div>
                  )}
                </div>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: threeCardsAvail.allowed ? 1.02 : 1 }}
            whileTap={{ scale: threeCardsAvail.allowed ? 0.98 : 1 }}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={() => onTarotClick('threeCards', onThreeCards)}
              className={`w-full h-20 text-white border-2 rounded-3xl shadow-xl transition-all duration-300 backdrop-blur-sm ${
                isStatusLoading || loadError
                  ? 'bg-slate-800/40 border-slate-600/30 cursor-wait'
                  : threeCardsAvail.allowed
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 border-purple-400/30 hover:border-purple-400/50 hover:shadow-2xl'
                    : 'bg-slate-800/30 border-slate-600/30 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-6 w-full pl-2">
                <div
                  className={`p-3 rounded-2xl border flex-shrink-0 ${
                    isStatusLoading || loadError
                      ? 'bg-slate-600/20 border-slate-500/30'
                      : threeCardsAvail.allowed
                        ? 'bg-purple-600/20 border-purple-400/30'
                        : 'bg-slate-600/20 border-slate-500/30'
                  }`}
                >
                  {isStatusLoading ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : loadError ? (
                    <AlertCircle className="w-6 h-6 text-purple-400/80" />
                  ) : threeCardsAvail.allowed ? (
                    <Calendar className="w-6 h-6 text-purple-400" />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className={`text-lg font-semibold ${isStatusLoading || loadError ? 'text-slate-300' : threeCardsAvail.allowed ? 'text-white' : 'text-slate-400'}`}>
                    Три карты
                  </div>
                  <div className={`text-sm ${isStatusLoading || loadError ? 'text-slate-500' : threeCardsAvail.allowed ? 'text-gray-300' : 'text-slate-500'}`}>
                    Прошлое–Настоящее–Будущее
                  </div>
                  {(!subscriptionInfo?.hasSubscription || isStatusLoading) && (
                    <div className="text-xs text-purple-400 mt-1">{getStatusText('threeCards', threeCardsAvail)}</div>
                  )}
                </div>
              </div>
            </Button>
          </motion.div>
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={handleCloseSubscriptionModal}
        title="Требуется подписка"
        message="Подписка — это ваш доступ к полному функционалу. Оформите её прямо сейчас и продолжайте работу без ограничений."
      />

      <BlockedTarotModal
        isOpen={blockedModalOpen}
        onClose={closeBlockedModal}
        tarotType={blockedType}
        nextAvailableAt={blockedNextAvailableAt}
      />
    </div>
  );
};

export default MainScreen;
