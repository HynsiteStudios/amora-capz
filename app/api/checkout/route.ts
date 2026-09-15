import Stripe from "stripe";
import { getDb } from "@/db";
import { randomUUID } from "crypto";

type CheckoutItem = {
  id: number;
  quantity: number;
};

type Product = {
  id: number;
  name: string;
  price_pence: number;
  stock: number;
};

type ReservedRow = {
  product_id: number;
  reserved: number;
};

export async function POST(req: Request) {
  let reservationId: string | null = null;

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return Response.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const db = getDb();

    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (rawItems.length === 0) {
      return Response.json(
        { error: "Your basket is empty." },
        { status: 400 }
      );
    }

    const items: CheckoutItem[] = rawItems
      .map((item: unknown) => {
        const value = item as {
          id?: unknown;
          quantity?: unknown;
        };

        return {
          id: Number(value.id),
          quantity: Number(value.quantity),
        };
      })
      .filter(
        (item: CheckoutItem) =>
          Number.isInteger(item.id) &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      );

    if (items.length !== rawItems.length) {
      return Response.json(
        { error: "Invalid basket." },
        { status: 400 }
      );
    }

    const client = await db.pool.connect();

    let products: Product[] = [];
    reservationId = randomUUID();

    try {
      await client.query("BEGIN");

      const productIds = items.map(
        (item: CheckoutItem) => item.id
      );

      const productsResult = await client.query(
        `
          SELECT id, name, price_pence, stock
          FROM products
          WHERE id = ANY($1::int[])
          FOR UPDATE
        `,
        [productIds]
      );

      products = productsResult.rows as Product[];

      if (products.length !== items.length) {
        throw new Error(
          "One or more products could not be found."
        );
      }

      const reservedResult = await client.query(
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

      const reservedRows =
        reservedResult.rows as ReservedRow[];

      const reservedMap = new Map<number, number>();

      for (const row of reservedRows) {
        reservedMap.set(row.product_id, row.reserved);
      }

      for (const item of items) {
        const product = products.find(
          (p: Product) => p.id === item.id
        );

        if (!product) {
          throw new Error("Product not found.");
        }

        const reserved =
          reservedMap.get(product.id) ?? 0;

        const available =
          product.stock - reserved;

        if (item.quantity > available) {
          throw new Error(
            `${product.name} only has ${available} available.`
          );
        }
      }

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

      for (const item of items) {
        await client.query(
          `
            INSERT INTO reservation_items (
              reservation_id,
              product_id,
              quantity
            )
            VALUES ($1, $2, $3)
          `,
          [
            reservationId,
            item.id,
            item.quantity,
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      items.map((item: CheckoutItem) => {
        const product = products.find(
          (p: Product) => p.id === item.id
        );

        if (!product) {
          throw new Error("Product not found.");
        }

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

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,

        success_url:
          "https://amora-capz.netlify.app/?success=true",

        cancel_url:
          "https://amora-capz.netlify.app/?cancelled=true",

        expires_at:
          Math.floor(Date.now() / 1000) + 30 * 60,

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
    console.error("Checkout error:", error);

    if (reservationId) {
      try {
        const db = getDb();

        await db.sql`
          UPDATE reservations
          SET status = 'expired'
          WHERE id = ${reservationId}
            AND status = 'reserved'
        `;
      } catch (cleanupError) {
        console.error(
          "Reservation cleanup error:",
          cleanupError
        );
      }
    }

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