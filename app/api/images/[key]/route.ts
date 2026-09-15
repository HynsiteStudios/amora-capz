import { getStore } from "@netlify/blobs";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const store = getStore("product-images");

    const result = await store.getWithMetadata(key, {
      type: "arrayBuffer",
    });

    if (!result) {
      return new Response("Image not found.", {
        status: 404,
      });
    }

    const metadata = result.metadata as {
      contentType?: string;
    };

    return new Response(result.data, {
      status: 200,
      headers: {
        "Content-Type": metadata?.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image loading error:", error);

    return new Response("Unable to load image.", {
      status: 500,
    });
  }
}