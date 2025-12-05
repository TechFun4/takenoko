# Takenoko Wallet

## Bamboo-fast savings growth - Round-up USDC & SOL, earn yield on Jupiter Lend

A browser extension wallet for Solana that automatically rounds up your transactions and invests the difference in USDC and SOL, similar to Acorns for traditional finance.

## Features

- **Full Solana Wallet**: Send, receive, and manage SOL and SPL tokens
- **Automatic Round-Up**: Every transaction rounds up to the nearest dollar, with the difference saved for investing
- **USDC Vault**: Secure on-chain vault powered by Anchor smart contracts
- **DeFi Integration**: Auto-invest round-ups into yield-generating protocols (Jupiter Lend and Kamino Finance) 
- **dApp Compatible**: Works with Solana dApps like Phantom wallet
- **Secure**: BIP39 mnemonic phrases, encrypted storage, password protection


## Prerequisites

### For Smart Contract Development:

1. **Rust** (latest stable)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Solana CLI** (v1.17+)
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

3. **Anchor Framework** (v0.29+)
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

### For Extension Development:

1. **Node.js** (v18+)
2. **npm** or **yarn**

## Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Smart Contract

```bash
# Build the Anchor program
anchor build

# Run tests
anchor test

# Deploy to devnet
solana config set --url devnet
anchor deploy
```

After deployment, copy the program ID and update it in:
- `Anchor.toml` (programs.devnet.round_up_vault)
- `extension/lib/wallet/transaction.ts` (if needed)

### 3. Build the Browser Extension

```bash
# Development build with watch mode
npm run dev:extension

# Production build
npm run build:extension
```

The compiled extension will be in the `dist/` folder.

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder

## Usage

### First Time Setup

1. Click the Takenoko extension icon
2. Click "Create New Wallet"
3. **IMPORTANT**: Write down your 12-word recovery phrase
4. Create a strong password
5. Your wallet is ready!

### Using the Wallet

- **Receive**: Click "Receive" to copy your address
- **Send**: Click "Send" to transfer SOL or USDC
- **Round-Up**: View pending round-ups in the "Round-Up" tab
- **Invest**: Click "Invest Now" to deposit round-ups into your vault

### Round-Up System

1. The background service monitors all your USDC transactions
2. For each transaction (e.g., $12.37), it calculates the round-up ($0.63)
3. Round-ups accumulate in your "pending" list
4. Click "Invest Now" to transfer round-ups to your on-chain vault
5. (Coming soon) Enable auto-invest for automatic deposits

## Smart Contract

### Vault Instructions

```rust
// Initialize your vault (one-time)
initialize_vault(ctx: Context<InitializeVault>)

// Deposit round-up amount
deposit_round_up(ctx: Context<DepositRoundUp>, amount: u64)

// Withdraw funds
withdraw(ctx: Context<Withdraw>, amount: u64)

// Close vault (must be empty)
close_vault(ctx: Context<CloseVault>)
```

### Vault Account Structure

```rust
pub struct Vault {
    pub owner: Pubkey,           // Vault owner
    pub total_deposited: u64,    // Total USDC deposited
    pub total_withdrawn: u64,    // Total USDC withdrawn
    pub bump: u8,                // PDA bump seed
}
```

## Development

### Run Tests

```bash
# Anchor program tests
anchor test

# Extension tests (coming soon)
npm test
```

### Code Structure

**Smart Contract** ([programs/round-up-vault/src/lib.rs](programs/round-up-vault/src/lib.rs)):
- Vault initialization and management
- USDC transfers using SPL Token
- PDA-based vault accounts

**Wallet Core** ([extension/lib/wallet/](extension/lib/wallet/)):
- `keypair.ts`: BIP39 mnemonic, key derivation
- `storage.ts`: Encrypted storage, password hashing
- `transaction.ts`: Signing, broadcasting, balance queries

**Round-Up Logic** ([extension/lib/round-up/monitor.ts](extension/lib/round-up/monitor.ts)):
- Transaction monitoring
- Round-up calculation
- Pending round-up management

**UI Components** ([extension/popup/components/](extension/popup/components/)):
- `SetupWallet.tsx`: Wallet creation flow
- `UnlockWallet.tsx`: Password unlock
- `Dashboard.tsx`: Main wallet interface

## Security

- **Never share your recovery phrase**: Anyone with your 12 words has full access to your wallet
- **Use a strong password**: Protects your encrypted keys in browser storage
- **Audit code**: This is alpha software - review before using with real funds
- **Start with devnet**: Test thoroughly on devnet before mainnet

## Technical Details

### USDC Addresses

- **Devnet**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **Mainnet**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

### Network Endpoints

- **Devnet**: `https://api.devnet.solana.com`
- **Mainnet**: `https://api.mainnet-beta.solana.com`

## License

MIT License - see LICENSE file

## Disclaimer

This is experimental software. Use at your own risk. Not audited. Not production ready!!!


---

Built with ❤️ for the Solana ecosystem and funny Twitter beef about lending protocols
