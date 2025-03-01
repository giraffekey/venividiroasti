import { NextResponse } from "next/server";
import { providers } from "near-api-js";

const TOKEN_CONTRACT_ID = process.env.TOKEN_CONTRACT_ID!;

export async function GET() {
  try {
    const url = `https://rpc.mainnet.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const res = await provider.query({
      request_type: "call_function",
      account_id: TOKEN_CONTRACT_ID,
      method_name: "ft_total_supply",
      args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
      finality: "optimistic",
    });
    const totalSupply = JSON.parse(
      Buffer.from((res as unknown as { result: string }).result).toString(),
    );

    return NextResponse.json({ totalSupply });
  } catch (error) {
    console.error("Error calling function:", error);
    return NextResponse.json(
      { error: "Failed to call function" },
      { status: 500 },
    );
  }
}
