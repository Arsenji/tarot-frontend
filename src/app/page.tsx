'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MainScreen } from '@/screens/HomeScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { OneCardScreen } from '@/screens/OneCardScreen';
import { ThreeCardsScreen } from '@/screens/ThreeCardsScreen';
import { YesNoScreen } from '@/screens/YesNoScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { bootstrapWalletStatus } from '@/state/tokenStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'main' | 'oneCard' | 'threeCards' | 'yesNo'>('main');
  const skipFirstMainRefetch = useRef(true);

  useEffect(() => {
    if (currentScreen !== 'main') return;
    if (skipFirstMainRefetch.current) {
      skipFirstMainRefetch.current = false;
      return;
    }
    bootstrapWalletStatus({ force: true }).catch(() => {});
  }, [currentScreen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@twa-dev/sdk')
        .then((TWA) => {
          const WebApp = (TWA as any).WebApp || (TWA as any).default?.WebApp;
          if (WebApp) {
            WebApp.ready();
            WebApp.expand();
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleStart = () => setShowWelcome(false);

  const renderScreen = () => {
    if (showWelcome) return <WelcomeScreen onStart={handleStart} />;

    switch (currentScreen) {
      case 'oneCard':
        return <OneCardScreen onBack={() => setCurrentScreen('main')} />;
      case 'threeCards':
        return <ThreeCardsScreen onBack={() => setCurrentScreen('main')} />;
      case 'yesNo':
        return <YesNoScreen onBack={() => setCurrentScreen('main')} />;
      case 'main':
      default:
        if (activeTab === 'history') {
          return (
            <HistoryScreen
              onBack={() => setActiveTab('home')}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          );
        }
        return (
          <MainScreen
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOneCard={() => setCurrentScreen('oneCard')}
            onYesNo={() => setCurrentScreen('yesNo')}
            onThreeCards={() => setCurrentScreen('threeCards')}
          />
        );
    }
  };

  return <div className="min-h-screen">{renderScreen()}</div>;
}
