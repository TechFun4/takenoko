import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RoundUpVault } from "../target/types/round_up_vault";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("round-up-vault", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RoundUpVault as Program<RoundUpVault>;
  const user = provider.wallet;

  let usdcMint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultPda: PublicKey;
  let vaultTokenAccount: PublicKey;
  let vaultBump: number;

  before(async () => {
    // Create USDC mock mint
    usdcMint = await createMint(
      provider.connection,
      user.payer,
      user.publicKey,
      null,
      6 // USDC has 6 decimals
    );

    // Create user's token account
    userTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      user.publicKey
    );

    // Mint some USDC to user
    await mintTo(
      provider.connection,
      user.payer,
      usdcMint,
      userTokenAccount,
      user.publicKey,
      1000_000_000 // 1000 USDC
    );

    // Derive vault PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), user.publicKey.toBuffer()],
      program.programId
    );

    // Get vault's token account address
    vaultTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      vaultPda,
      true // allowOwnerOffCurve
    );
  });

  it("Initializes a vault", async () => {
    const tx = await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        vaultTokenAccount: vaultTokenAccount,
        usdcMint: usdcMint,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Initialize vault transaction:", tx);

    // Fetch the vault account
    const vault = await program.account.vault.fetch(vaultPda);

    assert.equal(vault.owner.toString(), user.publicKey.toString());
    assert.equal(vault.totalDeposited.toNumber(), 0);
    assert.equal(vault.totalWithdrawn.toNumber(), 0);
    assert.equal(vault.bump, vaultBump);
  });

  it("Deposits round-up amount", async () => {
    const depositAmount = 1_500_000; // 1.5 USDC

    const tx = await program.methods
      .depositRoundUp(new anchor.BN(depositAmount))
      .accounts({
        vault: vaultPda,
        vaultTokenAccount: vaultTokenAccount,
        userTokenAccount: userTokenAccount,
        usdcMint: usdcMint,
        user: user.publicKey,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Deposit transaction:", tx);

    // Check vault balance
    const vaultAccount = await getAccount(provider.connection, vaultTokenAccount);
    assert.equal(vaultAccount.amount.toString(), depositAmount.toString());

    // Check vault state
    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.totalDeposited.toNumber(), depositAmount);
  });

  it("Deposits multiple round-ups", async () => {
    const deposits = [500_000, 750_000, 250_000]; // 0.5, 0.75, 0.25 USDC
    let totalDeposited = 1_500_000; // Previous deposit

    for (const amount of deposits) {
      await program.methods
        .depositRoundUp(new anchor.BN(amount))
        .accounts({
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          userTokenAccount: userTokenAccount,
          usdcMint: usdcMint,
          user: user.publicKey,
          owner: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      totalDeposited += amount;
    }

    // Check total
    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.totalDeposited.toNumber(), totalDeposited);
  });

  it("Withdraws from vault", async () => {
    const withdrawAmount = 1_000_000; // 1 USDC

    const userBalanceBefore = await getAccount(
      provider.connection,
      userTokenAccount
    );

    const tx = await program.methods
      .withdraw(new anchor.BN(withdrawAmount))
      .accounts({
        vault: vaultPda,
        vaultTokenAccount: vaultTokenAccount,
        userTokenAccount: userTokenAccount,
        usdcMint: usdcMint,
        user: user.publicKey,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Withdraw transaction:", tx);

    // Check user received funds
    const userBalanceAfter = await getAccount(
      provider.connection,
      userTokenAccount
    );

    assert.equal(
      userBalanceAfter.amount - userBalanceBefore.amount,
      BigInt(withdrawAmount)
    );

    // Check vault state
    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.totalWithdrawn.toNumber(), withdrawAmount);
  });

  it("Fails to deposit zero amount", async () => {
    try {
      await program.methods
        .depositRoundUp(new anchor.BN(0))
        .accounts({
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          userTokenAccount: userTokenAccount,
          usdcMint: usdcMint,
          user: user.publicKey,
          owner: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.toString(), "InvalidAmount");
    }
  });

  it("Fails to withdraw more than balance", async () => {
    const vaultAccount = await getAccount(provider.connection, vaultTokenAccount);
    const vaultBalance = Number(vaultAccount.amount);
    const excessAmount = vaultBalance + 1_000_000;

    try {
      await program.methods
        .withdraw(new anchor.BN(excessAmount))
        .accounts({
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          userTokenAccount: userTokenAccount,
          usdcMint: usdcMint,
          user: user.publicKey,
          owner: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.toString(), "InsufficientFunds");
    }
  });
});
