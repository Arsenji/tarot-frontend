import React from 'react';
import { motion } from 'motion/react';

interface TarotLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
}

export const TarotLogo: React.FC<TarotLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  animated = false 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const LogoIcon = () => {
    const iconSizes = {
      sm: 20,
      md: 28,
      lg: 36,
      xl: 44
    };
    
    return (
      <motion.div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center shadow-lg relative overflow-hidden`}
        animate={animated ? {
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 1],
        } : {}}
        transition={animated ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      >
        <img
          src="/images/bot-logo.png"
          alt="Bot Logo"
          className="w-full h-full object-cover rounded-full"
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </motion.div>
    );
  };

  if (!showText) {
    return <LogoIcon />;
  }

  return (
    <div className="flex items-center space-x-3">
      <LogoIcon />
      <div>
        <h1 className={`${textSizeClasses[size]} text-white font-bold`}>Таро</h1>
        <p className="text-xs text-gray-300">Гадание</p>
      </div>
    </div>
  );
};
