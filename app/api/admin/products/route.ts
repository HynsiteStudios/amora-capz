import { NextResponse } from "next/server";
import { getDb } from "@/db";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    if (!cookieHeader.includes("amora_admin=authenticated")) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const db = getDb();

    const products = await db.sql<{
      id: number;
      name: string;
      price_pence: number;
      stock: number;
      description: string;
      tag: string;
      image: string;
      active: boolean;
    }>`
      SELECT
        id,
        name,
        price_pence,
        stock,
        description,
        tag,
        image,
        active
      FROM products
      ORDER BY id;
    `;

    return NextResponse.json(
      products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price_pence,
        stock: product.stock,
        description: product.description,
        tag: product.tag,
        image: product.image,
        active: product.active,
      }))
    );
  } catch (error) {
    console.error("Admin products error:", error);

    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 500 }
    );
  }
}