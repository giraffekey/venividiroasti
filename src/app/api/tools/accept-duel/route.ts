import { NextResponse } from "next/server";
import { providers, utils } from "near-api-js";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const duelId = searchParams.get("duelId");
    const figure = searchParams.get("figure");

    if (!duelId || !figure) {
      return NextResponse.json(
        { error: "duelId and figure are required parameters" },
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
    const duel = JSON.parse(Buffer.from(res.result).toString());
    const stake = duel.stake;

    const transactionPayload = {
      actions: [
        {
          type: "FunctionCall",
          params: {
            account_id: "token.venividiroasti.near",
            methodName: "ft_transfer_call",
            args: {
              receiver_id: "duels.venividiroasti.near",
              amount: stake,
              memo: null,
              msg: JSON.stringify({
                function: "accept_duel",
                duel_id: duelId,
                figure,
              }),
            },
            deposit: "1",
            gas: "100000000000000",
          },
        },
      ],
    };

    return NextResponse.json({ transactionPayload });
  } catch (error) {
    console.error("Error generating NEAR transaction payload:", error);
    return NextResponse.json(
      { error: "Failed to generate NEAR transaction payload" },
      { status: 500 },
    );
  }
}
