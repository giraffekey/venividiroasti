import { NextResponse } from "next/server";
import { utils } from "near-api-js";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const figure = searchParams.get("figure");
    const stake = searchParams.get("stake");

    if (!figure || !stake) {
      return NextResponse.json(
        { error: "figure and stake are required parameters" },
        { status: 400 },
      );
    }

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
                function: "create_duel",
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
