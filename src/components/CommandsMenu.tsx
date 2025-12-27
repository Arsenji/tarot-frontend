'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  HelpCircle, 
  Download, 
  Lightbulb, 
  Users, 
  Info,
  X,
  Menu
} from 'lucide-react';
import { useState } from 'react';

interface CommandsMenuProps {
  onStart?: () => void;
  onSupport?: () => void;
  onDownload?: () => void;
  onIdeas?: () => void;
  onPartnership?: () => void;
  onInfo?: () => void;
}

interface CommandItem {
  command: string;
  icon: React.ReactNode;
  label: string;
  action?: () => void;
}

export function CommandsMenu({
  onStart,
  onSupport,
  onDownload,
  onIdeas,
  onPartnership,
  onInfo
}: CommandsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const commands: CommandItem[] = [
    {
      command: '/start',
      icon: <Home className="w-5 h-5" />,
      label: 'В начало',
      action: onStart
    },
    {
      command: '/support',
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Поддержка',
      action: onSupport
    },
    {
      command: '/download',
      icon: <Download className="w-5 h-5" />,
      label: 'Скачать приложение',
      action: onDownload
    },
    {
      command: '/ideas',
      icon: <Lightbulb className="w-5 h-5" />,
      label: 'Предложить идею',
      action: onIdeas
    },
    {
      command: '/partnership',
      icon: <Users className="w-5 h-5" />,
      label: 'Партнерство',
      action: onPartnership
    },
    {
      command: '/info',
      icon: <Info className="w-5 h-5" />,
      label: 'О приложении',
      action: onInfo
    }
  ];

  const handleCommandClick = (command: CommandItem) => {
    if (command.action) {
      command.action();
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
              className="fixed bottom-24 right-4 z-[101] bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-600/30 overflow-hidden min-w-[280px] max-w-[320px]"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="p-2">
                {commands.map((cmd, index) => (
                  <motion.button
                    key={cmd.command}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-colors text-left group"
                    onClick={() => handleCommandClick(cmd)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                      <div className="text-gray-300 group-hover:text-purple-400 transition-colors">
                        {cmd.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 font-mono mb-0.5">
                        {cmd.command}
                      </div>
                      <div className="text-sm text-white font-medium truncate">
                        {cmd.label}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

