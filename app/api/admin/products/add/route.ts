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

    const { name, price, stock, description, tag, image } =
      await req.json();

    const cleanName = String(name || "").trim();
    const cleanDescription = String(description || "").trim();
    const cleanTag = String(tag || "New").trim();
    const cleanImage = String(image || "").trim();

    const pricePence = Math.round(Number(price) * 100);
    const startingStock = Number(stock);

    if (!cleanName) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(pricePence) || pricePence < 0) {
      return NextResponse.json(
        { error: "Enter a valid price." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(startingStock) || startingStock < 0) {
      return NextResponse.json(
        { error: "Enter a valid stock amount." },
        { status: 400 }
      );
    }

    if (!cleanImage) {
      return NextResponse.json(
        { error: "Product image is required." },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = await db.sql<{
      id: number;
      name: string;
      price_pence: number;
      stock: number;
      description: string;
      tag: string;
      image: string;
    }>`
      INSERT INTO products (
        name,
        price_pence,
        stock,
        description,
        tag,
        image
      )
      VALUES (
        ${cleanName},
        ${pricePence},
        ${startingStock},
        ${cleanDescription},
        ${cleanTag},
        ${cleanImage}
      )
      RETURNING
        id,
        name,
        price_pence,
        stock,
        description,
        tag,
        image;
    `;

    return NextResponse.json({
      id: result[0].id,
      name: result[0].name,
      price: result[0].price_pence,
      stock: result[0].stock,
      description: result[0].description,
      tag: result[0].tag,
      image: result[0].image,
    });
  } catch (error) {
    console.error("Add product error:", error);

    return NextResponse.json(
      { error: "Unable to add product." },
      { status: 500 }
    );
  }
}