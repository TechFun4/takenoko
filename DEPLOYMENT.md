# Deployment Guide

## Overview

This guide covers deploying the RoundUp Wallet to production environments.

## Prerequisites

- Solana CLI installed and configured
- Anchor CLI installed (v0.29+)
- Node.js and npm installed
- Chrome browser for testing

---

## Part 1: Smart Contract Deployment

### Step 1: Generate Deployment Wallet

```bash
# Create a new keypair for deployment
solana-keygen new --outfile ~/.config/solana/deployer.json

# Show your address
solana address -k ~/.config/solana/deployer.json

# Set as default
solana config set --keypair ~/.config/solana/deployer.json
```

### Step 2: Fund Your Wallet

#### For Devnet (Free)
```bash
# Set to devnet
solana config set --url devnet

# Request airdrop (can do multiple times)
solana airdrop 2
solana airdrop 2
```

#### For Mainnet (Costs Real SOL)
```bash
# Set to mainnet
solana config set --url mainnet-beta

# Transfer SOL from another wallet or buy from exchange
# You'll need ~5-10 SOL for deployment and testing
```

### Step 3: Build the Program

```bash
# Build
anchor build

# Get your program ID
solana address -k target/deploy/round_up_vault-keypair.json
```

### Step 4: Update Program ID

**Important**: Copy the program ID from above and update:

1. **Anchor.toml**:
```toml
[programs.devnet]
round_up_vault = "YOUR_PROGRAM_ID_HERE"

[programs.mainnet]
round_up_vault = "YOUR_PROGRAM_ID_HERE"
```

2. **programs/round-up-vault/src/lib.rs**:
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

### Step 5: Rebuild and Deploy

```bash
# Rebuild with correct program ID
anchor build

# Deploy to devnet
solana config set --url devnet
anchor deploy

# Or deploy to mainnet (CAREFUL!)
solana config set --url mainnet-beta
anchor deploy
```

### Step 6: Verify Deployment

```bash
# Check program exists
solana program show YOUR_PROGRAM_ID

# Run tests
anchor test
```

---

## Part 2: Extension Build

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Update Configuration

If you deployed your own smart contract, you may need to update:

**extension/lib/wallet/transaction.ts**:
- Update USDC mint addresses if using custom tokens
- Update RPC endpoints if using custom nodes

### Step 3: Build Extension

```bash
# Production build
npm run build:extension

# This creates the dist/ folder
```

### Step 4: Test Locally

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Test all functionality

### Step 5: Prepare for Chrome Web Store

#### Create Icons

Place in `extension/assets/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can create these with:
- Design tools (Figma, Canva)
- Icon generators
- AI image generation

#### Rebuild with Icons

```bash
npm run build:extension
```

#### Create Screenshots

Take screenshots for the store:
- 1280x800 or 640x400
- Show main features:
  - Wallet creation
  - Dashboard
  - Round-up feature
  - Send/receive

#### Create Promotional Materials

- Extension name: "RoundUp Wallet"
- Short description: "Solana wallet with automatic round-up investing"
- Long description: (Use README.md as template)
- Category: Productivity / Finance
- Privacy policy: (Create if collecting any data)

---

## Part 3: Chrome Web Store Submission

### Step 1: Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee
3. Complete developer profile

### Step 2: Package Extension

```bash
# Zip the dist folder
cd dist
zip -r ../roundup-wallet.zip *
cd ..
```

### Step 3: Upload

1. Click "New Item" in dashboard
2. Upload `roundup-wallet.zip`
3. Fill in all required fields:
   - Name
   - Description
   - Category
   - Language
   - Screenshots
   - Icons
   - Privacy practices

### Step 4: Submit for Review

- Click "Submit for review"
- Review typically takes 1-3 days
- Address any feedback from reviewers

---

## Part 4: Mainnet Deployment Checklist

Before going to mainnet, ensure:

### Security
- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] Smart contract verified
- [ ] Bug bounty program considered

### Testing
- [ ] All features tested on devnet
- [ ] Edge cases handled
- [ ] Error messages are clear
- [ ] Transaction fees verified

### Legal
- [ ] Terms of service created
- [ ] Privacy policy published
- [ ] Jurisdiction compliance checked
- [ ] Insurance considered

### Monitoring
- [ ] Error logging implemented
- [ ] Analytics set up (optional)
- [ ] Alert system for issues
- [ ] Incident response plan

### Support
- [ ] Documentation complete
- [ ] FAQ created
- [ ] Support channel established (Discord, Email)
- [ ] Community management plan

---

## Part 5: Post-Deployment

### Monitor Program

```bash
# Watch program logs
solana logs YOUR_PROGRAM_ID

# Check program data size
solana program show YOUR_PROGRAM_ID
```

### Upgrade Program (if needed)

```bash
# Build new version
anchor build

# Upgrade (requires authority)
anchor upgrade target/deploy/round_up_vault.so --program-id YOUR_PROGRAM_ID
```

### Extension Updates

When you update the extension:

1. Increment version in `manifest.json`
2. Rebuild: `npm run build:extension`
3. Create new zip file
4. Upload to Chrome Web Store
5. Submit for review

---

## Troubleshooting

### "Program verification failed"
- Ensure program ID matches in all files
- Rebuild: `anchor build`

### "Insufficient funds for deployment"
- Each deployment costs ~2-5 SOL
- Get more from faucet (devnet) or exchange (mainnet)

### "Extension not loading"
- Check console for errors: `chrome://extensions/` > "Inspect views: service worker"
- Verify all files in dist/ folder
- Check manifest.json syntax

### "Transaction simulation failed"
- Check you have enough SOL for fees
- Verify network (devnet vs mainnet)
- Check USDC token account exists

---

## Costs

### Devnet (Free)
- Program deployment: Free (devnet SOL)
- Testing: Free
- Time: 1-2 hours

### Mainnet
- Program deployment: 2-5 SOL (~$200-500)
- Rent exemption per vault: ~0.002 SOL
- Chrome Web Store: $5 one-time
- Security audit: $5,000-50,000 (recommended)
- Total initial: ~$5,200-50,500

---

## Timeline

- **Devnet deployment**: 1-2 hours
- **Extension development**: Complete ✅
- **Local testing**: 2-3 days
- **Chrome Web Store review**: 1-3 days
- **Security audit**: 2-4 weeks
- **Mainnet deployment**: 1 day
- **Total to production**: 3-5 weeks

---

## Rollback Plan

If issues found after deployment:

1. **Disable extension**: Unpublish from Chrome Web Store
2. **Notify users**: Email/Discord announcement
3. **Fix issue**: Debug and patch
4. **Redeploy**: Test on devnet, then mainnet
5. **Re-enable**: Republish to store

---

## Support Resources

- Solana Docs: https://docs.solana.com
- Anchor Docs: https://www.anchor-lang.com
- Chrome Extensions: https://developer.chrome.com/docs/extensions
- Solana Discord: https://discord.gg/solana
- Stack Exchange: https://solana.stackexchange.com

---

Good luck with your deployment! 🚀
