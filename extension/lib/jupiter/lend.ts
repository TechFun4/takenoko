import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import { getSettings } from '../wallet/storage';

const JUPITER_LEND_API = 'https://lend-api.jup.ag/v1/earn';

export interface JupiterEarnToken {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  totalDeposited: string;
  apy: number;
}

export interface JupiterPosition {
  owner: string;
  mint: string;
  depositedAmount: string;
  shareAmount: string;
  value: string;
}

export interface JupiterEarnings {
  owner: string;
  mint: string;
  totalEarnings: string;
  currentValue: string;
}

/**
 * Get available tokens for Jupiter Lend Earn
 */
export async function getJupiterEarnTokens(): Promise<JupiterEarnToken[]> {
  try {
    const response = await fetch(`${JUPITER_LEND_API}/tokens`);
    const data = await response.json();
    return data.tokens || [];
  } catch (error) {
    console.error('Error fetching Jupiter Earn tokens:', error);
    return [];
  }
}

/**
 * Get user's positions on Jupiter Lend
 */
export async function getJupiterPositions(owner: PublicKey): Promise<JupiterPosition[]> {
  try {
    const response = await fetch(`${JUPITER_LEND_API}/positions?owners=${owner.toBase58()}`);
    const data = await response.json();
    return data.positions || [];
  } catch (error) {
    console.error('Error fetching Jupiter positions:', error);
    return [];
  }
}

/**
 * Get earnings for a position
 */
export async function getJupiterEarnings(owner: PublicKey): Promise<JupiterEarnings[]> {
  try {
    const response = await fetch(`${JUPITER_LEND_API}/earnings?owners=${owner.toBase58()}`);
    const data = await response.json();
    return data.earnings || [];
  } catch (error) {
    console.error('Error fetching Jupiter earnings:', error);
    return [];
  }
}

/**
 * Create deposit transaction for Jupiter Lend
 */
export async function createJupiterDepositTx(
  owner: PublicKey,
  mint: PublicKey,
  amount: number
): Promise<Transaction | null> {
  try {
    const response = await fetch(`${JUPITER_LEND_API}/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner: owner.toBase58(),
        mint: mint.toBase58(),
        amount: amount.toString(),
      }),
    });

    const data = await response.json();

    if (!data.transaction) {
      throw new Error('No transaction returned from Jupiter');
    }

    // Decode base64 transaction
    const txBuffer = Buffer.from(data.transaction, 'base64');
    const transaction = Transaction.from(txBuffer);

    return transaction;
  } catch (error) {
    console.error('Error creating Jupiter deposit transaction:', error);
    return null;
  }
}

/**
 * Create withdraw transaction for Jupiter Lend
 */
export async function createJupiterWithdrawTx(
  owner: PublicKey,
  mint: PublicKey,
  amount: number
): Promise<Transaction | null> {
  try {
    const response = await fetch(`${JUPITER_LEND_API}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner: owner.toBase58(),
        mint: mint.toBase58(),
        amount: amount.toString(),
      }),
    });

    const data = await response.json();

    if (!data.transaction) {
      throw new Error('No transaction returned from Jupiter');
    }

    // Decode base64 transaction
    const txBuffer = Buffer.from(data.transaction, 'base64');
    const transaction = Transaction.from(txBuffer);

    return transaction;
  } catch (error) {
    console.error('Error creating Jupiter withdraw transaction:', error);
    return null;
  }
}

/**
 * Deposit round-up amounts into Jupiter Lend
 */
export async function depositRoundUpToJupiter(
  owner: PublicKey,
  usdcAmount: number,
  solAmount: number
): Promise<{ usdcTx: Transaction | null; solTx: Transaction | null }> {
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112'); // Wrapped SOL

  const results = {
    usdcTx: null as Transaction | null,
    solTx: null as Transaction | null,
  };

  // Create USDC deposit transaction if amount > 0
  if (usdcAmount > 0) {
    const usdcAmountLamports = Math.floor(usdcAmount * 1_000_000); // USDC has 6 decimals
    results.usdcTx = await createJupiterDepositTx(owner, USDC_MINT, usdcAmountLamports);
  }

  // Create SOL deposit transaction if amount > 0
  if (solAmount > 0) {
    const solAmountLamports = Math.floor(solAmount * 1_000_000_000); // SOL has 9 decimals
    results.solTx = await createJupiterDepositTx(owner, SOL_MINT, solAmountLamports);
  }

  return results;
}

/**
 * Get total value deposited in Jupiter Lend
 */
export async function getTotalJupiterValue(owner: PublicKey): Promise<number> {
  try {
    const positions = await getJupiterPositions(owner);

    let totalValue = 0;
    for (const position of positions) {
      totalValue += parseFloat(position.value || '0');
    }

    return totalValue;
  } catch (error) {
    console.error('Error calculating total Jupiter value:', error);
    return 0;
  }
}

/**
 * Get APY for a specific token
 */
export async function getTokenAPY(mint: string): Promise<number> {
  try {
    const tokens = await getJupiterEarnTokens();
    const token = tokens.find(t => t.mint === mint);
    return token?.apy || 0;
  } catch (error) {
    console.error('Error fetching token APY:', error);
    return 0;
  }
}

/**
 * Get APY with fallback rates for USDC and SOL
 * Fallback: 4.90% for USDC, 3.00% for SOL
 */
export async function getAPYWithFallback(symbol: 'USDC' | 'SOL'): Promise<number> {
  const FALLBACK_APY = {
    USDC: 4.90,
    SOL: 3.00,
  };

  try {
    const tokens = await getJupiterEarnTokens();
    const token = tokens.find(t => t.symbol === symbol);

    if (token && token.apy > 0) {
      return token.apy;
    }

    // Return fallback if not found or APY is 0
    return FALLBACK_APY[symbol];
  } catch (error) {
    console.error(`Error fetching ${symbol} APY, using fallback:`, error);
    return FALLBACK_APY[symbol];
  }
}
