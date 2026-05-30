'use client';

import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackTokensShopOpened } from '@/utils/analytics';
import type { WalletInfo } from '@/state/tokenStore';
import {
  FREE_YES_NO_LIFETIME,
  FREE_THREE_CARDS_LIFETIME,
} from '@/constants/tokenPackages';

interface TokenBalanceProps {
  walletInfo?: WalletInfo | null;
  onBuyTokens?: () => void;
  compact?: boolean;
}

export function TokenBalance({ walletInfo, onBuyTokens, compact = false }: TokenBalanceProps) {
  if (!walletInfo) return null;

  const balance = walletInfo.tokensBalance ?? 0;

  if (compact) {
    return (
      <motion.button
        type="button"
        onClick={() => {
          trackTokensShopOpened();
          onBuyTokens?.();
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-600/20 border border-amber-400/30 text-amber-200 text-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Coins className="w-4 h-4 text-amber-400" />
        <span>{balance} токенов</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Coins className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-white text-lg font-semibold">{balance} токенов</h3>
            <p className="text-gray-400 text-sm">Ваш баланс</p>
          </div>
        </div>
        {onBuyTokens && (
          <Button
            onClick={() => {
              trackTokensShopOpened();
              onBuyTokens();
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm"
          >
            Купить
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
        <div>❓ Да/Нет: {walletInfo.freeYesNoRemaining}/{FREE_YES_NO_LIFETIME} бесплатно</div>
        <div>🔮 3 карты: {walletInfo.freeThreeCardsRemaining}/{FREE_THREE_CARDS_LIFETIME} бесплатно</div>
      </div>
    </motion.div>
  );
}

export default TokenBalance;
