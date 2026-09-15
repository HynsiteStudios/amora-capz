import { getDb } from "@/db";

export async function GET() {
  try {
    const db = getDb();

    const products = await db.sql<{
      id: number;
      name: string;
      price_pence: number;
      stock: number;
      reserved: number;
      available: number;
    }>`
      SELECT
        p.id,
        p.name,
        p.price_pence,
        p.stock,
        COALESCE(SUM(
          CASE
            WHEN r.status = 'reserved'
              AND r.expires_at > NOW()
            THEN ri.quantity
            ELSE 0
          END
        ), 0)::int AS reserved,
        (
          p.stock - COALESCE(SUM(
            CASE
              WHEN r.status = 'reserved'
                AND r.expires_at > NOW()
              THEN ri.quantity
              ELSE 0
            END
          ), 0)
        )::int AS available
      FROM products p
      LEFT JOIN reservation_items ri
        ON ri.product_id = p.id
      LEFT JOIN reservations r
        ON r.id = ri.reservation_id
      GROUP BY p.id
      ORDER BY p.id;
    `;

    return Response.json(
      products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price_pence,
        stock: product.available,
      }))
    );
  } catch (error) {
    console.error("Products error:", error);

    return Response.json(
      { error: "Unable to load products." },
      { status: 500 }
    );
  }
}