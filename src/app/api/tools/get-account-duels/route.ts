import { NextResponse } from "next/server";
import { providers } from "near-api-js";

const DUELS_CONTRACT_ID = process.env.DUELS_CONTRACT_ID!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    const url = `https://rpc.mainnet.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const args = {
      account_id: accountId,
    };

    const res = await provider.query({
      request_type: "call_function",
      account_id: DUELS_CONTRACT_ID,
      method_name: "get_account_duels",
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });
    const duels = JSON.parse(
      Buffer.from((res as unknown as { result: string }).result).toString(),
    );

    for (let i = 0; i < duels.length; i++) {
      delete duels[i].turns;
    }

    return NextResponse.json(duels);
  } catch (error) {
    console.error("Error calling function:", error);
    return NextResponse.json(
      { error: "Failed to call function" },
      { status: 500 },
    );
  }
}
