import { Connection, PublicKey, ParsedTransactionWithMeta, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getSettings } from '../wallet/storage';

export interface RoundUpTransaction {
  signature: string;
  amount: number; // Original transaction amount
  roundUpAmount: number; // Amount to round up
  timestamp: number;
  processed: boolean;
  type: 'USDC' | 'SOL'; // Type of transaction
}

/**
 * Calculate round-up amount
 */
export function calculateRoundUp(amount: number, roundUpTo: number = 1): number {
  const remainder = amount % roundUpTo;
  if (remainder === 0) return 0;
  return roundUpTo - remainder;
}

/**
 * Parse transaction to extract USDC amount
 */
function parseUSDCAmount(transaction: ParsedTransactionWithMeta): number | null {
  try {
    const postBalances = transaction.meta?.postTokenBalances;
    const preBalances = transaction.meta?.preTokenBalances;

    if (!postBalances || !preBalances) return null;

    // Find USDC token transfers
    for (let i = 0; i < postBalances.length; i++) {
      const post = postBalances[i];
      const pre = preBalances.find(p => p.accountIndex === post.accountIndex);

      if (pre && (post.mint === '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' ||
                  post.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')) {
        const diff = Math.abs(
          (post.uiTokenAmount.uiAmount || 0) - (pre.uiTokenAmount.uiAmount || 0)
        );
        if (diff > 0) {
          return diff;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing USDC amount:', error);
    return null;
  }
}

/**
 * Parse transaction to extract SOL amount
 */
function parseSOLAmount(transaction: ParsedTransactionWithMeta, userPubkey: PublicKey): number | null {
  try {
    const postBalances = transaction.meta?.postBalances;
    const preBalances = transaction.meta?.preBalances;
    const accountKeys = transaction.transaction.message.accountKeys;

    if (!postBalances || !preBalances || !accountKeys) return null;

    // Find user's account index
    const userIndex = accountKeys.findIndex(key =>
      key.pubkey.toBase58() === userPubkey.toBase58()
    );

    if (userIndex === -1) return null;

    // Calculate SOL difference
    const preBalance = preBalances[userIndex] || 0;
    const postBalance = postBalances[userIndex] || 0;
    const diff = Math.abs((preBalance - postBalance) / LAMPORTS_PER_SOL);

    // Only track if significant amount (> 0.001 SOL)
    if (diff > 0.001) {
      return diff;
    }

    return null;
  } catch (error) {
    console.error('Error parsing SOL amount:', error);
    return null;
  }
}

/**
 * Monitor transactions for round-up opportunities
 */
export async function monitorTransactions(
  publicKey: PublicKey,
  lastSignature?: string
): Promise<RoundUpTransaction[]> {
  const settings = await getSettings();

  if (!settings.roundUpEnabled) {
    return [];
  }

  const rpcUrl = settings.network === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://solana-devnet.g.alchemy.com/v2/8YvO_lOUS903Tb3muqvjs';
  const connection = new Connection(rpcUrl, 'confirmed');

  try {
    // Get recent transactions
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 20,
      before: lastSignature,
    });

    const roundUpTxs: RoundUpTransaction[] = [];

    for (const sig of signatures) {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || tx.meta?.err) continue;

      // Check for USDC transactions
      const usdcAmount = parseUSDCAmount(tx);
      if (usdcAmount && usdcAmount > 0) {
        const roundUpAmount = calculateRoundUp(usdcAmount, settings.roundUpTo);

        if (roundUpAmount > 0) {
          roundUpTxs.push({
            signature: sig.signature,
            amount: usdcAmount,
            roundUpAmount,
            timestamp: sig.blockTime || Date.now() / 1000,
            processed: false,
            type: 'USDC',
          });
        }
      }

      // Check for SOL transactions
      const solAmount = parseSOLAmount(tx, publicKey);
      if (solAmount && solAmount > 0) {
        const roundUpAmount = calculateRoundUp(solAmount, settings.roundUpTo);

        if (roundUpAmount > 0) {
          roundUpTxs.push({
            signature: sig.signature,
            amount: solAmount,
            roundUpAmount,
            timestamp: sig.blockTime || Date.now() / 1000,
            processed: false,
            type: 'SOL',
          });
        }
      }
    }

    return roundUpTxs;
  } catch (error) {
    console.error('Error monitoring transactions:', error);
    return [];
  }
}

/**
 * Store pending round-ups
 */
export async function storePendingRoundUps(roundUps: RoundUpTransaction[]): Promise<void> {
  const existing = await getPendingRoundUps();
  const combined = [...existing, ...roundUps];

  // Remove duplicates
  const unique = combined.filter(
    (item, index, self) => index === self.findIndex(t => t.signature === item.signature)
  );

  await chrome.storage.local.set({ pending_round_ups: unique });
}

/**
 * Get pending round-ups
 */
export async function getPendingRoundUps(): Promise<RoundUpTransaction[]> {
  const result = await chrome.storage.local.get('pending_round_ups');
  return result.pending_round_ups || [];
}

/**
 * Mark round-up as processed
 */
export async function markRoundUpProcessed(signature: string): Promise<void> {
  const pending = await getPendingRoundUps();
  const updated = pending.map(tx =>
    tx.signature === signature ? { ...tx, processed: true } : tx
  );

  await chrome.storage.local.set({ pending_round_ups: updated });
}

/**
 * Get total pending round-up amount
 */
export async function getTotalPendingRoundUp(): Promise<number> {
  const pending = await getPendingRoundUps();
  return pending
    .filter(tx => !tx.processed)
    .reduce((sum, tx) => sum + tx.roundUpAmount, 0);
}
