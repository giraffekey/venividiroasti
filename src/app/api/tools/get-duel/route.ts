import { NextResponse } from "next/server";
import { providers } from "near-api-js";
import axios from "axios";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const duelId = searchParams.get("duelId");

    if (!duelId) {
      return NextResponse.json(
        { error: "duelId is a required parameter" },
        { status: 400 },
      );
    }

    const url = `https://rpc.mainnet.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const args = {
      duel_id: duelId,
    };

    const res = await provider.query({
      request_type: "call_function",
      account_id: "duels.venividiroasti.near",
      method_name: "get_duel",
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });
    const duel = JSON.parse(Buffer.from(((res as unknown) as { result: string }).result).toString());

    for (let i = 0; i < duel.turns.length; i++) {
      const cid = duel.turns[i].roast_cid;
      if (cid) {
        const { data } = await axios.get(`https://${cid}.ipfs.w3s.link`);
        console.log(data);
        duel.turns[i].roast = data;
      }
      delete duel.turns[i].roast_cid;
    }

    return NextResponse.json({ duel });
  } catch (error) {
    console.error("Error calling function:", error);
    return NextResponse.json(
      { error: "Failed to call function" },
      { status: 500 },
    );
  }
}
