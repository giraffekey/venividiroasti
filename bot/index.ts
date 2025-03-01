import fs from "fs";
import {
  connect,
  keyStores,
  providers,
  utils,
  KeyPair,
  type Account,
} from "near-api-js";
import { create, type Client } from "@web3-storage/w3up-client";
import OpenAI from "openai";
import { filesFromPaths } from "files-from-path";
import axios from "axios";
import cron from "node-cron";
import * as dotenv from "dotenv";
import { getFigureName } from "./figures.ts";

interface RoastIndex {
  duel_id: string;
  turn: number;
  current_figure: string;
  next_figure: string;
  damage: number;
  style: string;
}

interface Turn {
  damage: number;
  style: string;
  roast_cid: string;
}

interface Duel {
  duel_id: string;
  stake: string;
  player_a: string;
  figure_a: string;
  player_b: string;
  figure_b: string;
  turns: Turn[];
  winner: string;
}

dotenv.config();

const NEAR_PRIVATE_KEY = process.env.NEAR_PRIVATE_KEY!;
const WEB3_STORAGE_EMAIL = process.env.WEB3_STORAGE_EMAIL!;
const DUELS_CONTRACT_ID = process.env.DUELS_CONTRACT_ID!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

let account: Account | null = null;
let client: Client | null = null;

const url = "https://rpc.mainnet.near.org";
const provider = new providers.JsonRpcProvider({ url });

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function connectNear() {
  if (account) return;
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(NEAR_PRIVATE_KEY as any);
  await keyStore.setKey("mainnet", "venividiroasti.near", keyPair);
  const config = {
    networkId: "mainnet",
    keyStore,
    nodeUrl: url,
  };
  const connection = await connect(config);
  account = await connection.account("venividiroasti.near");
}

async function connectStorage() {
  if (client) return;
  client = await create();
  const account = await client.login(WEB3_STORAGE_EMAIL);
  const space = await client.createSpace("venividiroasti", { account });
  await client.setCurrentSpace(space.did());
}

async function getRoastQueue(): Promise<RoastIndex[]> {
  const args = {};
  const res = await provider.query({
    request_type: "call_function",
    account_id: DUELS_CONTRACT_ID,
    method_name: "get_roast_queue",
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  });
  return JSON.parse(Buffer.from(res.result).toString());
}

async function getTopDuel(): Promise<Duel | null> {
  const args = {};
  const res = await provider.query({
    request_type: "call_function",
    account_id: DUELS_CONTRACT_ID,
    method_name: "get_top_duel",
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  });
  return JSON.parse(Buffer.from(res.result).toString());
}

async function ipfsCat(cid: string): Promise<string> {
  await connectIPFS();

  let text = "";
  for await (const chunk of ipfs.cat(CID.parse(cid))) {
    text += decoder.decode(chunk, {
      stream: true,
    });
  }
  return text;
}

async function generateRoast(index: RoastIndex) {
  await connectNear();
  await connectStorage();

  let severity;
  if (index.damage <= 3) {
    severity =
      "Mild Jibe (A light, embarrassing remark, barely scratching the opponent.)";
  } else if (index.damage <= 6) {
    severity =
      "Sharp Insult (A noticeable burn, but nothing they can’t recover from.)";
  } else if (index.damage <= 9) {
    severity =
      "Devastating Quip (A serious verbal strike, leaving them reeling.)";
  } else if (index.damage == 10) {
    severity = "Wrecking Blow (A roast so brutal it shakes their confidence.)";
  } else if (index.damage <= 14) {
    severity = "Humiliation (A career-ending insult that will be remembered.)";
  } else if (index.damage == 15) {
    severity =
      "Legacy Ruined (A roast so powerful it rewrites history itself.)";
  }

  const prompt = `
Generate a roast from ${index.current_figure} directed at ${index.next_figure}.
Keep it under 100 characters, sharp, and historically themed.
Style of the roast: ${index.style}.
Severity of the roast: ${severity}.

    `;
  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  const roast = res.choices[0].message.content.trim();

  const path = `./roast-${index.duel_id}-${index.turn}.txt`;
  fs.writeFileSync(path, roast);

  const file = await filesFromPaths([path]);
  const roast_cid = await client!.uploadFile(file[0]);
  fs.unlinkSync(path);

  await account!.functionCall({
    contractId: DUELS_CONTRACT_ID,
    methodName: "set_roast",
    args: {
      duel_id: index.duel_id,
      turn: index.turn,
      roast_cid: roast_cid.toString(),
    },
    gas: 30000000000000,
    deposit: 0,
  });

  console.log(`Roast generated for duel ${index.duel_id}! "${roast}"`);
}

async function postDuelThread(duel: Duel) {
  const figureA = getFigureName(duel.figure_a);
  const figureB = getFigureName(duel.figure_b);
  const stake = utils.format.formatNearAmount(duel.stake);

  const thread = [
    `\
🔥 Welcome to the arena! 🔥  
Today, we have a legendary face-off between ${figureA} and ${figureB}!  
👤 Players: ${duel.player_a} vs. ${duel.player_b}
💰 Stake: ${stake} $ROASTI
Let the roast battle begin! ⚔️\
  `,
  ];

  let damageA = 0;
  let damageB = 0;
  for (let i = 0; i < duel.turns.length; i++) {
    const turn = duel.turns[i];

    let figure;
    if (i % 2 == 0) {
      figure = figureA;
      damageA += turn.damage;
    } else {
      figure = figureB;
      damageB += turn.damage;
    }

    const { data: roast } = await axios.get(`https://${cid}.ipfs.w3s.link`);

    let top = `📜 Turn ${i + 1}:`;
    if (i == 9) {
      top = "🔥 Final Turn:";
    }

    thread.push(`\
${top}
➡️ ${figure} delivers a ${turn.style} Roast (Damage: ${turn.damage})
🗣️ ${roast}\
      `);
  }

  let winner;
  let winnerFigure;
  let diff;
  if (duel.winner == "PlayerA") {
    winner = duel.player_a;
    winnerFigure = figureA;
    diff = damageA - damageB;
  } else {
    winner = duel.player_b;
    winnerFigure = figureB;
    diff = damageB - damageA;
  }

  let summary;
  if (diff <= 30) {
    summary = `😅 ${winnerFigure} barely made it through—both duelists walked away with their pride (mostly) intact.`;
  } else if (diff <= 60) {
    summary = `⚔️ Sharp words were thrown, but neither side fully dominated. The crowd wants a rematch.`;
  } else if (diff <= 90) {
    summary = `🔥 One duelist started losing ground fast, but they held their own until the end.`;
  } else if (diff <= 120) {
    summary = `⚡ The arena shook as ${winnerFigure}'s insults landed with precision—this one will be talked about for a while.`;
  } else {
    summary = `💀 There was no mercy. ${winnerFigure} sent their opponent straight to the history books (for the wrong reasons).`;
  }

  thread.push(`\
${summary}
🏆 ${winner} wins the roast battle and takes the pot!\
`);
}

async function generateRoasts() {
  const queue = await getRoastQueue();
  if (queue.length > 0) {
    console.log("Roast queue:", queue);
    for (const index of queue) {
      await generateRoast(index);
    }
  }
}

async function postTopDuel() {
  const duel = await getTopDuel();
  if (duel) {
    console.log("Top duel:", duel);
    await postDuelThread(duel);
  }
}

cron.schedule("*/5 * * * *", generateRoasts);

cron.schedule("0 12 * * *", postTopDuel);
