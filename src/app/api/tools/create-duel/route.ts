import { NextResponse } from "next/server";

const TOKEN_CONTRACT_ID = process.env.TOKEN_CONTRACT_ID!;
const DUELS_CONTRACT_ID = process.env.DUELS_CONTRACT_ID!;

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
            account_id: TOKEN_CONTRACT_ID,
            methodName: "ft_transfer_call",
            args: {
              receiver_id: DUELS_CONTRACT_ID,
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
