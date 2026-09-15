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

    const { id, active } = await req.json();

    const productId = Number(id);

    if (!Number.isInteger(productId) || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Invalid product status." },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = await db.sql<{
      id: number;
      active: boolean;
    }>`
      UPDATE products
      SET active = ${active}
      WHERE id = ${productId}
      RETURNING id, active;
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: result[0].id,
      active: result[0].active,
    });
  } catch (error) {
    console.error("Product status update error:", error);

    return NextResponse.json(
      { error: "Unable to update product status." },
      { status: 500 }
    );
  }
}