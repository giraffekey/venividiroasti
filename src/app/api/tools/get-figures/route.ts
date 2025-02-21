import { NextResponse } from "next/server";
import { providers, utils } from "near-api-js";

export async function GET() {
  try {
    const url = `https://rpc.mainnet.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const args = {};

    const res = await provider.query({
      request_type: "call_function",
      account_id: "duels.venividiroasti.near",
      method_name: "get_figures",
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });
    const figures = JSON.parse(Buffer.from(res.result).toString());

    return NextResponse.json(figures);
  } catch (error) {
    console.error("Error getting figures:", error);
    return NextResponse.json(
      { error: "Failed to get figures" },
      { status: 500 },
    );
  }
}
