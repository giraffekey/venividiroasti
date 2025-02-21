import { NextResponse } from "next/server";
import { providers, utils } from "near-api-js";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get("receiverId");
    const amount = searchParams.get("amount");
    const memo = searchParams.get("memo");

    if (!receiverId || !amount) {
      return NextResponse.json(
        { error: "receiverId and amount are required parameters" },
        { status: 400 },
      );
    }

    const url = `https://rpc.mainnet.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    const actions = [];

    const args = {
      account_id: receiverId,
    };

    const res = await provider.query({
      request_type: "call_function",
      account_id: "token.venividiroasti.near",
      method_name: "storage_balance_of",
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });
    const balance = JSON.parse(Buffer.from(res.result).toString());
    console.log(balance);

    if (balance === null) {
      const args = {};

      const res = await provider.query({
        request_type: "call_function",
        account_id: "token.venividiroasti.near",
        method_name: "storage_balance_bounds",
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
        finality: "optimistic",
      });
      const min = JSON.parse(Buffer.from(res.result).toString()).min;

      actions.push({
        type: "FunctionCall",
        params: {
          account_id: "token.venividiroasti.near",
          methodName: "storage_deposit",
          args: {
            account_id: receiverId,
            registration_only: true,
          },
          deposit: min,
          gas: "30000000000000",
        },
      });
    }

    actions.push({
      type: "FunctionCall",
      params: {
        account_id: "token.venividiroasti.near",
        methodName: "ft_transfer",
        args: {
          receiver_id: receiverId,
          amount,
          memo,
        },
        deposit: "1",
        gas: "30000000000000",
      },
    });

    const transactionPayload = {
      actions,
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
