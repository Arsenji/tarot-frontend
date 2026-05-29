'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { X, Coins, Loader2 } from 'lucide-react';
import { TOKEN_PACKAGES, type TokenPackageId } from '@/constants/tokenPackages';
import { apiService } from '@/services/api';
import {
  trackTokenPackageSelected,
  trackTokensShopOpened,
} from '@/utils/analytics';

interface TokenShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function TokenShopModal({
  isOpen,
  onClose,
  title = 'Купить токены',
  message = 'Токены нужны для раскладов «Да/Нет» и «3 карты». Карта дня — бесплатно раз в сутки.',
}: TokenShopModalProps) {
  const [loadingId, setLoadingId] = useState<TokenPackageId | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) trackTokensShopOpened();
  }, [isOpen]);

  const formatRub = (amount: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const buyPackage = async (packageId: TokenPackageId) => {
    setError('');
    setLoadingId(packageId);
    trackTokenPackageSelected(packageId);

    try {
      const resp = await apiService.createTokenPayment(packageId);
      if (!resp.success || !resp.payment?.confirmationUrl) {
        setError(resp.error || 'Не удалось создать платёж');
        setLoadingId(null);
        return;
      }

      const url = resp.payment.confirmationUrl;
      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;

      // Открываем оплату во внешнем браузере Telegram — Mini App остаётся жив.
      // При возврате (или отмене) баланс обновится по visibilitychange в AppBootstrap.
      if (tg?.openLink) {
        tg.openLink(url);
        setLoadingId(null);
        onClose();
      } else {
        window.location.href = url;
      }
    } catch {
      setError('Ошибка при создании платежа');
      setLoadingId(null);
    }
  };

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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-600/20 rounded-xl border border-amber-400/30">
                  <Coins className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-white text-lg font-semibold">{title}</h3>
              </div>
              <Button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>

            <p className="text-gray-200 text-sm leading-relaxed mb-4">{message}</p>

            <div className="space-y-2">
              {TOKEN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  disabled={!!loadingId}
                  onClick={() => buyPackage(pkg.id)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-500/20 bg-slate-700/40 p-3 hover:bg-slate-700/60 transition-colors disabled:opacity-60"
                >
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">{pkg.name}</div>
                    <div className="text-gray-400 text-xs">Да/Нет — 5 · 3 карты — 10</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 text-sm font-semibold">{formatRub(pkg.priceRub)}</span>
                    {loadingId === pkg.id && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                  </div>
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={onClose}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-gray-300 border border-slate-400/30 rounded-lg text-sm"
              >
                Закрыть
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
