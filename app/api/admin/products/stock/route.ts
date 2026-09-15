import { NextResponse } from "next/server";
import { getDb } from "@/db";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    if (!cookieHeader.includes("amora_admin=authenticated")) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id, change } = await req.json();

    const productId = Number(id);
    const stockChange = Number(change);

    if (
      !Number.isInteger(productId) ||
      !Number.isInteger(stockChange) ||
      ![-1, 1].includes(stockChange)
    ) {
      return NextResponse.json(
        { error: "Invalid stock change." },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = await db.sql<{
      id: number;
      name: string;
      price_pence: number;
      stock: number;
    }>`
      UPDATE products
      SET stock = stock + ${stockChange}
      WHERE id = ${productId}
        AND stock + ${stockChange} >= 0
      RETURNING id, name, price_pence, stock;
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Unable to update stock." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: result[0].id,
      name: result[0].name,
      price: result[0].price_pence,
      stock: result[0].stock,
    });
  } catch (error) {
    console.error("Stock update error:", error);

    return NextResponse.json(
      { error: "Unable to update stock." },
      { status: 500 }
    );
  }
}