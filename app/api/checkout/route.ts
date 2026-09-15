import Stripe from "stripe";
import { db } from "@/db";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature.", {
      status: 400,
    });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);

    return new Response("Invalid signature.", {
      status: 400,
    });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        event.type === "checkout.session.completed" &&
        session.payment_status !== "paid" &&
        session.payment_status !== "no_payment_required"
      ) {
        return new Response("Payment not completed yet.", {
          status: 200,
        });
      }

      const reservationId = session.metadata?.reservation_id;

      if (!reservationId) {
        console.error("No reservation ID on Stripe session.");

        return new Response("Missing reservation ID.", {
          status: 400,
        });
      }

      const client = await db.pool.connect();

      try {
        await client.query("BEGIN");

        const reservationResult = await client.query<{
          id: string;
          status: string;
        }>(
          `
            SELECT id, status
            FROM reservations
            WHERE id = $1
            FOR UPDATE
          `,
          [reservationId]
        );

        const reservation = reservationResult.rows[0];

        if (!reservation) {
          throw new Error("Reservation not found.");
        }

        if (reservation.status === "completed") {
          await client.query("COMMIT");

          return new Response("Already processed.", {
            status: 200,
          });
        }

        if (reservation.status === "expired") {
          await client.query("COMMIT");

          return new Response("Reservation already expired.", {
            status: 200,
          });
        }

        const itemsResult = await client.query<{
          product_id: number;
          quantity: number;
        }>(
          `
            SELECT product_id, quantity
            FROM reservation_items
            WHERE reservation_id = $1
          `,
          [reservationId]
        );

        for (const item of itemsResult.rows) {
          const productResult = await client.query<{
            id: number;
            stock: number;
          }>(
            `
              SELECT id, stock
              FROM products
              WHERE id = $1
              FOR UPDATE
            `,
            [item.product_id]
          );

          const product = productResult.rows[0];

          if (!product) {
            throw new Error(
              `Product ${item.product_id} not found.`
            );
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for product ${item.product_id}.`
            );
          }

          await client.query(
            `
              UPDATE products
              SET stock = stock - $1
              WHERE id = $2
            `,
            [item.quantity, item.product_id]
          );
        }

        await client.query(
          `
            UPDATE reservations
            SET status = 'completed'
            WHERE id = $1
          `,
          [reservationId]
        );

        await client.query("COMMIT");

        console.log(
          `Reservation ${reservationId} completed successfully.`
        );
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;

      const reservationId = session.metadata?.reservation_id;

      if (reservationId) {
        await db.sql`
          UPDATE reservations
          SET status = 'expired'
          WHERE id = ${reservationId}
            AND status = 'reserved'
        `;

        console.log(
          `Reservation ${reservationId} expired.`
        );
      }
    }

    return new Response("Webhook received.", {
      status: 200,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return new Response("Webhook processing failed.", {
      status: 500,
    });
  }
}