'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  X,
  Menu,
  ExternalLink,
  CreditCard,
  Crown,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';

interface CommandsMenuProps {
  onOpenApp?: () => void;
  onBuySubscription?: () => void;
  onMySubscription?: () => void;
  onHelp?: () => void;
  onFeedback?: () => void;
}

export function CommandsMenu({
  onOpenApp,
  onBuySubscription,
  onMySubscription,
  onHelp,
  onFeedback
}: CommandsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Кнопка открытия меню */}
      <motion.button
        className="fixed bottom-20 right-4 z-40 bg-purple-600/80 hover:bg-purple-600 backdrop-blur-sm rounded-full p-3 shadow-lg border border-purple-400/30 transition-all"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Меню команд */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Затемнение фона */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Меню */}
            <motion.div
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                className="bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden w-full max-w-sm"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Заголовок */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-700/50">
                  <h2 className="text-white text-lg font-semibold">Выберите действие:</h2>
                </div>

                {/* Кнопки */}
                <div className="p-4 space-y-3">
                  {/* Большая кнопка "Открыть приложение" */}
                  <motion.button
                    className="w-full bg-purple-600/80 hover:bg-purple-600 text-white font-medium py-4 px-6 rounded-xl border border-purple-400/30 transition-all flex items-center justify-center space-x-2"
                    onClick={() => handleAction(onOpenApp)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Открыть приложение</span>
                  </motion.button>

                  {/* Две кнопки в ряд: "Купить подписку" и "Моя подписка" */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      className="bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl border border-purple-400/30 transition-all flex items-center justify-center space-x-2"
                      onClick={() => handleAction(onBuySubscription)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">Купить подписку</span>
                    </motion.button>
                    <motion.button
                      className="bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl border border-purple-400/30 transition-all flex items-center justify-center space-x-2"
                      onClick={() => handleAction(onMySubscription)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Crown className="w-4 h-4" />
                      <span className="text-sm">Моя подписка</span>
                    </motion.button>
                  </div>

                  {/* Две кнопки в ряд: "Помощь" и "Оставить отзыв" */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      className="bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl border border-purple-400/30 transition-all flex items-center justify-center space-x-2"
                      onClick={() => handleAction(onHelp)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-sm">Помощь</span>
                    </motion.button>
                    <motion.button
                      className="bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl border border-purple-400/30 transition-all flex items-center justify-center space-x-2"
                      onClick={() => handleAction(onFeedback)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">Оставить отзыв</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

