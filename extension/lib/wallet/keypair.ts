import { Keypair, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface WalletAccount {
  publicKey: string;
  derivationPath: string;
  index: number;
}

/**
 * Generate a new mnemonic phrase (12 words)
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(128); // 12 words
}

/**
 * Validate mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Derive keypair from mnemonic and derivation path
 */
export function deriveKeypairFromMnemonic(
  mnemonic: string,
  derivationPath: string = "m/44'/501'/0'/0'"
): Keypair {
  const seed = bip39.mnemonicToSeedSync(mnemonic, '');
  const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
  const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);

  return Keypair.fromSecretKey(keypair.secretKey);
}

/**
 * Derive multiple accounts from a single mnemonic
 */
export function deriveAccounts(
  mnemonic: string,
  count: number = 1
): WalletAccount[] {
  const accounts: WalletAccount[] = [];

  for (let i = 0; i < count; i++) {
    const derivationPath = `m/44'/501'/${i}'/0'`;
    const keypair = deriveKeypairFromMnemonic(mnemonic, derivationPath);

    accounts.push({
      publicKey: keypair.publicKey.toBase58(),
      derivationPath,
      index: i,
    });
  }

  return accounts;
}

/**
 * Get keypair for signing transactions
 */
export function getKeypairForAccount(
  mnemonic: string,
  derivationPath: string
): Keypair {
  return deriveKeypairFromMnemonic(mnemonic, derivationPath);
}

/**
 * Import wallet from private key
 */
export function importFromPrivateKey(privateKey: string): Keypair {
  try {
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    throw new Error('Invalid private key format');
  }
}

/**
 * Export private key from keypair
 */
export function exportPrivateKey(keypair: Keypair): string {
  return bs58.encode(keypair.secretKey);
}
