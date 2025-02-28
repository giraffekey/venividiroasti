import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get("amount");

    if (!amount) {
      return NextResponse.json(
        { error: "amount is a required parameter" },
        { status: 400 },
      );
    }

    const transactionPayload = {
      actions: [
        {
          type: "FunctionCall",
          params: {
            account_id: "token.venividiroasti.near",
            methodName: "ft_burn",
            args: {
              amount,
            },
            deposit: "1",
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
