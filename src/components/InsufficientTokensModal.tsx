'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBuyTokens: () => void;
  required?: number;
  balance?: number;
  tarotLabel?: string;
};

export function InsufficientTokensModal({
  isOpen,
  onClose,
  onBuyTokens,
  required,
  balance,
  tarotLabel,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full border border-slate-600/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-amber-600/20 rounded-xl border border-amber-400/30">
                <Coins className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-white text-lg font-semibold">Недостаточно токенов</h3>
            </div>

            <div className="space-y-3 text-sm text-gray-200">
              {tarotLabel && <p>Расклад «{tarotLabel}» требует токенов.</p>}
              {required != null && balance != null && (
                <p>
                  Нужно: <span className="text-amber-300">{required}</span> · Баланс:{' '}
                  <span className="text-white">{balance}</span>
                </p>
              )}
              <p className="text-gray-300">
                Бесплатные попытки закончились. Купите токены, чтобы продолжить.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-gray-200 border border-slate-400/30 rounded-xl text-sm"
              >
                Позже
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  onBuyTokens();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm"
              >
                Купить токены
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
