import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair,
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getSettings } from './storage';

// USDC Mint addresses
const USDC_MINT = {
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  'devnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // Devnet USDC
  'demo': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // Demo uses devnet address
};

/**
 * Get Solana connection based on network settings
 */
export async function getConnection(): Promise<Connection> {
  const settings = await getSettings();
  const rpcUrl = settings.network === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://solana-devnet.g.alchemy.com/v2/8YvO_lOUS903Tb3muqvjs'; // Use devnet for both devnet and demo

  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Get SOL balance
 */
export async function getBalance(publicKey: PublicKey): Promise<number> {
  const connection = await getConnection();
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Get USDC balance
 */
export async function getUSDCBalance(publicKey: PublicKey): Promise<number> {
  const connection = await getConnection();
  const settings = await getSettings();
  const usdcMint = USDC_MINT[settings.network];

  try {
    const tokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return parseFloat(balance.value.uiAmount?.toString() || '0');
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return 0;
  }
}

/**
 * Send SOL
 */
export async function sendSOL(
  from: Keypair,
  to: PublicKey,
  amount: number
): Promise<string> {
  const connection = await getConnection();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
  return signature;
}

/**
 * Send USDC
 */
export async function sendUSDC(
  from: Keypair,
  to: PublicKey,
  amount: number
): Promise<string> {
  const connection = await getConnection();
  const settings = await getSettings();
  const usdcMint = USDC_MINT[settings.network];

  // Get associated token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    from.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const toTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    to,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // USDC has 6 decimals
  const amountInSmallestUnit = Math.floor(amount * 1_000_000);

  const transaction = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      from.publicKey,
      amountInSmallestUnit,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
  return signature;
}

/**
 * Sign transaction
 */
export function signTransaction(transaction: Transaction, keypair: Keypair): Transaction {
  transaction.sign(keypair);
  return transaction;
}

/**
 * Sign message
 */
export function signMessage(message: Uint8Array, keypair: Keypair): Uint8Array {
  return nacl.sign.detached(message, keypair.secretKey);
}

/**
 * Get recent transactions for an address
 */
export async function getRecentTransactions(
  publicKey: PublicKey,
  limit: number = 10
): Promise<any[]> {
  const connection = await getConnection();

  const signatures = await connection.getSignaturesForAddress(publicKey, {
    limit,
  });

  const transactions = [];
  for (const sig of signatures) {
    const tx = await connection.getTransaction(sig.signature, {
      maxSupportedTransactionVersion: 0,
    });
    if (tx) {
      transactions.push({
        signature: sig.signature,
        blockTime: sig.blockTime,
        ...tx,
      });
    }
  }

  return transactions;
}
