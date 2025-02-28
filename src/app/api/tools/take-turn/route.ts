import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const duelId = searchParams.get("duelId");
    const style = searchParams.get("style");

    if (!duelId || !style) {
      return NextResponse.json(
        { error: "duelId and style are required parameters" },
        { status: 400 },
      );
    }

    const transactionPayload = {
      actions: [
        {
          type: "FunctionCall",
          params: {
            account_id: "duels.venividiroasti.near",
            methodName: "take_turn",
            args: {
              duel_id: duelId,
              style,
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
