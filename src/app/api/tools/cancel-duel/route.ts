import { NextResponse } from "next/server";
import { utils } from "near-api-js";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const duelId = searchParams.get("duelId");

    if (!duelId) {
      return NextResponse.json(
        { error: "duelId is a required parameter" },
        { status: 400 },
      );
    }

    const transactionPayload = {
      actions: [
        {
          type: "FunctionCall",
          params: {
            account_id: "duels.venividiroasti.near",
            methodName: "cancel_duel",
            args: {
              duel_id: parseInt(duelId),
            },
            gas: "30000000000000",
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
