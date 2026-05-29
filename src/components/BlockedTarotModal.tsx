'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

type TarotType = 'daily' | 'yesNo' | 'threeCards';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tarotType: TarotType;
  nextAvailableAt?: Date;
  onBuyTokens?: () => void;
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function BlockedTarotModal({ isOpen, onClose, tarotType, nextAvailableAt, onBuyTokens }: Props) {
  const timeText = useMemo(() => {
    if (!nextAvailableAt) return null;
    return `Доступен снова: ${formatTime(nextAvailableAt)}`;
  }, [nextAvailableAt]);

  const message =
    tarotType === 'daily'
      ? 'Карта дня доступна один раз в сутки (по московскому времени).'
      : 'Этот расклад сейчас недоступен.';

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
            <h3 className="text-white text-lg font-semibold">Расклад недоступен</h3>

            <div className="mt-4 space-y-3">
              <p className="text-gray-200 text-sm leading-relaxed">{message}</p>
              {timeText ? <p className="text-gray-200 text-sm leading-relaxed">{timeText}</p> : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {onBuyTokens && tarotType !== 'daily' && (
                <Button
                  onClick={() => {
                    onClose();
                    onBuyTokens();
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm"
                >
                  Купить токены
                </Button>
              )}
              <Button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-gray-200 border border-slate-400/30 rounded-xl text-sm"
              >
                Понятно
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
