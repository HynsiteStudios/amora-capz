import Stripe from "stripe";
import { db } from "@/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CartItem = {
  id: number;
  quantity: number;
};

export async function POST(req: Request) {
  let reservationId: string | null = null;
  let client;

  try {
    const { items } = (await req.json()) as { items: CartItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: "Your basket is empty." },
        { status: 400 }
      );
    }

    const cleanItems = items.map((item) => ({
      id: Number(item.id),
      quantity: Number(item.quantity),
    }));

    if (
      cleanItems.some(
        (item) =>
          !Number.isInteger(item.id) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      return Response.json(
        { error: "Invalid basket." },
        { status: 400 }
      );
    }

    client = await db.pool.connect();

    await client.query("BEGIN");

    // Expire old reservations.
    await client.query(`
      UPDATE reservations
      SET status = 'expired'
      WHERE status = 'reserved'
        AND expires_at <= NOW()
    `);

    const productIds = cleanItems.map((item) => item.id);

    // Lock the products while checking stock.
    const productsResult = await client.query<{
      id: number;
      name: string;
      price_pence: number;
      stock: number;
    }>(
      `
        SELECT id, name, price_pence, stock
        FROM products
        WHERE id = ANY($1::int[])
        ORDER BY id
        FOR UPDATE
      `,
      [productIds]
    );

    const products = productsResult.rows;

    if (products.length !== cleanItems.length) {
      throw new Error("One or more products could not be found.");
    }

    for (const item of cleanItems) {
      const product = products.find((p) => p.id === item.id);

      if (!product) {
        throw new Error("One or more products could not be found.");
      }

      const reservedResult = await client.query<{ reserved: number }>(
        `
          SELECT COALESCE(SUM(ri.quantity), 0)::int AS reserved
          FROM reservation_items ri
          INNER JOIN reservations r
            ON r.id = ri.reservation_id
          WHERE ri.product_id = $1
            AND r.status = 'reserved'
            AND r.expires_at > NOW()
        `,
        [item.id]
      );

      const reserved = reservedResult.rows[0]?.reserved ?? 0;
      const available = product.stock - reserved;

      if (item.quantity > available) {
        throw new Error(
          `${product.name} only has ${available} left.`
        );
      }
    }

    reservationId = crypto.randomUUID();

    await client.query(
      `
        INSERT INTO reservations (
          id,
          status,
          expires_at
        )
        VALUES (
          $1,
          'reserved',
          NOW() + INTERVAL '30 minutes'
        )
      `,
      [reservationId]
    );

    for (const item of cleanItems) {
      await client.query(
        `
          INSERT INTO reservation_items (
            reservation_id,
            product_id,
            quantity
          )
          VALUES ($1, $2, $3)
        `,
        [reservationId, item.id, item.quantity]
      );
    }

    await client.query("COMMIT");

    const origin =
      req.headers.get("origin") || "http://localhost:8888";

    const lineItems = cleanItems.map((item) => {
      const product = products.find((p) => p.id === item.id)!;

      return {
        price_data: {
          currency: "gbp",
          product_data: {
            name: product.name,
          },
          unit_amount: product.price_pence,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: {
        reservation_id: reservationId,
      },
      success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?cancelled=true`,
    });

    await db.sql`
      UPDATE reservations
      SET stripe_session_id = ${session.id}
      WHERE id = ${reservationId}
    `;

    return Response.json({ url: session.url });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {}
    }

    console.error("Stripe checkout error:", error);

    if (reservationId) {
      try {
        await db.sql`
          UPDATE reservations
          SET status = 'expired'
          WHERE id = ${reservationId}
            AND status = 'reserved'
        `;
      } catch (cleanupError) {
        console.error("Reservation cleanup error:", cleanupError);
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create checkout session.";

    return Response.json(
      { error: message },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}