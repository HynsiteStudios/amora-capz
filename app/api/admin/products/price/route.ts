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

    const { id, price } = await req.json();

    const productId = Number(id);
    const pricePence = Math.round(Number(price) * 100);

    if (
      !Number.isInteger(productId) ||
      !Number.isFinite(pricePence) ||
      pricePence < 0
    ) {
      return NextResponse.json(
        { error: "Invalid price." },
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
      SET price_pence = ${pricePence}
      WHERE id = ${productId}
      RETURNING id, name, price_pence, stock;
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: result[0].id,
      name: result[0].name,
      price: result[0].price_pence,
      stock: result[0].stock,
    });
  } catch (error) {
    console.error("Price update error:", error);

    return NextResponse.json(
      { error: "Unable to update price." },
      { status: 500 }
    );
  }
}