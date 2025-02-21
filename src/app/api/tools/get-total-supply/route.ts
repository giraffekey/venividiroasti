import { NextResponse } from "next/server";
import { providers, utils } from "near-api-js";

export async function GET() {
  try {
    const url = `https://rpc.mainnet.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const res = await provider.query({
      request_type: "call_function",
      account_id: "token.venividiroasti.near",
      method_name: "ft_total_supply",
      args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
      finality: "optimistic",
    });
    const totalSupply = JSON.parse(Buffer.from(res.result).toString());

    return NextResponse.json({ totalSupply });
  } catch (error) {
    console.error("Error calling function:", error);
    return NextResponse.json(
      { error: "Failed to call function" },
      { status: 500 },
    );
  }
}
