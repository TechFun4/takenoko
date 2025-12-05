import React, { useState, useEffect } from 'react';
import SetupWallet from './components/SetupWallet';
import UnlockWallet from './components/UnlockWallet';
import Dashboard from './components/Dashboard';
import { isWalletInitialized, isWalletLocked } from '../lib/wallet/storage';

type Screen = 'loading' | 'setup' | 'unlock' | 'dashboard';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    const initialized = await isWalletInitialized();

    if (!initialized) {
      setCurrentScreen('setup');
      return;
    }

    const locked = await isWalletLocked();
    setCurrentScreen(locked ? 'unlock' : 'dashboard');
  };

  const handleWalletSetup = () => {
    setCurrentScreen('dashboard');
  };

  const handleWalletUnlocked = () => {
    setCurrentScreen('dashboard');
  };

  if (currentScreen === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (currentScreen === 'setup') {
    return <SetupWallet onComplete={handleWalletSetup} />;
  }

  if (currentScreen === 'unlock') {
    return <UnlockWallet onUnlock={handleWalletUnlocked} />;
  }

  return <Dashboard />;
};

const styles = {
  container: {
    width: '100%',
    minHeight: '600px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  loading: {
    textAlign: 'center' as const,
  },
};

export default App;
