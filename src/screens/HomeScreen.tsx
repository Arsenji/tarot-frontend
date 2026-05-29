'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { TarotLogo } from '@/components/TarotLogo';
import BottomNavigation from '@/components/BottomNavigation';
import { TokenBalance } from '@/components/TokenBalance';
import { TokenShopModal } from '@/components/TokenShopModal';
import { InsufficientTokensModal } from '@/components/InsufficientTokensModal';
import { BlockedTarotModal } from '@/components/BlockedTarotModal';
import { SparklesIcon, Calendar, HelpCircle, Lock, Loader2, AlertCircle } from 'lucide-react';
import {
  bootstrapWalletStatus,
  getTarotAvailability,
  type TarotAvailability,
  type TarotType,
  useWalletStatus,
} from '@/state/tokenStore';

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
  const [tokenShopOpen, setTokenShopOpen] = useState(false);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const [blockedType, setBlockedType] = useState<TarotType>('daily');
  const [blockedNextAvailableAt, setBlockedNextAvailableAt] = useState<Date | undefined>(undefined);
  const [insufficientCost, setInsufficientCost] = useState<number | undefined>(undefined);

  const { loaded, loading, walletInfo, error } = useWalletStatus();
  const loadError = !loaded && !loading && !!error;
  const isStatusLoading = !loaded && !loadError;

  const dailyAvail = getTarotAvailability('daily');
  const yesNoAvail = getTarotAvailability('yesNo');
  const threeCardsAvail = getTarotAvailability('threeCards');

  const openBlockedModal = (type: TarotType, avail: TarotAvailability) => {
    if (avail.reason === 'insufficient_tokens') {
      setBlockedType(type);
      setInsufficientCost(avail.tokenCost);
      setInsufficientModalOpen(true);
      return;
    }
    setBlockedType(type);
    setBlockedNextAvailableAt(avail.nextAvailableAt);
    setBlockedModalOpen(true);
  };

  const getStatusText = (type: TarotType, avail: TarotAvailability) => {
    if (loadError) return '';
    if (isStatusLoading) return 'Загрузка...';
    if (avail.allowed) {
      if (type === 'daily') return 'Бесплатно';
      if (type === 'yesNo') {
        if (walletInfo && walletInfo.freeYesNoRemaining > 0) {
          return `Бесплатно (${walletInfo.freeYesNoRemaining}/3)`;
        }
        return `${walletInfo?.yesNoTokenCost ?? 5} токенов`;
      }
      if (walletInfo && walletInfo.freeThreeCardsRemaining > 0) {
        return `Бесплатно (${walletInfo.freeThreeCardsRemaining}/3)`;
      }
      return `${walletInfo?.threeCardsTokenCost ?? 10} токенов`;
    }
    if (avail.reason === 'insufficient_tokens') return 'Нужны токены';
    if (avail.nextAvailableAt) {
      const ms = avail.nextAvailableAt.getTime() - Date.now();
      const hours = Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
      return `Через ${hours} ч`;
    }
    return 'Недоступно';
  };

  const onTarotClick = (type: TarotType, start: () => void) => {
    if (!loaded || loadError) return;
    const availability = getTarotAvailability(type);
    if (!availability.allowed) {
      openBlockedModal(type, availability);
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
        <p className="text-gray-300 text-center mb-4">Ваш личный проводник в мир Таро</p>

        {walletInfo && (
          <div className="w-full max-w-sm mb-4">
            <TokenBalance walletInfo={walletInfo} onBuyTokens={() => setTokenShopOpen(true)} compact />
          </div>
        )}

        {loadError && (
          <div className="w-full max-w-sm mb-4 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4 text-center">
            <p className="text-amber-200 text-sm mb-3">{error}</p>
            <Button
              type="button"
              onClick={() => bootstrapWalletStatus({ force: true })}
              className="w-full bg-amber-600/30 hover:bg-amber-600/40 text-amber-100 border border-amber-400/40 rounded-xl py-2"
            >
              Повторить
            </Button>
          </div>
        )}

        <div className="w-full max-w-sm space-y-4 mt-4">
          {/* Daily card button - same structure as before with updated status */}
          <TarotButton
            type="daily"
            label="Одна карта"
            sublabel="Совет дня"
            icon={SparklesIcon}
            color="amber"
            avail={dailyAvail}
            isStatusLoading={isStatusLoading}
            loadError={loadError}
            statusText={getStatusText('daily', dailyAvail)}
            onClick={() => onTarotClick('daily', onOneCard)}
          />
          <TarotButton
            type="yesNo"
            label="Да/Нет"
            sublabel="Быстрый ответ"
            icon={HelpCircle}
            color="emerald"
            avail={yesNoAvail}
            isStatusLoading={isStatusLoading}
            loadError={loadError}
            statusText={getStatusText('yesNo', yesNoAvail)}
            onClick={() => onTarotClick('yesNo', onYesNo)}
          />
          <TarotButton
            type="threeCards"
            label="Три карты"
            sublabel="Прошлое–Настоящее–Будущее"
            icon={Calendar}
            color="purple"
            avail={threeCardsAvail}
            isStatusLoading={isStatusLoading}
            loadError={loadError}
            statusText={getStatusText('threeCards', threeCardsAvail)}
            onClick={() => onTarotClick('threeCards', onThreeCards)}
          />
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />

      <TokenShopModal isOpen={tokenShopOpen} onClose={() => setTokenShopOpen(false)} />

      <InsufficientTokensModal
        isOpen={insufficientModalOpen}
        onClose={() => setInsufficientModalOpen(false)}
        onBuyTokens={() => setTokenShopOpen(true)}
        required={insufficientCost}
        balance={walletInfo?.tokensBalance}
        tarotLabel={blockedType === 'yesNo' ? 'Да/Нет' : blockedType === 'threeCards' ? '3 карты' : undefined}
      />

      <BlockedTarotModal
        isOpen={blockedModalOpen}
        onClose={() => setBlockedModalOpen(false)}
        tarotType={blockedType}
        nextAvailableAt={blockedNextAvailableAt}
        onBuyTokens={() => setTokenShopOpen(true)}
      />
    </div>
  );
};

function TarotButton({
  label,
  sublabel,
  icon: Icon,
  color,
  avail,
  isStatusLoading,
  loadError,
  statusText,
  onClick,
}: {
  type: TarotType;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'amber' | 'emerald' | 'purple';
  avail: TarotAvailability;
  isStatusLoading: boolean;
  loadError: boolean;
  statusText: string;
  onClick: () => void;
}) {
  const borderActive = { amber: 'border-amber-400/30 hover:border-amber-400/50', emerald: 'border-emerald-400/30 hover:border-emerald-400/50', purple: 'border-purple-400/30 hover:border-purple-400/50' }[color];
  const iconBg = { amber: 'bg-amber-600/20 border-amber-400/30', emerald: 'bg-emerald-600/20 border-emerald-400/30', purple: 'bg-purple-600/20 border-purple-400/30' }[color];
  const iconColor = { amber: 'text-amber-400', emerald: 'text-emerald-400', purple: 'text-purple-400' }[color];
  const statusColor = { amber: 'text-amber-400', emerald: 'text-emerald-400', purple: 'text-purple-400' }[color];

  return (
    <motion.div whileHover={{ scale: avail.allowed ? 1.02 : 1 }} whileTap={{ scale: avail.allowed ? 0.98 : 1 }} className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Button
        onClick={onClick}
        className={`w-full h-20 text-white border-2 rounded-3xl shadow-xl transition-all duration-300 backdrop-blur-sm ${
          isStatusLoading || loadError
            ? 'bg-slate-800/40 border-slate-600/30 cursor-wait'
            : avail.allowed
              ? `bg-slate-800/50 hover:bg-slate-700/50 ${borderActive} hover:shadow-2xl cursor-pointer`
              : 'bg-slate-800/30 border-slate-600/30 opacity-60 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center space-x-6 w-full pl-2">
          <div className={`p-3 rounded-2xl border flex-shrink-0 ${isStatusLoading || loadError ? 'bg-slate-600/20 border-slate-500/30' : avail.allowed ? iconBg : 'bg-slate-600/20 border-slate-500/30'}`}>
            {isStatusLoading ? (
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            ) : loadError ? (
              <AlertCircle className={`w-6 h-6 ${iconColor}/80`} />
            ) : avail.allowed ? (
              <Icon className={`w-6 h-6 ${iconColor}`} />
            ) : (
              <Lock className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="text-left flex-1">
            <div className={`text-lg font-semibold ${isStatusLoading || loadError ? 'text-slate-300' : avail.allowed ? 'text-white' : 'text-slate-400'}`}>{label}</div>
            <div className={`text-sm ${isStatusLoading || loadError ? 'text-slate-500' : avail.allowed ? 'text-gray-300' : 'text-slate-500'}`}>{sublabel}</div>
            {(isStatusLoading || statusText) && <div className={`text-xs ${statusColor} mt-1`}>{statusText}</div>}
          </div>
        </div>
      </Button>
    </motion.div>
  );
}

export default MainScreen;
