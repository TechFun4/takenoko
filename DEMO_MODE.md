# 🎬 Takenoko Demo Mode

Demo Mode allows you to showcase the Takenoko wallet features without using real funds or connecting to the blockchain.

## Features

### 1. Pre-funded Wallet
- **3.5 SOL** - A few SOL for testing
- **100 USDC** - Starting USDC balance
- **$12.43** - Mock pending round-ups
- **$87.65** - Mock invested amount in Jupiter Lend

### 2. Live APY Display
- Shows current **USDC APY** from Jupiter Lend (fallback: 4.90%)
- Shows current **SOL APY** from Jupiter Lend (fallback: 3.00%)
- APY rates are fetched live from Jupiter Lend API

### 3. Working Round-Up Button
- Click "Invest $X.XX Now" to simulate investing round-ups
- Funds move from "Pending Round-Ups" to "Total Invested"
- Shows confirmation message with bamboo theme

### 4. Send with Round-Up
- Pre-filled example: Send $29.67 to Alice
- Shows round-up preview: "+$0.33 🎋"
- Click Send to simulate payment
- Round-up automatically added to savings
- Balance updates in real-time

## How to Use Demo Mode

### Step 1: Switch to Demo Mode
1. Open Takenoko wallet extension
2. Click **Settings** tab (⚙️) at the bottom
3. Select **"Demo Mode (Try it!)"** from Network dropdown
4. Wallet will reload with demo balances

### Step 2: Explore Features

#### View Balances
- Check the **Home** tab to see your mock balances
- Total Balance shows USDC value
- SOL balance displayed below

#### Check Round-Ups
- Click **Round-Up** tab (💰)
- See pending round-ups: $12.43
- View current APY rates for USDC and SOL
- Click **"Invest Now"** to move pending to invested

#### Try Sending
1. Click **Send** tab (📤)
2. Form is pre-filled with Alice payment: $29.67
3. Notice the round-up preview: "+$0.33 🎋"
4. Click **Send (Demo)**
5. See confirmation with round-up details
6. Return to Home to see updated balance and round-ups

### Step 3: Try the Demo Payment Page

We've created a merchant payment page to demonstrate the full flow:

1. **Open the demo page:**
   ```
   C:\Users\david\Documents\rug\demo\alice-dinner.html
   ```
   Or open it in your browser

2. **Review the invoice:**
   - From: Alice
   - Dinner split at Pasta Paradise
   - Amount: $29.67
   - Round-up: +$0.33

3. **Click "Pay with Takenoko"**
   - Simulates payment processing
   - Shows success message
   - Round-up saved to your wallet

4. **Check your wallet:**
   - Open Takenoko extension
   - See updated round-up total
   - Watch your savings grow like bamboo! 🎋

## Demo vs Real Networks

### 🎬 Demo Mode
- **Purpose:** Showcase features without risk
- **Balances:** Mock balances (3.5 SOL, 100 USDC)
- **Transactions:** Simulated, no blockchain
- **APY:** Real rates from Jupiter Lend API
- **Perfect for:** Testing, demos, exploring features

### 🟢 Devnet
- **Purpose:** Testing with real blockchain
- **Balances:** Real testnet tokens
- **Transactions:** Real Solana devnet transactions
- **APY:** Real rates (Jupiter Lend limited on devnet)
- **Perfect for:** Development, testing integrations

### 🔴 Mainnet
- **Purpose:** Production use
- **Balances:** Real SOL and USDC
- **Transactions:** Real blockchain transactions
- **APY:** Live Jupiter Lend rates
- **Perfect for:** Real usage, actual savings

## Network Indicator

The header shows your current network:
- 🎬 Demo - Demo mode (safe to play)
- 🟢 Devnet - Test network
- 🔴 Mainnet - Real funds (be careful!)

## Demo Features Summary

✅ **Implemented:**
- Demo mode network option
- Mock balances (SOL, USDC)
- Live APY display with fallback
- Working round-up invest button
- Send with automatic round-up
- Demo payment page (Alice dinner)
- Real-time balance updates
- Network switching

🚧 **Coming Soon:**
- Real Jupiter Lend integration for mainnet
- Transaction history in demo mode
- Multiple demo scenarios
- Animated transitions

## Tips for Demoing

1. **Start Fresh:** Switch to Demo Mode to reset balances
2. **Show Round-Ups:** Use the Send tab to demonstrate automatic round-ups
3. **Show Investment:** Click "Invest Now" to show growth potential
4. **Show APY:** Point out the live APY rates from Jupiter Lend
5. **Use Payment Page:** Open alice-dinner.html for full merchant flow
6. **Explain Safety:** Emphasize that demo mode is completely safe

## Technical Details

### Mock Data
```typescript
// Demo balances
SOL: 3.5
USDC: 100.00
Pending Round-Ups: $12.43
Jupiter Invested: $87.65
```

### APY Sources
1. **Primary:** Jupiter Lend Earn API
2. **Fallback:** 4.90% USDC, 3.00% SOL

### Round-Up Logic
```typescript
// Example: $29.67 payment
Original: $29.67
Rounded: $30.00
Round-up: $0.33 → Savings
```

## Troubleshooting

### Demo balances not showing?
- Make sure you're in Demo Mode (check header: 🎬 Demo)
- Try refreshing: close and reopen extension
- Switch to another network and back to Demo

### APY showing fallback rates?
- This is normal if Jupiter API is slow
- Fallback: 4.90% USDC, 3.00% SOL
- Real rates may take a few seconds to load

### Send button not working?
- Make sure you're in Demo Mode
- Check that amount is valid (> 0)
- Try with the pre-filled Alice example

## Demo Walkthrough Script

> "Let me show you Takenoko, the bamboo-fast savings wallet for Solana.
>
> First, notice we're in Demo Mode - completely safe to explore. You can see I have 3.5 SOL and 100 USDC.
>
> Let's pay Alice back for dinner. I'll send her $29.67... notice the wallet automatically rounds up to $30. That extra $0.33 goes into my savings!
>
> [Click Send]
>
> See? Payment sent, and my round-up just increased. Now let's check my savings tab...
>
> [Click Round-Up tab]
>
> Here you can see all my pending round-ups adding up. And look at these APY rates - 4.90% on USDC, pulled live from Jupiter Lend!
>
> When I'm ready, I just click 'Invest Now' and boom - my spare change is earning yield on Jupiter Lend, growing as fast as bamboo shoots! 🎋"

---

**Ready to try Demo Mode?** Reload your extension and switch to Demo Mode in Settings!
