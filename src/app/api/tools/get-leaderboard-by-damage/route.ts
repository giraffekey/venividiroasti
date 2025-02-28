import { NextResponse } from "next/server";
import { providers } from "near-api-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = searchParams.get("count");
    const offset = searchParams.get("offset");

    const url = `https://rpc.mainnet.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const args = {
      count: parseInt(count || "10"),
      offset: parseInt(offset || "0"),
    };

    const res = await provider.query({
      request_type: "call_function",
      account_id: "duels.venividiroasti.near",
      method_name: "get_leaderboard_by_damage",
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });
    const leaderboard = JSON.parse(Buffer.from(((res as unknown) as { result: string }).result).toString());

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error calling function:", error);
    return NextResponse.json(
      { error: "Failed to call function" },
      { status: 500 },
    );
  }
}
