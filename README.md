# **Veni; Vidi; Roasti**

## **Overview**
Veni; Vidi; Roasti is a blockchain-powered, AI-driven roast battle game where historical figures face off in turn-based duels. Players stake **$ROASTI** tokens to engage in verbal combat, with AI-generated roasts determining the outcome. The game is fully on-chain, with duel results stored immutably and roasts uploaded via decentralized storage.

The **AI agent** posts daily Twitter threads summarizing completed duels, making the battles public and engaging.

It can be interacted with [here](https://wallet.bitte.ai/smart-actions/?mode=debug&agentId=venividiroasti.vercel.app). Follow the bot on [Twitter](https://x.com/venividiroasti).

## **Features**
### **Smart Contracts**
- **Duel System**: Players initiate duels by selecting a historical figure and staking **$ROASTI** tokens.
- **Turn-Based Combat**: Each turn, a player selects a roast style (**Witty, Brutal, Strategic, Mocking**) to attack.
- **Damage & Weaknesses**: Damage calculations depend on chosen roast style and figure stats, with bonuses/penalties applied based on type matchups.
- **On-Chain Storage**: Duel records and results are stored permanently, with roasts uploaded to decentralized storage (Web3.Storage).
- **Token Mechanics**: **$ROASTI** is used for duels, and a **burn fee** applies when matches are won.

### **AI Agent**
- **Twitter Integration**: Posts the most significant completed duel each day as a Twitter thread.
- **AI-Generated Roasts**: Uses OpenAI to generate custom roasts between figures.
- **Leaderboard Updates**: Weekly posts tracking duel victories and most damage dealt.

## **Smart Contract Functions**
### **Duel System**
- `create_duel(figure, stake)`: Creates a duel with a selected historical figure.
- `accept_duel(duel_id, figure)`: A second player joins the duel with their chosen figure.
- `take_turn(duel_id, roast_style)`: Player executes a roast attack.
- `cancel_duel(duel_id)`: Cancels a duel under specific timeout conditions.
- `get_duel(duel_id)`: Retrieves duel details.
- `get_active_duels(count, offset)`: Fetches ongoing duels.
- `get_finished_duels(count, offset)`: Fetches completed duels.
- `get_pending_duels(count, offset)`: Fetches unaccepted duels.

### **Leaderboard & Stats**
- `get_leaderboard_by_wins(count, offset)`: Top duelists by victories.
- `get_leaderboard_by_damage(count, offset)`: Top duelists by damage dealt.

### **Token & Economy**
- `transfer_coin(receiver, amount, memo?)`: Transfer **$ROASTI** to another player.
- `burn_coin(amount)`: Burn excess **$ROASTI**.

## **Technical Stack**
- **Blockchain**: NEAR Protocol
- **Smart Contract Language**: Rust (near-sdk)
- **AI & NLP**: OpenAI GPT-4
- **Decentralized Storage**: Web3.Storage
- **Frontend & API**: Next.js
- **Twitter Bot**: Twitter API + Bitte

## **Deployment & Usage**

### **1. Deploy Contracts**
- Install NEAR CLI and cargo near
  ```sh
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/near-cli-rs/releases/latest/download/near-cli-rs-installer.sh | sh
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/near/cargo-near/releases/latest/download/cargo-near-installer.sh | sh
  ```
- Deploy contracts
  ```sh
  cd contracts/duel-manager && cargo near deploy
  cd contracts/fungible-token && cargo near deploy
  ```

### **2. Run AI Agent**
#### **Prerequisites**
- Install dependencies:
  ```sh
  pnpm install
  ```
- Configure environment variables (`.env`):
  ```sh
  DUELS_CONTRACT_ID=<contract-address>
  TOKEN_CONTRACT_ID=<contract-address>
  BITTE_API_KEY=<api-key>
  ```
- Start the agent:
  ```sh
  pnpm dev
  ```
