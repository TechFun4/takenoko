use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");

#[program]
pub mod round_up_vault {
    use super::*;

    /// Initialize a user's round-up vault
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.user.key();
        vault.total_deposited = 0;
        vault.total_withdrawn = 0;
        vault.bump = ctx.bumps.vault;

        msg!("Vault initialized for user: {}", ctx.accounts.user.key());
        Ok(())
    }

    /// Deposit round-up amount into vault
    pub fn deposit_round_up(ctx: Context<DepositRoundUp>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer USDC from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, amount)?;

        // Update vault stats
        let vault = &mut ctx.accounts.vault;
        vault.total_deposited = vault.total_deposited.checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        msg!("Deposited {} to vault. Total: {}", amount, vault.total_deposited);
        Ok(())
    }

    /// Withdraw funds from vault
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let vault_balance = ctx.accounts.vault_token_account.amount;

        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(amount <= vault_balance, ErrorCode::InsufficientFunds);

        // Transfer USDC from vault to user
        let seeds = &[
            b"vault",
            vault.owner.as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, amount)?;

        // Update vault stats
        let vault = &mut ctx.accounts.vault;
        vault.total_withdrawn = vault.total_withdrawn.checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        msg!("Withdrew {} from vault. Total withdrawn: {}", amount, vault.total_withdrawn);
        Ok(())
    }

    /// Emergency close vault (must be empty)
    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        let vault_balance = ctx.accounts.vault_token_account.amount;
        require!(vault_balance == 0, ErrorCode::VaultNotEmpty);

        msg!("Vault closed for user: {}", ctx.accounts.user.key());
        Ok(())
    }
}

// Data structures

#[account]
pub struct Vault {
    pub owner: Pubkey,           // 32 bytes
    pub total_deposited: u64,    // 8 bytes
    pub total_withdrawn: u64,    // 8 bytes
    pub bump: u8,                // 1 byte
}

impl Vault {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1; // discriminator + data
}

// Instruction contexts

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = user,
        space = Vault::LEN,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = user,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositRoundUp<'info> {
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
        has_one = owner @ ErrorCode::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This is the owner of the vault
    pub owner: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
        has_one = owner @ ErrorCode::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This is the owner of the vault
    pub owner: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
        has_one = owner @ ErrorCode::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This is the owner of the vault
    pub owner: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

// Error codes

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Overflow error")]
    Overflow,
    #[msg("Vault must be empty before closing")]
    VaultNotEmpty,
}
