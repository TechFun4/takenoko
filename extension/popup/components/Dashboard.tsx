import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getAccounts, getActiveAccount, lockWallet, getSettings, saveSettings } from '../../lib/wallet/storage';
import { getBalance, getUSDCBalance } from '../../lib/wallet/transaction';
import { getPendingRoundUps, getTotalPendingRoundUp } from '../../lib/round-up/monitor';
import { getAPYWithFallback } from '../../lib/jupiter/lend';

type Tab = 'home' | 'roundup' | 'send' | 'settings';

const Dashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [address, setAddress] = useState('');
  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [roundUpTotal, setRoundUpTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState<'devnet' | 'mainnet-beta' | 'demo'>('demo');
  const [usdcAPY, setUsdcAPY] = useState(4.90);
  const [solAPY, setSolAPY] = useState(3.00);
  const [jupiterInvested, setJupiterInvested] = useState(0);

  useEffect(() => {
    loadWalletData();
    const interval = setInterval(loadWalletData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadWalletData = async () => {
    try {
      const accounts = await getAccounts();
      const activeIndex = await getActiveAccount();
      const activeAccount = accounts[activeIndex];

      if (!activeAccount) return;

      setAddress(activeAccount.publicKey);

      // Load network from settings
      const settings = await getSettings();
      setNetwork(settings.network);

      // Load APY rates
      const usdcApyRate = await getAPYWithFallback('USDC');
      const solApyRate = await getAPYWithFallback('SOL');
      setUsdcAPY(usdcApyRate);
      setSolAPY(solApyRate);

      // Demo mode: use mock balances
      if (settings.network === 'demo') {
        setSolBalance(3.5); // A few SOL
        setUsdcBalance(100.00); // 100 USDC
        setRoundUpTotal(12.43); // Mock round-up total
        setJupiterInvested(87.65); // Mock invested amount
      } else {
        const publicKey = new PublicKey(activeAccount.publicKey);
        const sol = await getBalance(publicKey);
        const usdc = await getUSDCBalance(publicKey);
        const pending = await getTotalPendingRoundUp();

        setSolBalance(sol);
        setUsdcBalance(usdc);
        setRoundUpTotal(pending);
        setJupiterInvested(0); // TODO: Fetch from Jupiter
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkChange = async (newNetwork: 'devnet' | 'mainnet-beta' | 'demo') => {
    const settings = await getSettings();
    settings.network = newNetwork;
    await saveSettings(settings);
    setNetwork(newNetwork);

    // Reload balances with new network
    loadWalletData();
  };

  const handleLock = async () => {
    await lockWallet();
    window.location.reload();
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.logo}>🎋 Takenoko</h1>
          <span style={styles.networkBadge}>
            {network === 'demo' ? '🎬 Demo' : network === 'mainnet-beta' ? '🔴 Mainnet' : '🟢 Devnet'}
          </span>
        </div>
        <button style={styles.lockButton} onClick={handleLock}>
          🔒
        </button>
      </div>

      {/* Address */}
      <div style={styles.addressBar} onClick={copyAddress}>
        <span>{formatAddress(address)}</span>
        <span style={styles.copyIcon}>📋</span>
      </div>

      {/* Main Content */}
      {tab === 'home' && (
        <div style={styles.content}>
          {/* Balances */}
          <div style={styles.balanceCard}>
            <p style={styles.balanceLabel}>Total Balance</p>
            <h2 style={styles.balanceAmount}>${usdcBalance.toFixed(2)}</h2>
            <p style={styles.balanceSubtext}>{solBalance.toFixed(4)} SOL</p>
          </div>

          {/* Round-Up Card */}
          <div style={styles.roundUpCard}>
            <div style={styles.roundUpHeader}>
              <span style={styles.roundUpIcon}>💰</span>
              <div>
                <p style={styles.roundUpTitle}>Round-Up Savings</p>
                <p style={styles.roundUpAmount}>${roundUpTotal.toFixed(2)}</p>
              </div>
            </div>
            <button
              style={styles.investButton}
              onClick={() => setTab('roundup')}
            >
              View Details
            </button>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button style={styles.actionButton}>
              <span style={styles.actionIcon}>📥</span>
              <span>Receive</span>
            </button>
            <button
              style={styles.actionButton}
              onClick={() => setTab('send')}
            >
              <span style={styles.actionIcon}>📤</span>
              <span>Send</span>
            </button>
            <button style={styles.actionButton}>
              <span style={styles.actionIcon}>🔄</span>
              <span>Swap</span>
            </button>
          </div>

          {/* Recent Activity */}
          <div style={styles.activity}>
            <h3 style={styles.activityTitle}>Recent Activity</h3>
            <p style={styles.emptyState}>No recent transactions</p>
          </div>
        </div>
      )}

      {tab === 'roundup' && (
        <div style={styles.content}>
          <h2 style={styles.pageTitle}>Round-Up Investing</h2>

          <div style={styles.statsCard}>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Pending Round-Ups</p>
              <p style={styles.statValue}>${roundUpTotal.toFixed(2)}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Total Invested</p>
              <p style={styles.statValue}>${jupiterInvested.toFixed(2)}</p>
            </div>
          </div>

          <div style={styles.apyCard}>
            <p style={styles.apyTitle}>Current Yields</p>
            <div style={styles.apyRow}>
              <span>💵 USDC APY</span>
              <span style={styles.apyValue}>{usdcAPY.toFixed(2)}%</span>
            </div>
            <div style={styles.apyRow}>
              <span>◎ SOL APY</span>
              <span style={styles.apyValue}>{solAPY.toFixed(2)}%</span>
            </div>
          </div>

          <button
            style={styles.primaryButton}
            onClick={async () => {
              if (network === 'demo') {
                // Demo mode: simulate investment
                setJupiterInvested(jupiterInvested + roundUpTotal);
                setRoundUpTotal(0);
                alert(`🎋 Demo: Invested $${roundUpTotal.toFixed(2)} into Jupiter Lend!\n\nYour savings are now growing like bamboo shoots!`);
              } else {
                alert('Investment feature coming soon! This will deposit your round-ups into Jupiter Lend.');
              }
            }}
          >
            Invest ${roundUpTotal.toFixed(2)} Now
          </button>

          <div style={styles.infoBox}>
            <p style={styles.infoTitle}>How it works 🎋</p>
            <p style={styles.infoText}>
              Every USDC and SOL transaction is rounded up to the nearest dollar.
              The difference is automatically deposited into Jupiter Lend to earn
              yield - growing your savings as fast as bamboo shoots!
            </p>
          </div>

          <button style={styles.backButton} onClick={() => setTab('home')}>
            ← Back to Home
          </button>
        </div>
      )}

      {tab === 'send' && (
        <div style={styles.content}>
          <h2 style={styles.pageTitle}>Send</h2>

          <input
            type="text"
            id="sendRecipient"
            placeholder="Recipient address"
            style={styles.input}
            defaultValue={network === 'demo' ? 'Alice' : ''}
          />

          <input
            type="number"
            id="sendAmount"
            placeholder="Amount"
            style={styles.input}
            defaultValue={network === 'demo' ? '29.67' : ''}
            step="0.01"
          />

          <select id="sendToken" style={styles.select}>
            <option>USDC</option>
            <option>SOL</option>
          </select>

          {network === 'demo' && (
            <div style={styles.roundupPreview}>
              <div style={styles.roundupPreviewText}>
                <span>Round-up to $30.00</span>
                <span style={styles.roundupPreviewAmount}>+$0.33 🎋</span>
              </div>
            </div>
          )}

          <button
            style={styles.primaryButton}
            onClick={async () => {
              const recipient = (document.getElementById('sendRecipient') as HTMLInputElement).value;
              const amount = parseFloat((document.getElementById('sendAmount') as HTMLInputElement).value);
              const token = (document.getElementById('sendToken') as HTMLSelectElement).value;

              if (!recipient || !amount || amount <= 0) {
                alert('Please enter valid recipient and amount');
                return;
              }

              if (network === 'demo') {
                // Calculate round-up
                const roundedAmount = Math.ceil(amount);
                const roundUpAmount = roundedAmount - amount;

                // Simulate send with round-up
                const newRoundUpTotal = roundUpTotal + roundUpAmount;
                setRoundUpTotal(newRoundUpTotal);

                // Update balance
                if (token === 'USDC') {
                  setUsdcBalance(usdcBalance - amount);
                } else {
                  setSolBalance(solBalance - amount);
                }

                alert(`🎋 Demo: Payment Sent!\n\n` +
                      `Sent to ${recipient}: $${amount.toFixed(2)}\n` +
                      `Round-up saved: $${roundUpAmount.toFixed(2)}\n\n` +
                      `Your savings are growing like bamboo shoots!`);

                // Clear form
                (document.getElementById('sendRecipient') as HTMLInputElement).value = '';
                (document.getElementById('sendAmount') as HTMLInputElement).value = '';

                // Go back to home
                setTab('home');
              } else {
                alert('Send feature coming soon! This will send tokens and automatically round up the difference.');
              }
            }}
          >
            Send {network === 'demo' ? '(Demo)' : ''}
          </button>

          <button style={styles.backButton} onClick={() => setTab('home')}>
            ← Back to Home
          </button>
        </div>
      )}

      {tab === 'settings' && (
        <div style={styles.content}>
          <h2 style={styles.pageTitle}>Settings</h2>

          <div style={styles.settingItem}>
            <span>🌐 Network</span>
            <select
              style={styles.select}
              value={network}
              onChange={(e) => handleNetworkChange(e.target.value as 'devnet' | 'mainnet-beta' | 'demo')}
            >
              <option value="demo">Demo Mode (Try it!)</option>
              <option value="devnet">Devnet (Test)</option>
              <option value="mainnet-beta">Mainnet (Live)</option>
            </select>
          </div>

          <div style={styles.settingItem}>
            <span>Auto Round-Up</span>
            <input type="checkbox" defaultChecked />
          </div>

          <div style={styles.settingItem}>
            <span>Round up to</span>
            <select style={styles.select}>
              <option>$1</option>
              <option>$5</option>
              <option>$10</option>
            </select>
          </div>

          <div style={styles.infoBox}>
            <p style={styles.infoTitle}>⚠️ Network Selection</p>
            <p style={styles.infoText}>
              <strong>Demo</strong>: Try the wallet with mock balances and transactions. Perfect for exploring features!<br/><br/>
              <strong>Devnet</strong>: Use for testing with fake tokens. Safe for development.<br/><br/>
              <strong>Mainnet</strong>: Real Solana blockchain. Use real funds and tokens.
            </p>
          </div>

          <button style={styles.backButton} onClick={() => setTab('home')}>
            ← Back to Home
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={styles.nav}>
        <button
          style={tab === 'home' ? styles.navButtonActive : styles.navButton}
          onClick={() => setTab('home')}
        >
          🏠
        </button>
        <button
          style={tab === 'roundup' ? styles.navButtonActive : styles.navButton}
          onClick={() => setTab('roundup')}
        >
          💰
        </button>
        <button
          style={tab === 'send' ? styles.navButtonActive : styles.navButton}
          onClick={() => setTab('send')}
        >
          📤
        </button>
        <button
          style={tab === 'settings' ? styles.navButtonActive : styles.navButton}
          onClick={() => setTab('settings')}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '600px',
    background: 'linear-gradient(135deg, #7C3AED 0%, #10B981 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '600px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  networkBadge: {
    fontSize: '11px',
    opacity: 0.9,
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  lockButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  addressBar: {
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '10px 20px',
    margin: '0 20px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px',
  },
  copyIcon: {
    fontSize: '16px',
  },
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as const,
  },
  balanceCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center' as const,
    marginBottom: '15px',
  },
  balanceLabel: {
    fontSize: '12px',
    opacity: 0.8,
    marginBottom: '5px',
  },
  balanceAmount: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  balanceSubtext: {
    fontSize: '14px',
    opacity: 0.7,
  },
  roundUpCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '20px',
  },
  roundUpHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  roundUpIcon: {
    fontSize: '32px',
    marginRight: '12px',
  },
  roundUpTitle: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '4px',
  },
  roundUpAmount: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  investButton: {
    width: '100%',
    padding: '10px',
    background: '#10B981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '20px',
  },
  actionButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '10px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '12px',
  },
  actionIcon: {
    fontSize: '24px',
    marginBottom: '5px',
  },
  activity: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '15px',
  },
  activityTitle: {
    fontSize: '16px',
    marginBottom: '10px',
  },
  emptyState: {
    fontSize: '14px',
    opacity: 0.6,
    textAlign: 'center' as const,
    padding: '20px',
  },
  nav: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '10px',
  },
  navButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    padding: '10px',
    cursor: 'pointer',
    opacity: 0.6,
  },
  navButtonActive: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    padding: '10px',
    cursor: 'pointer',
    opacity: 1,
  },
  pageTitle: {
    fontSize: '24px',
    marginBottom: '20px',
  },
  statsCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  stat: {
    marginBottom: '15px',
  },
  statLabel: {
    fontSize: '12px',
    opacity: 0.8,
    marginBottom: '5px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  apyCard: {
    background: 'rgba(16, 185, 129, 0.2)',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '20px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  apyTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    opacity: 0.9,
  },
  apyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
  },
  apyValue: {
    fontWeight: 'bold',
    color: '#10B981',
    fontSize: '16px',
  },
  primaryButton: {
    width: '100%',
    padding: '15px',
    background: '#10B981',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '15px',
  },
  backButton: {
    width: '100%',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '15px',
  },
  infoBox: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '15px',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  infoText: {
    fontSize: '13px',
    opacity: 0.9,
    lineHeight: '1.5',
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
  select: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  settingItem: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundupPreview: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: '2px solid rgba(16, 185, 129, 0.5)',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '15px',
  },
  roundupPreviewText: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
  },
  roundupPreviewAmount: {
    fontWeight: 'bold',
    color: '#10B981',
    fontSize: '16px',
  },
};

export default Dashboard;
