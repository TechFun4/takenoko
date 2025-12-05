import React, { useState } from 'react';
import { getMnemonic } from '../../lib/wallet/storage';

interface UnlockWalletProps {
  onUnlock: () => void;
}

const UnlockWallet: React.FC<UnlockWalletProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    try {
      // Verify password by attempting to decrypt mnemonic
      await getMnemonic(password);

      // Mark wallet as unlocked
      await chrome.storage.local.set({ is_locked: false });

      onUnlock();
    } catch (err: any) {
      setError('Invalid password');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🎋</div>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Unlock your Takenoko wallet</p>

        {error && <p style={styles.error}>{error}</p>}

        <input
          type="password"
          placeholder="Enter password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
        />

        <button style={styles.button} onClick={handleUnlock}>
          Unlock
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '600px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: '320px',
    textAlign: 'center' as const,
  },
  logo: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '30px',
  },
  input: {
    width: '100%',
    padding: '15px',
    marginBottom: '15px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '10px',
    background: '#fff',
    color: '#667eea',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  error: {
    background: 'rgba(255, 0, 0, 0.3)',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '15px',
  },
};

export default UnlockWallet;
