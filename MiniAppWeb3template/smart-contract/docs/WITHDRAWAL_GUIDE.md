# Smart Contract Withdrawal Guide

This guide explains how to withdraw funds from the Economy smart contract using the withdrawal script.

## Overview

The Economy contract has emergency withdrawal functions that allow the contract owner to withdraw:
- **LIFE tokens** - The native game token
- **WLD tokens** - Worldcoin tokens

## Prerequisites

1. **You must be the contract owner** - Only the owner can withdraw funds
2. **Environment setup** - Ensure your `.env` file is configured with:
   ```
   PRIVATE_KEY="your-private-key-here"
   WORLDCHAIN_RPC_URL="https://worldchain-mainnet.g.alchemy.com/public"
   ```
3. **Dependencies installed** - Run `npm install` if you haven't already

## Contract Information

- **Network**: Worldchain Mainnet (Chain ID: 480)
- **Economy Contract**: `0xC49e59216Ae053586F416fEde49b1A9d2B290a29`
- **LIFE Token**: `0x5c231686b74CB255b7952E120b4C5AB370f9194C`
- **WLD Token**: `0x2cFc85d8E48F8EAB294be644d9E25C3030863003`

## Usage

### Basic Commands

```bash
# Check current balances (no withdrawal)
npm run withdraw

# Withdraw specific amounts
npm run withdraw -- --life 100 --wld 50

# Withdraw all available tokens
npm run withdraw -- --all

# Withdraw only LIFE tokens
npm run withdraw -- --life 250

# Withdraw only WLD tokens
npm run withdraw -- --wld 75
```

### Local Testing

```bash
# For local hardhat network testing
npm run withdraw:local -- --life 100
```

## Command Options

| Option | Description | Example |
|--------|-------------|----------|
| `--life <amount>` | Withdraw specific amount of LIFE tokens | `--life 100` |
| `--wld <amount>` | Withdraw specific amount of WLD tokens | `--wld 50` |
| `--all` | Withdraw all available tokens from contract | `--all` |

## Script Features

✅ **Safety Checks**:
- Verifies you are the contract owner
- Checks contract balances before withdrawal
- Validates withdrawal amounts don't exceed available balance

✅ **Comprehensive Logging**:
- Shows current contract balances
- Displays transaction hashes
- Confirms successful withdrawals

✅ **Error Handling**:
- Clear error messages for common issues
- Graceful handling of failed transactions

## Example Output

```
Starting withdrawal process...
Withdrawing with account: 0xA13A18ccD767B83543212B0424426A374f565Fb8
Account balance: 0.5 ETH

Contract addresses:
Economy: 0xC49e59216Ae053586F416fEde49b1A9d2B290a29
LIFE Token: 0x5c231686b74CB255b7952E120b4C5AB370f9194C
WLD Token: 0x2cFc85d8E48F8EAB294be644d9E25C3030863003

Checking current balances in Economy contract...
LIFE balance: 1500.0 LIFE
WLD balance: 750.0 WLD

✅ Confirmed: You are the contract owner

Withdrawal amounts requested:
LIFE: 100
WLD: 50

Withdrawing 100 LIFE tokens...
Transaction hash: 0x1234567890abcdef...
Waiting for confirmation...
✅ LIFE withdrawal successful! Block: 12345

Withdrawing 50 WLD tokens...
Transaction hash: 0xabcdef1234567890...
Waiting for confirmation...
✅ WLD withdrawal successful! Block: 12346

✅ Withdrawal process completed!
```

## Common Issues

### "You are not the contract owner"
- **Solution**: Ensure you're using the correct private key for the contract owner account
- **Owner Address**: `0xA13A18ccD767B83543212B0424426A374f565Fb8`

### "Requested amount exceeds contract balance"
- **Solution**: Check current contract balances first by running `npm run withdraw` without parameters
- Use `--all` to withdraw maximum available amounts

### "Transaction failed"
- **Solution**: Ensure you have enough ETH for gas fees
- Check that the contract has the tokens you're trying to withdraw

### "Network connection issues"
- **Solution**: Verify your `WORLDCHAIN_RPC_URL` in the `.env` file
- Try using the public RPC: `https://worldchain-mainnet.g.alchemy.com/public`

## Security Notes

⚠️ **Important Security Considerations**:

1. **Private Key Security**: Never share your private key or commit it to version control
2. **Owner-Only Functions**: These withdrawal functions are restricted to the contract owner only
3. **Emergency Use**: These are emergency withdrawal functions - use responsibly
4. **Gas Costs**: Each withdrawal requires ETH for gas fees on Worldchain

## Smart Contract Functions Used

The script calls these contract functions:

```solidity
// Withdraw LIFE tokens (owner only)
function emergencyWithdrawLife(uint256 amount) external onlyOwner

// Withdraw WLD tokens (owner only)  
function emergencyWithdrawWld(uint256 amount) external onlyOwner
```

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your environment configuration
3. Ensure you have sufficient ETH for gas fees
4. Confirm you're using the correct network (Worldchain)

---

**File Location**: `scripts/withdraw-funds.js`  
**Last Updated**: Created for Economy contract withdrawal functionality