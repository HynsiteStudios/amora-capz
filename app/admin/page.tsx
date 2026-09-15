"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  tag: string;
  image: string;
  active: boolean;
};

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatingPriceId, setUpdatingPriceId] = useState<number | null>(null);
  const [updatingActiveId, setUpdatingActiveId] = useState<number | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTag, setNewTag] = useState("New");
  const [newImage, setNewImage] = useState("");

  async function loadProducts() {
    try {
      setError("");

      const response = await fetch("/api/admin/products", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load products.");
      }

      const data: Product[] = await response.json();

      setProducts(data);

      const newPriceInputs: Record<number, string> = {};

      data.forEach((product) => {
        newPriceInputs[product.id] = (product.price / 100).toFixed(2);
      });

      setPriceInputs(newPriceInputs);
    } catch {
      setError("Unable to load products.");
    }
  }

  useEffect(() => {
    setLoading(false);
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Incorrect password.");
        return;
      }

      setLoggedIn(true);
      setPassword("");

      await loadProducts();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function changeStock(productId: number, change: number) {
    setError("");
    setMessage("");
    setUpdatingId(productId);

    try {
      const response = await fetch("/api/admin/products/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: productId,
          change,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update stock.");
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === productId
            ? {
                ...product,
                stock: data.stock,
              }
            : product
        )
      );
    } catch {
      setError("Unable to update stock.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function savePrice(productId: number) {
    const price = Number(priceInputs[productId]);

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }

    setError("");
    setMessage("");
    setUpdatingPriceId(productId);

    try {
      const response = await fetch("/api/admin/products/price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: productId,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update price.");
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === productId
            ? {
                ...product,
                price: data.price,
              }
            : product
        )
      );

      setPriceInputs((current) => ({
        ...current,
        [productId]: (data.price / 100).toFixed(2),
      }));

      setMessage(`${data.name} price updated.`);
    } catch {
      setError("Unable to update price.");
    } finally {
      setUpdatingPriceId(null);
    }
  }

  async function toggleProductActive(product: Product) {
    setError("");
    setMessage("");
    setUpdatingActiveId(product.id);

    try {
      const response = await fetch("/api/admin/products/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: product.id,
          active: !product.active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update product.");
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === product.id
            ? {
                ...currentProduct,
                active: data.active,
              }
            : currentProduct
        )
      );

      setMessage(
        data.active
          ? `${product.name} is now visible.`
          : `${product.name} has been hidden.`
      );
    } catch {
      setError("Unable to update product.");
    } finally {
      setUpdatingActiveId(null);
    }
  }

  async function uploadImage(file: File) {
    setError("");
    setMessage("");
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to upload image.");
        return;
      }

      const imageUrl = `/api/images/${encodeURIComponent(data.key)}`;

      setNewImage(imageUrl);
      setMessage("Image uploaded successfully.");
    } catch {
      setError("Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newImage) {
      setError("Please upload a product image.");
      return;
    }

    setError("");
    setMessage("");
    setAddingProduct(true);

    try {
      const response = await fetch("/api/admin/products/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          price: Number(newPrice),
          stock: Number(newStock),
          description: newDescription,
          tag: newTag,
          image: newImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to add product.");
        return;
      }

      setNewName("");
      setNewPrice("");
      setNewStock("");
      setNewDescription("");
      setNewTag("New");
      setNewImage("");

      setMessage(`${data.name} added successfully.`);

      await loadProducts();
    } catch {
      setError("Unable to add product.");
    } finally {
      setAddingProduct(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <p className="text-sm text-white/40">Loading...</p>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[#080808] px-6 py-12 text-white">
        <div className="mx-auto max-w-md">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/40">
            Amora Capz
          </p>

          <h1 className="text-3xl font-semibold">Admin Login</h1>

          <p className="mt-3 text-sm text-white/50">
            Sign in to manage products and stock.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30"
              required
            />

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
            >
              {loggingIn ? "Signing in..." : "Sign in"}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/40">
              Amora Capz
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Manage your products, prices and inventory.
            </p>
          </div>

          <button
            onClick={() => setLoggedIn(false)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
          >
            Log out
          </button>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {message && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm text-white/70">{message}</p>
          </div>
        )}

        {/* ADD PRODUCT */}
        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              New product
            </p>

            <h2 className="mt-2 text-xl font-semibold">Add Product</h2>

            <p className="mt-2 text-sm text-white/50">
              Add a new cap to the Amora collection.
            </p>
          </div>

          <form onSubmit={addProduct} className="mt-7 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  Product name
                </label>

                <input
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="e.g. Amora Red Cap"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  Tag
                </label>

                <input
                  type="text"
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                  placeholder="New"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  Price
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    £
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                    placeholder="25.00"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-8 pr-4 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  Starting stock
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newStock}
                  onChange={(event) => setNewStock(event.target.value)}
                  placeholder="10"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                Description
              </label>

              <textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Describe the cap..."
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
              />
            </div>

            {/* IMAGE UPLOAD */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                Product image
              </label>

              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-5 py-8 transition hover:border-white/40 hover:bg-white/[0.05]">
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {uploadingImage
                      ? "Uploading image..."
                      : newImage
                        ? "Choose a different image"
                        : "Choose Image"}
                  </p>

                  <p className="mt-2 text-xs text-white/35">
                    JPG, PNG or WEBP — maximum 5MB
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingImage}
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      uploadImage(file);
                    }

                    event.target.value = "";
                  }}
                  className="hidden"
                />
              </label>

              {newImage && (
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-white/40">
                    Preview
                  </p>

                  <img
                    src={newImage}
                    alt="New product preview"
                    className="h-52 w-52 rounded-xl object-cover"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={addingProduct || uploadingImage || !newImage}
              className="rounded-xl bg-white px-6 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingProduct ? "Adding product..." : "Add Product"}
            </button>
          </form>
        </section>

        {/* EXISTING PRODUCTS */}
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Products</h2>

            <button
              onClick={loadProducts}
              className="text-sm text-white/50 hover:text-white"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {products.map((product) => {
              const updatingStock = updatingId === product.id;
              const updatingPrice = updatingPriceId === product.id;
              const updatingActive = updatingActiveId === product.id;

              return (
                <div
                  key={product.id}
                  className={`rounded-2xl border bg-white/[0.03] p-5 ${
                    product.active
                      ? "border-white/10"
                      : "border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      )}

                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium">{product.name}</h3>

                          {!product.active && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">
                              Hidden
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-white/40">
                          Current price: £
                          {(product.price / 100).toFixed(2)}
                        </p>

                        {product.tag && (
                          <p className="mt-1 text-xs text-white/30">
                            {product.tag}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => changeStock(product.id, -1)}
                        disabled={updatingStock || product.stock <= 0}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        −
                      </button>

                      <div className="min-w-20 text-center">
                        <p className="text-2xl font-semibold">
                          {updatingStock ? "..." : product.stock}
                        </p>

                        <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                          {product.stock === 1 ? "cap left" : "caps left"}
                        </p>
                      </div>

                      <button
                        onClick={() => changeStock(product.id, 1)}
                        disabled={updatingStock}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-5">
                    <p className="mb-2 text-xs uppercase tracking-wider text-white/40">
                      Price
                    </p>

                    <div className="flex max-w-sm gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                          £
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceInputs[product.id] ?? ""}
                          onChange={(event) =>
                            setPriceInputs((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-8 pr-4 text-white outline-none focus:border-white/30"
                        />
                      </div>

                      <button
                        onClick={() => savePrice(product.id)}
                        disabled={updatingPrice}
                        className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
                      >
                        {updatingPrice ? "Saving..." : "Save price"}
                      </button>
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={() => toggleProductActive(product)}
                        disabled={updatingActive}
                        className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                      >
                        {updatingActive
                          ? "Updating..."
                          : product.active
                            ? "Hide product"
                            : "Show product"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}