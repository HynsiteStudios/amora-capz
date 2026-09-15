"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  image: string;
  tag: string;
  description: string;
  stock: number;
  price: number;
};

type CartItem = Product & {
  quantity: number;
};

export default function Home() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data: Product[] = await response.json();

        setLiveProducts(data);
      } catch (error) {
        console.error("Product loading error:", error);
      } finally {
        setStockLoading(false);
      }
    }

    loadProducts();
  }, []);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cart.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );

  function openProduct(product: Product) {
    if (product.stock <= 0) return;

    setSelectedProduct(product);
    setSelectedQuantity(1);
  }

  function closeProduct() {
    setSelectedProduct(null);
  }

  function addToCart(product: Product, quantity = 1) {
    if (product.stock <= 0) return;

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          product.stock
        );

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                price: product.price,
                stock: product.stock,
                quantity: newQuantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: Math.min(quantity, product.stock),
        },
      ];
    });

    setSelectedProduct(null);
    setSelectedQuantity(1);
    setCartOpen(true);
  }

  function updateQuantity(productId: number, change: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== productId) return item;

          const newQuantity = item.quantity + change;

          if (newQuantity <= 0) {
            return null;
          }

          return {
            ...item,
            quantity: Math.min(newQuantity, item.stock),
          };
        })
        .filter((item): item is CartItem => item !== null)
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  async function handleCheckout() {
    if (cart.length === 0 || checkoutLoading) return;

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);

      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Something went wrong starting checkout."
      );

      setCheckoutLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Announcement Bar */}
      <div className="border-b border-white/[0.08] bg-[#0b0b0b] px-4 py-2.5 text-center">
        <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-white/65 sm:text-[10px]">
          Free shipping on all orders
          <span className="mx-3 text-white/25">|</span>
          Amora Capz
          <span className="mx-3 text-white/25">|</span>
          Built for everyday
        </p>
      </div>

      {/* Navigation */}
      <header className="border-b border-white/[0.08] bg-[#090909]">
        <div className="mx-auto flex h-[78px] max-w-[1400px] items-center justify-between px-6 lg:px-12">
          <a href="#" className="shrink-0">
            <img
              src="/logo.png"
              alt="Amora Capz"
              className="h-[52px] w-auto object-contain"
            />
          </a>

          <nav className="hidden items-center gap-10 md:flex">
            <a
              href="#"
              className="text-[11px] font-medium uppercase tracking-[0.25em] text-white transition hover:text-white/55"
            >
              Home
            </a>

            <a
              href="#shop"
              className="text-[11px] font-medium uppercase tracking-[0.25em] text-white transition hover:text-white/55"
            >
              Shop
            </a>

            <a
              href="#about"
              className="text-[11px] font-medium uppercase tracking-[0.25em] text-white transition hover:text-white/55"
            >
              About
            </a>

            <a
              href="#contact"
              className="text-[11px] font-medium uppercase tracking-[0.25em] text-white transition hover:text-white/55"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-5">
            <button
              type="button"
              aria-label="Shopping bag"
              onClick={() => setCartOpen(true)}
              className="relative transition hover:opacity-60"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 8h12l1 13H5L6 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>

              <span className="absolute -right-3 -top-3 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-black">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[720px] overflow-hidden border-b border-white/[0.08] sm:min-h-[760px] lg:min-h-[700px]">
        <img
          src="/products/car-cap-1.jpg"
          alt="Amora Golf Cap"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

        <div className="relative z-10 mx-auto flex min-h-[720px] max-w-[1400px] items-center px-6 py-16 sm:min-h-[760px] sm:px-12 lg:min-h-[700px] lg:px-16">
          <div className="max-w-[620px]">
            <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.38em] text-white/65">
              More than just a cap
            </p>

            <h1 className="text-[52px] font-semibold uppercase leading-[0.88] tracking-[-0.045em] sm:text-[72px] lg:text-[86px]">
              Wear the
              <br />
              <span className="text-white/55">difference.</span>
            </h1>

            <p className="mt-7 max-w-[420px] text-[15px] leading-6 text-white/75 sm:text-[16px]">
              Premium caps designed for everyday.
              <br />
              Simple. Clean. Distinctive.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <a
                href="#shop"
                className="inline-flex items-center gap-3 bg-white px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/85 sm:px-7"
              >
                Shop now
                <span className="text-base leading-none">→</span>
              </a>

              <a
                href="#about"
                className="inline-flex items-center gap-3 border border-white/70 bg-black/10 px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition hover:bg-white hover:text-black sm:px-7"
              >
                Our story
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 right-6 text-right sm:bottom-9 sm:right-12 lg:right-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-[11px]">
            Amora Capz
          </p>

          <p className="mt-1 text-[8px] uppercase tracking-[0.3em] text-white/60 sm:text-[9px]">
            Golf Collection
          </p>

          <div className="ml-auto mt-2 h-px w-5 bg-white/70" />
        </div>
      </section>

      {/* Collection */}
      <section
        id="shop"
        className="border-b border-white/[0.08] bg-[#090909]"
      >
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-12 sm:py-20 lg:px-14 lg:py-24">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.38em] text-white/50">
                Featured
              </p>

              <h2 className="mt-3 text-[25px] font-semibold uppercase tracking-[0.1em] sm:text-[34px] sm:tracking-[0.12em]">
                The Collection
              </h2>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
            {liveProducts.map((product) => {
              const soldOut = !stockLoading && product.stock <= 0;

              return (
                <article key={product.id} className="group">
                  <button
                    type="button"
                    onClick={() => openProduct(product)}
                    disabled={soldOut}
                    className="block w-full text-left disabled:cursor-not-allowed"
                  >
                    <div className="relative overflow-hidden bg-[#151515]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`aspect-[0.82] w-full object-cover transition duration-700 group-hover:scale-[1.025] ${
                          soldOut ? "opacity-45" : ""
                        }`}
                      />

                      <div className="absolute left-2 top-2 bg-black px-2.5 py-1.5 sm:left-3 sm:top-3 sm:px-3">
                        <p className="text-[7px] font-medium uppercase tracking-[0.16em] sm:text-[8px] sm:tracking-[0.2em]">
                          {product.tag}
                        </p>
                      </div>

                      {!stockLoading && (
                        <div className="absolute bottom-3 left-3 bg-black/80 px-2.5 py-1.5 backdrop-blur sm:bottom-4 sm:left-4">
                          <p className="text-[7px] font-medium uppercase tracking-[0.15em] text-white/80 sm:text-[8px]">
                            {soldOut
                              ? "Sold out"
                              : product.stock <= 3
                                ? `${product.stock} left`
                                : "In stock"}
                          </p>
                        </div>
                      )}

                      {!soldOut && (
                        <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-black/60 text-lg font-light leading-none backdrop-blur transition group-hover:bg-white group-hover:text-black sm:bottom-4 sm:right-4 sm:h-9 sm:w-9 sm:text-xl">
                          +
                        </span>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4">
                      <h3 className="text-[9px] font-semibold uppercase tracking-[0.13em] sm:text-[10px] sm:tracking-[0.17em]">
                        {product.name}
                      </h3>

                      <p className="mt-1.5 text-[10px] leading-4 text-white/55 sm:mt-2 sm:text-[11px]">
                        {product.description}
                      </p>

                      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white sm:mt-3">
                        £{(product.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section
        id="about"
        className="border-b border-white/[0.08] bg-[#090909]"
      >
        <div className="mx-auto grid max-w-[1400px] lg:grid-cols-2">
          <div className="relative min-h-[340px] overflow-hidden sm:min-h-[390px] lg:min-h-[460px]">
            <img
              src="/products/car-cap-4.jpg"
              alt="Amora cap"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#090909]" />
          </div>

          <div className="flex items-center px-6 py-16 sm:px-12 sm:py-20 lg:px-20">
            <div className="max-w-[500px]">
              <p className="text-[9px] uppercase tracking-[0.38em] text-white/50">
                Our story
              </p>

              <h2 className="mt-4 text-[28px] font-semibold uppercase leading-[1.08] tracking-[0.05em] sm:text-[37px] sm:tracking-[0.06em]">
                A different
                <br />
                kind of cap brand.
              </h2>

              <p className="mt-6 max-w-[470px] text-[14px] leading-6 text-white/60 sm:text-[15px]">
                Amora Capz is built around a simple idea — premium caps for
                everyday. Designed to stand out, made to be worn.
              </p>

              <a
                href="https://www.instagram.com/amoracapz/"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-3 border border-white/60 px-7 py-3.5 text-[9px] font-semibold uppercase tracking-[0.25em] transition hover:bg-white hover:text-black"
              >
                Learn more
                <span className="text-sm">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="border-b border-white/[0.08] bg-[#090909]">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-12 sm:py-16 lg:px-14">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.38em] text-white/50">
                Follow us
              </p>

              <h2 className="mt-3 text-[23px] font-semibold uppercase tracking-[0.1em] sm:text-[28px] sm:tracking-[0.13em]">
                @amoracapz
              </h2>
            </div>

            <a
              href="https://www.instagram.com/amoracapz/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-white/70 transition hover:text-white sm:flex"
            >
              View on Instagram
              <span className="text-sm">→</span>
            </a>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 sm:mt-9 sm:grid-cols-4">
            {liveProducts.map((product) => (
              <a
                key={product.id}
                href="https://www.instagram.com/amoracapz/"
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden"
              >
                <img
                  src={product.image}
                  alt={`${product.name} - Amora Capz`}
                  className="aspect-square w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#090909]">
        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-12 lg:px-14">
          <div className="flex flex-col items-center justify-between gap-7 md:flex-row">
            <img
              src="/logo.png"
              alt="Amora Capz"
              className="h-[50px] w-auto object-contain sm:h-[55px]"
            />

            <nav className="flex items-center gap-6 sm:gap-8">
              <a
                href="#"
                className="text-[9px] uppercase tracking-[0.2em] text-white/75 transition hover:text-white"
              >
                Home
              </a>

              <a
                href="#shop"
                className="text-[9px] uppercase tracking-[0.2em] text-white/75 transition hover:text-white"
              >
                Shop
              </a>

              <a
                href="#about"
                className="text-[9px] uppercase tracking-[0.2em] text-white/75 transition hover:text-white"
              >
                About
              </a>

              <a
                href="#contact"
                className="text-[9px] uppercase tracking-[0.2em] text-white/75 transition hover:text-white"
              >
                Contact
              </a>
            </nav>

            <a
              href="https://www.instagram.com/amoracapz/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="transition hover:opacity-60"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
              </svg>
            </a>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.08] pt-6 text-[9px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Amora Capz. All rights reserved.</p>

            <p>Built by Hynsite Studios</p>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[110]">
          <button
            type="button"
            aria-label="Close product"
            onClick={closeProduct}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <div className="absolute left-1/2 top-1/2 w-[calc(100%-24px)] max-w-[950px] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-[#101010] shadow-2xl sm:w-[calc(100%-32px)]">
            <button
              type="button"
              onClick={closeProduct}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-lg text-white backdrop-blur transition hover:bg-white hover:text-black sm:right-5 sm:top-5"
            >
              ×
            </button>

            <div className="grid max-h-[90vh] overflow-y-auto md:grid-cols-2">
              <div className="bg-[#151515]">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="h-auto max-h-[500px] w-full object-cover md:h-full md:max-h-[650px]"
                />
              </div>

              <div className="flex flex-col justify-center p-6 sm:p-10">
                <p className="text-[9px] uppercase tracking-[0.35em] text-white/45">
                  {selectedProduct.tag}
                </p>

                <h2 className="mt-4 text-2xl font-semibold uppercase leading-tight tracking-[0.05em] sm:text-3xl">
                  {selectedProduct.name}
                </h2>

                <div className="mt-5 h-px w-full bg-white/10 sm:mt-6" />

                <p className="mt-5 text-sm leading-7 text-white/55 sm:mt-6">
                  {selectedProduct.description}
                </p>

                <p className="mt-7 text-lg font-medium sm:mt-8">
                  £{(selectedProduct.price / 100).toFixed(2)}
                </p>

                <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/45">
                  {selectedProduct.stock} available
                </p>

                <div className="mt-7 sm:mt-8">
                  <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.25em] text-white/50">
                    Quantity
                  </p>

                  <div className="flex w-fit items-center border border-white/15">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedQuantity((quantity) =>
                          Math.max(1, quantity - 1)
                        )
                      }
                      disabled={selectedQuantity <= 1}
                      className="flex h-11 w-11 items-center justify-center text-lg text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      −
                    </button>

                    <span className="flex h-11 w-11 items-center justify-center border-x border-white/15 text-sm">
                      {selectedQuantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedQuantity((quantity) =>
                          Math.min(selectedProduct.stock, quantity + 1)
                        )
                      }
                      disabled={selectedQuantity >= selectedProduct.stock}
                      className="flex h-11 w-11 items-center justify-center text-lg text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    addToCart(selectedProduct, selectedQuantity)
                  }
                  disabled={selectedProduct.stock <= 0}
                  className="mt-7 flex w-full items-center justify-center gap-3 bg-white px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/30 sm:mt-8"
                >
                  Add to bag
                  <span className="text-base">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Bag */}
      {cartOpen && (
        <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            aria-label="Close shopping bag"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-white/10 bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-7 sm:py-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/45">
                  Your
                </p>

                <h2 className="mt-1 text-lg font-semibold uppercase tracking-[0.1em] sm:text-xl">
                  Shopping Bag
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 sm:py-6">
              {cart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <svg
                      width="35"
                      height="35"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      className="mx-auto text-white/40"
                    >
                      <path d="M6 8h12l1 13H5L6 8Z" />
                      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                    </svg>

                    <p className="mt-5 text-sm uppercase tracking-[0.15em]">
                      Your bag is empty
                    </p>

                    <p className="mt-3 text-xs leading-5 text-white/40">
                      Add a cap from the collection to get started.
                    </p>

                    <button
                      type="button"
                      onClick={() => setCartOpen(false)}
                      className="mt-7 border border-white/30 px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] transition hover:bg-white hover:text-black"
                    >
                      Continue shopping
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 border-b border-white/10 pb-6"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-28 w-24 object-cover"
                      />

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-3">
                          <h3 className="text-[10px] font-semibold uppercase leading-5 tracking-[0.15em]">
                            {item.name}
                          </h3>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-white/35 transition hover:text-white"
                          >
                            ×
                          </button>
                        </div>

                        <p className="mt-1 text-[10px] text-white/40">
                          £{(item.price / 100).toFixed(2)} each
                        </p>

                        <div className="mt-1 text-[9px] uppercase tracking-[0.15em] text-white/35">
                          {item.stock} available
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-4">
                          <div className="flex items-center border border-white/15">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="flex h-8 w-8 items-center justify-center text-sm text-white/60 hover:text-white disabled:opacity-30"
                            >
                              −
                            </button>

                            <span className="flex h-8 w-8 items-center justify-center border-x border-white/15 text-[10px]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                              className="flex h-8 w-8 items-center justify-center text-sm text-white/60 hover:text-white disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-sm font-medium">
                            £
                            {(
                              (item.quantity * item.price) /
                              100
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-white/10 px-6 py-5 sm:px-7 sm:py-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                    Total
                  </span>

                  <span className="text-lg font-medium">
                    £{(cartTotal / 100).toFixed(2)}
                  </span>
                </div>

                {checkoutError && (
                  <p className="mt-4 text-center text-[10px] leading-5 text-red-400">
                    {checkoutError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="mt-5 flex w-full items-center justify-center gap-3 bg-white px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-white/85 disabled:cursor-wait disabled:opacity-50"
                >
                  {checkoutLoading ? "Opening checkout..." : "Checkout"}
                  {!checkoutLoading && <span className="text-base">→</span>}
                </button>

                <p className="mt-4 text-center text-[9px] leading-5 text-white/30">
                  Secure checkout powered by Stripe.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}