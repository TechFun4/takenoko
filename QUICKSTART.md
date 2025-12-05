# Quick Start Guide - RoundUp Wallet

Get your RoundUp wallet running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js (need v18+)
node --version

# Check if you have Rust (optional for smart contract)
rustc --version

# Check Solana CLI (optional for smart contract)
solana --version

# Check Anchor (optional for smart contract)
anchor --version
```

## Option 1: Just Use the Extension (No Smart Contract Deployment)

If you just want to test the wallet extension without deploying your own smart contract:

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
npm run build:extension
```

### 3. Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to your project folder and select the `dist/` folder
5. The RoundUp wallet icon should appear in your extensions

### 4. Create Your Wallet

1. Click the extension icon
2. Follow the setup wizard
3. **SAVE YOUR 12-WORD RECOVERY PHRASE!**
4. Create a password
5. You're ready!

### 5. Get Test Funds

To test on devnet:

1. Copy your wallet address (click address at top of wallet)
2. Go to https://faucet.solana.com/
3. Paste your address and request SOL
4. Get test USDC from https://spl-token-faucet.com/ (select Devnet USDC)

---

## Option 2: Full Setup (Deploy Your Own Smart Contract)

### 1. Install Solana Tools

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 2. Create Solana Wallet for Deployment

```bash
# Generate a new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Set to devnet
solana config set --url devnet

# Get your address
solana address

# Request airdrop
solana airdrop 2
```

### 3. Install Project Dependencies

```bash
npm install
```

### 4. Build and Deploy Smart Contract

```bash
# Build the program
anchor build

# Get the program ID
solana address -k target/deploy/round_up_vault-keypair.json

# Update Anchor.toml and lib.rs with this program ID
# Then rebuild
anchor build

# Deploy to devnet
anchor deploy

# Run tests
anchor test
```

### 5. Update Extension Config

After deploying, you may need to update the program ID in:
- `extension/lib/wallet/transaction.ts` (if you see program ID references)

### 6. Build Extension

```bash
npm run build:extension
```

### 7. Load in Chrome

Same as Option 1, step 3.

---

## Testing the Round-Up Feature

1. **Create wallet and get funds** (see above)

2. **Make a USDC transaction**:
   - Go to the Send tab
   - Send USDC to any address (or back to yourself)
   - Amount: e.g., $12.37

3. **Check round-up**:
   - Go to the Round-Up tab (💰)
   - You should see a pending round-up of $0.63
   - The background service checks every 30 seconds

4. **Invest round-up**:
   - Click "Invest Now"
   - Confirm transaction
   - Funds move to your on-chain vault!

---

## Development Mode

For active development with auto-reload:

```bash
# Terminal 1: Watch extension files
npm run dev:extension

# Every time you save a file, it rebuilds
# You'll need to click "Reload" on chrome://extensions/ to see changes
```

---

## Troubleshooting

### "Anchor command not found"
Install Anchor following the instructions above.

### "Insufficient funds"
Request more SOL from the faucet. Devnet tokens are free!

### "Program not found"
Make sure you've deployed the program and updated the program ID in `Anchor.toml`.

### "Transaction failed"
Check your wallet has enough SOL for transaction fees and enough USDC for the transfer.

### Extension not loading
1. Make sure you ran `npm run build:extension`
2. Check `dist/` folder exists
3. Try removing and re-adding the extension

### Round-ups not appearing
1. Wait 30-60 seconds (background service runs every 30s)
2. Check browser console for errors
3. Make sure you made a USDC transaction (not SOL)

---

## Next Steps

- Read the full [README.md](README.md) for architecture details
- Check out the smart contract code in `programs/round-up-vault/src/lib.rs`
- Explore wallet logic in `extension/lib/wallet/`
- Join the community (Discord/Twitter links in README)

---

## Security Reminder

⚠️ This is alpha software:
- Test thoroughly on devnet first
- Never use with large amounts
- Always save your recovery phrase
- Use a strong password

Happy round-up investing! 🚀
