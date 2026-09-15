import Stripe from "stripe";
import { db } from "@/db";
import { randomUUID } from "crypto";

type CheckoutItem = {
  id: number;
  quantity: number;
};

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return Response.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = await req.json();

    const items: CheckoutItem[] = Array.isArray(body.items)
      ? body.items
      : [];

    if (items.length === 0) {
      return Response.json(
        { error: "Your basket is empty." },
        { status: 400 }
      );
    }

    // Clean and validate the basket
    const cleanItems = items
      .map((item) => ({
        id: Number(item.id),
        quantity: Number(item.quantity),
      }))
      .filter(
        (item) =>
          Number.isInteger(item.id) &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      );

    if (cleanItems.length !== items.length) {
      return Response.json(
        { error: "Invalid basket." },
        { status: 400 }
      );
    }

    const client = await db.pool.connect();

    const reservationId = randomUUID();

    try {
      await client.query("BEGIN");

      const productIds = cleanItems.map((item) => item.id);

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
          FOR UPDATE
        `,
        [productIds]
      );

      const products = productsResult.rows;

      if (products.length !== cleanItems.length) {
        throw new Error("One or more products could not be found.");
      }

      // Check currently reserved stock
      const reservedResult = await client.query<{
        product_id: number;
        reserved: number;
      }>(
        `
          SELECT
            ri.product_id,
            COALESCE(SUM(ri.quantity), 0)::int AS reserved
          FROM reservation_items ri
          INNER JOIN reservations r
            ON r.id = ri.reservation_id
          WHERE ri.product_id = ANY($1::int[])
            AND r.status = 'reserved'
            AND r.expires_at > NOW()
          GROUP BY ri.product_id
        `,
        [productIds]
      );

      const reservedMap = new Map(
        reservedResult.rows.map((row) => [
          row.product_id,
          row.reserved,
        ])
      );

      for (const item of cleanItems) {
        const product = products.find((p) => p.id === item.id);

        if (!product) {
          throw new Error("Product not found.");
        }

        const reserved = reservedMap.get(product.id) ?? 0;
        const available = product.stock - reserved;

        if (item.quantity > available) {
          throw new Error(
            `${product.name} only has ${available} available.`
          );
        }
      }

      // Reserve the products for 30 minutes
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
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    try {
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
        cleanItems.map((item) => {
          const product = products.find((p) => p.id === item.id)!;

          return {
            quantity: item.quantity,
            price_data: {
              currency: "gbp",
              unit_amount: product.price_pence,
              product_data: {
                name: product.name,
              },
            },
          };
        });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,

        success_url:
          "https://amora-capz.netlify.app/?success=true",
        cancel_url:
          "https://amora-capz.netlify.app/?cancelled=true",

        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,

        metadata: {
          reservation_id: reservationId,
        },
      });

      await db.sql`
        UPDATE reservations
        SET stripe_session_id = ${session.id}
        WHERE id = ${reservationId}
      `;

      return Response.json({
        url: session.url,
      });
    } catch (error) {
      console.error("Stripe checkout error:", error);

      await db.sql`
        UPDATE reservations
        SET status = 'expired'
        WHERE id = ${reservationId}
          AND status = 'reserved'
      `;

      return Response.json(
        { error: "Unable to create checkout session." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Checkout error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to process checkout.";

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}