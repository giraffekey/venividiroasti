import { NextResponse } from "next/server";

const styles = ["Witty", "Brutal", "Strategic", "Mocking"];

export async function GET() {
  try {
    return NextResponse.json({ styles });
  } catch (error) {
    console.error("Error getting figures:", error);
    return NextResponse.json(
      { error: "Failed to get figures" },
      { status: 500 },
    );
  }
}
