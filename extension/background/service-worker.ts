import { PublicKey } from '@solana/web3.js';
import { getAccounts, getActiveAccount, getMnemonic, isWalletLocked, getSettings } from '../lib/wallet/storage';
import { getKeypairForAccount } from '../lib/wallet/keypair';
import { monitorTransactions, storePendingRoundUps } from '../lib/round-up/monitor';

console.log('RoundUp Wallet background service started');

// Track last processed signature per account
const lastSignatures = new Map<string, string>();

/**
 * Monitor transactions every 30 seconds
 */
async function startTransactionMonitoring() {
  const settings = await getSettings();

  if (!settings.roundUpEnabled) {
    console.log('Round-up monitoring disabled');
    return;
  }

  const locked = await isWalletLocked();
  if (locked) {
    console.log('Wallet is locked, skipping monitoring');
    return;
  }

  try {
    const accounts = await getAccounts();
    const activeIndex = await getActiveAccount();
    const activeAccount = accounts[activeIndex];

    if (!activeAccount) {
      console.log('No active account found');
      return;
    }

    const publicKey = new PublicKey(activeAccount.publicKey);
    const lastSig = lastSignatures.get(activeAccount.publicKey);

    console.log('Monitoring transactions for:', activeAccount.publicKey);

    const roundUpTxs = await monitorTransactions(publicKey, lastSig);

    if (roundUpTxs.length > 0) {
      console.log('Found', roundUpTxs.length, 'round-up opportunities');
      await storePendingRoundUps(roundUpTxs);

      // Update last signature
      lastSignatures.set(activeAccount.publicKey, roundUpTxs[0].signature);

      // Notify user
      if (settings.autoInvest) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon48.png',
          title: 'Round-Up Available',
          message: `${roundUpTxs.length} transaction(s) ready for round-up investing`,
        });
      }
    }
  } catch (error) {
    console.error('Error monitoring transactions:', error);
  }
}

// Set up periodic alarm for transaction monitoring
chrome.alarms.create('transaction-monitor', {
  periodInMinutes: 0.5, // Check every 30 seconds
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'transaction-monitor') {
    startTransactionMonitoring();
  }
});

// Message handler for popup/content script communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse);
  return true; // Will respond asynchronously
});

async function handleMessage(request: any, sender: chrome.runtime.MessageSender) {
  const { method, params } = request;

  try {
    switch (method) {
      case 'getPublicKey':
        return await handleGetPublicKey();

      case 'signTransaction':
        return await handleSignTransaction(params);

      case 'signMessage':
        return await handleSignMessage(params);

      case 'connect':
        return await handleConnect(params);

      case 'disconnect':
        return await handleDisconnect();

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleGetPublicKey() {
  const locked = await isWalletLocked();
  if (locked) {
    throw new Error('Wallet is locked');
  }

  const accounts = await getAccounts();
  const activeIndex = await getActiveAccount();
  const activeAccount = accounts[activeIndex];

  if (!activeAccount) {
    throw new Error('No active account');
  }

  return { publicKey: activeAccount.publicKey };
}

async function handleSignTransaction(params: any) {
  const locked = await isWalletLocked();
  if (locked) {
    throw new Error('Wallet is locked');
  }

  // TODO: Show approval popup to user
  // For now, auto-approve (INSECURE - only for development)

  const accounts = await getAccounts();
  const activeIndex = await getActiveAccount();
  const activeAccount = accounts[activeIndex];

  if (!activeAccount) {
    throw new Error('No active account');
  }

  // This would need to get password from user in production
  // For now, this is a placeholder
  throw new Error('Transaction signing requires user approval');
}

async function handleSignMessage(params: any) {
  const locked = await isWalletLocked();
  if (locked) {
    throw new Error('Wallet is locked');
  }

  // TODO: Show approval popup to user
  throw new Error('Message signing requires user approval');
}

async function handleConnect(params: any) {
  const locked = await isWalletLocked();
  if (locked) {
    throw new Error('Wallet is locked');
  }

  // TODO: Show connection approval popup
  const accounts = await getAccounts();
  const activeIndex = await getActiveAccount();
  const activeAccount = accounts[activeIndex];

  if (!activeAccount) {
    throw new Error('No active account');
  }

  return {
    publicKey: activeAccount.publicKey,
    autoApprove: false,
  };
}

async function handleDisconnect() {
  // Clear any connection state
  return { success: true };
}

// Start monitoring on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('RoundUp Wallet installed');
});
