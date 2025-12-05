import React, { useState } from 'react';
import { generateMnemonic, deriveAccounts } from '../../lib/wallet/keypair';
import { saveMnemonic, saveAccounts, setActiveAccount } from '../../lib/wallet/storage';

interface SetupWalletProps {
  onComplete: () => void;
}

const SetupWallet: React.FC<SetupWalletProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'create' | 'mnemonic' | 'confirm'>('create');
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleCreateWallet = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
    setStep('mnemonic');
  };

  const handleContinue = () => {
    setStep('confirm');
  };

  const handleFinish = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Save encrypted mnemonic
      await saveMnemonic(mnemonic, password);

      // Derive first account
      const accounts = deriveAccounts(mnemonic, 1);
      await saveAccounts(accounts);
      await setActiveAccount(0);

      onComplete();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (step === 'create') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Welcome to Takenoko</h1>
          <p style={styles.subtitle}>竹の子 - Bamboo-fast savings growth</p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.icon}>🎋</span>
              <p>Round-up USDC & SOL transactions</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>🔒</span>
              <p>Secure Solana wallet</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.icon}>📈</span>
              <p>Earn yield on Jupiter Lend</p>
            </div>
          </div>

          <button style={styles.button} onClick={handleCreateWallet}>
            Create New Wallet
          </button>

          <p style={styles.disclaimer}>
            By creating a wallet, you agree to save your recovery phrase securely
          </p>
        </div>
      </div>
    );
  }

  if (step === 'mnemonic') {
    const words = mnemonic.split(' ');

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Secret Recovery Phrase</h2>
          <p style={styles.warning}>
            ⚠️ Write down these 12 words in order. Never share them with anyone.
          </p>

          <div style={styles.mnemonicGrid}>
            {words.map((word, i) => (
              <div key={i} style={styles.mnemonicWord}>
                <span style={styles.wordNumber}>{i + 1}.</span>
                <span style={styles.word}>{word}</span>
              </div>
            ))}
          </div>

          <button style={styles.button} onClick={handleContinue}>
            I Saved My Recovery Phrase
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Password</h2>
        <p style={styles.subtitle}>Secure your wallet with a password</p>

        {error && <p style={styles.error}>{error}</p>}

        <input
          type="password"
          placeholder="Password (min 8 characters)"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm password"
          style={styles.input}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button style={styles.button} onClick={handleFinish}>
          Create Wallet
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
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '30px',
    textAlign: 'center' as const,
  },
  features: {
    marginBottom: '30px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    fontSize: '14px',
  },
  icon: {
    fontSize: '24px',
    marginRight: '10px',
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '10px',
    background: '#10B981',
    color: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  disclaimer: {
    fontSize: '12px',
    opacity: 0.7,
    marginTop: '15px',
    textAlign: 'center' as const,
  },
  warning: {
    background: 'rgba(255, 200, 0, 0.2)',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  mnemonicGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '20px',
  },
  mnemonicWord: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  wordNumber: {
    opacity: 0.6,
    marginRight: '8px',
  },
  word: {
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  error: {
    background: 'rgba(255, 0, 0, 0.3)',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '15px',
  },
};

export default SetupWallet;
