import { WalletAccount } from './keypair';

// Chrome storage wrapper with encryption

const STORAGE_KEYS = {
  ENCRYPTED_MNEMONIC: 'encrypted_mnemonic',
  ACCOUNTS: 'accounts',
  ACTIVE_ACCOUNT: 'active_account',
  PASSWORD_HASH: 'password_hash',
  IS_LOCKED: 'is_locked',
  SETTINGS: 'settings',
  ROUND_UP_ENABLED: 'round_up_enabled',
  ROUND_UP_AMOUNT: 'round_up_amount',
} as const;

export interface WalletSettings {
  roundUpEnabled: boolean;
  roundUpTo: number; // 1, 5, or 10 dollars
  autoInvest: boolean;
  network: 'devnet' | 'mainnet-beta' | 'demo';
}

/**
 * Encrypt data using password
 */
async function encrypt(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const passwordBuffer = encoder.encode(password);

  // Hash password to create key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using password
 */
async function decrypt(encryptedData: string, password: string): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(c => c.charCodeAt(0))
  );

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

/**
 * Hash password for verification
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

/**
 * Save encrypted mnemonic
 */
export async function saveMnemonic(mnemonic: string, password: string): Promise<void> {
  const encrypted = await encrypt(mnemonic, password);
  const passwordHash = await hashPassword(password);

  await chrome.storage.local.set({
    [STORAGE_KEYS.ENCRYPTED_MNEMONIC]: encrypted,
    [STORAGE_KEYS.PASSWORD_HASH]: passwordHash,
    [STORAGE_KEYS.IS_LOCKED]: false,
  });
}

/**
 * Get decrypted mnemonic
 */
export async function getMnemonic(password: string): Promise<string | null> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.ENCRYPTED_MNEMONIC,
    STORAGE_KEYS.PASSWORD_HASH,
  ]);

  const encrypted = result[STORAGE_KEYS.ENCRYPTED_MNEMONIC];
  const storedHash = result[STORAGE_KEYS.PASSWORD_HASH];

  if (!encrypted || !storedHash) {
    return null;
  }

  // Verify password
  const passwordHash = await hashPassword(password);
  if (passwordHash !== storedHash) {
    throw new Error('Invalid password');
  }

  return await decrypt(encrypted, password);
}

/**
 * Check if wallet is initialized
 */
export async function isWalletInitialized(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
  return !!result[STORAGE_KEYS.ENCRYPTED_MNEMONIC];
}

/**
 * Save accounts
 */
export async function saveAccounts(accounts: WalletAccount[]): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.ACCOUNTS]: accounts,
  });
}

/**
 * Get accounts
 */
export async function getAccounts(): Promise<WalletAccount[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ACCOUNTS);
  return result[STORAGE_KEYS.ACCOUNTS] || [];
}

/**
 * Set active account
 */
export async function setActiveAccount(index: number): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.ACTIVE_ACCOUNT]: index,
  });
}

/**
 * Get active account index
 */
export async function getActiveAccount(): Promise<number> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVE_ACCOUNT);
  return result[STORAGE_KEYS.ACTIVE_ACCOUNT] || 0;
}

/**
 * Lock wallet
 */
export async function lockWallet(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.IS_LOCKED]: true,
  });
}

/**
 * Check if wallet is locked
 */
export async function isWalletLocked(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.IS_LOCKED);
  return result[STORAGE_KEYS.IS_LOCKED] !== false;
}

/**
 * Save settings
 */
export async function saveSettings(settings: WalletSettings): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: settings,
  });
}

/**
 * Get settings
 */
export async function getSettings(): Promise<WalletSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || {
    roundUpEnabled: true,
    roundUpTo: 1,
    autoInvest: true,
    network: 'demo',
  };
}
