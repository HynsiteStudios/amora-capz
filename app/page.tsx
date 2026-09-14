"use client";

import { useState } from "react";

type Product = {
  id: number;
  name: string;
  image: string;
  tag: string;
  description: string;
};

type CartItem = Product & {
  quantity: number;
};

const products: Product[] = [
  {
    id: 1,
    name: "Amora Golf Cap",
    image: "/products/car-cap-1.jpg",
    tag: "Bestseller",
    description:
      "The Amora Golf Cap — a clean, distinctive design made for the course and everyday wear.",
  },
  {
    id: 2,
    name: "Amora Black Cap",
    image: "/products/car-cap-2.jpg",
    tag: "New",
    description:
      "The Amora Black Cap — an all-black everyday essential featuring the signature Amora logo.",
  },
  {
    id: 3,
    name: "Amora Grey Cap",
    image: "/products/car-cap-3.jpg",
    tag: "New",
    description:
      "The Amora Grey Cap — a versatile neutral design with the signature Amora finish.",
  },
  {
    id: 4,
    name: "Amora Navy Cap",
    image: "/products/car-cap-4.jpg",
    tag: "Limited",
    description:
      "The Amora Navy Cap — a darker statement piece designed for a clean, understated look.",
  },
];

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedQuantity(1);
  }

  function closeProduct() {
    setSelectedProduct(null);
  }

  function addToCart(product: Product, quantity = 1) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity,
        },
      ];
    });

    setSelectedProduct(null);
    setSelectedQuantity(1);
  }

  function updateQuantity(productId: number, change: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity + change,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
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
              aria-label="Search"
              className="hidden transition hover:opacity-60 sm:block"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </button>

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
        {/* Full Hero Background */}
        <img
          src="/products/car-cap-1.jpg"
          alt="Amora Golf Cap"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Dark overlays */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

        {/* Hero Content */}
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
                className="inline-flex items-center gap-3 border border-white/70 bg-black/10 px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black sm:px-7"
              >
                Our story
              </a>
            </div>

            {/* Hero Features */}
            <div className="mt-12 grid max-w-[580px] grid-cols-3 gap-3 border-t border-white/20 pt-7 sm:gap-5">
              <div className="flex gap-2.5 sm:gap-3">
                <svg
                  width="27"
                  height="27"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  className="hidden shrink-0 text-white sm:block"
                >
                  <rect x="3" y="9" width="19" height="12" />
                  <path d="M22 13h4l3 4v4h-7" />
                  <circle cx="9" cy="24" r="3" />
                  <circle cx="25" cy="24" r="3" />
                </svg>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] sm:text-[9px] sm:tracking-[0.15em]">
                    Fast shipping
                  </p>
                  <p className="mt-1 text-[7px] uppercase tracking-[0.08em] text-white/50 sm:text-[8px]">
                    On all orders
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 sm:gap-3">
                <svg
                  width="27"
                  height="27"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  className="hidden shrink-0 text-white sm:block"
                >
                  <path d="m16 3 5 6-5 20L11 9l5-6Z" />
                  <path d="m11 9-7 3 12 17L4 12m17-3 7 3-12 17 12-17" />
                </svg>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] sm:text-[9px] sm:tracking-[0.15em]">
                    Premium quality
                  </p>
                  <p className="mt-1 text-[7px] uppercase tracking-[0.08em] text-white/50 sm:text-[8px]">
                    Built to last
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 sm:gap-3">
                <svg
                  width="27"
                  height="27"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  className="hidden shrink-0 text-white sm:block"
                >
                  <circle cx="16" cy="16" r="12" />
                  <path d="M4 16h24M16 4c4 4 5 8 5 12s-1 8-5 12c-4-4-5-8-5-12s1-8 5-12Z" />
                </svg>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] sm:text-[9px] sm:tracking-[0.15em]">
                    Join the movement
                  </p>
                  <p className="mt-1 text-[7px] uppercase tracking-[0.08em] text-white/50 sm:text-[8px]">
                    @amoracapz
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Label */}
          <div className="absolute bottom-7 right-6 text-right sm:bottom-9 sm:right-12 lg:right-16">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-[11px]">
              Amora Capz
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.3em] text-white/60 sm:text-[9px]">
              Golf Collection
            </p>

            <div className="ml-auto mt-2 h-px w-5 bg-white/70" />
          </div>
        </div>
      </section>

      {/* Collection */}
      <section id="shop" className="border-b border-white/[0.08] bg-[#090909]">
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

            <a
              href="#shop"
              className="hidden items-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-white/70 transition hover:text-white sm:flex"
            >
              View all
              <span className="text-sm">→</span>
            </a>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <article key={product.id} className="group">
                <button
                  type="button"
                  onClick={() => openProduct(product)}
                  className="block w-full text-left"
                >
                  <div className="relative overflow-hidden bg-[#151515]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="aspect-[0.82] w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                    />

                    <div className="absolute left-2 top-2 bg-black px-2.5 py-1.5 sm:left-3 sm:top-3 sm:px-3">
                      <p className="text-[7px] font-medium uppercase tracking-[0.16em] sm:text-[8px] sm:tracking-[0.2em]">
                        {product.tag}
                      </p>
                    </div>

                    <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-black/60 text-lg font-light leading-none backdrop-blur transition group-hover:bg-white group-hover:text-black sm:bottom-4 sm:right-4 sm:h-9 sm:w-9 sm:text-xl">
                      +
                    </span>
                  </div>

                  <div className="mt-3 sm:mt-4">
                    <h3 className="text-[9px] font-semibold uppercase tracking-[0.13em] sm:text-[10px] sm:tracking-[0.17em]">
                      {product.name}
                    </h3>

                    <p className="mt-1.5 text-[10px] leading-4 text-white/55 sm:mt-2 sm:text-[11px]">
                      {product.description}
                    </p>

                    <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-white/35 sm:mt-3">
                      Price coming soon
                    </p>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section id="about" className="border-b border-white/[0.08] bg-[#090909]">
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

          {/* Four unique images only */}
          <div className="mt-8 grid grid-cols-2 gap-2 sm:mt-9 sm:grid-cols-4">
            {products.map((product) => (
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

                <p className="mt-7 text-xs uppercase tracking-[0.2em] text-white/40 sm:mt-8">
                  Price coming soon
                </p>

                {/* Quantity */}
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
                      className="flex h-11 w-11 items-center justify-center text-lg text-white/60 transition hover:text-white"
                    >
                      −
                    </button>

                    <span className="flex h-11 w-11 items-center justify-center border-x border-white/15 text-sm">
                      {selectedQuantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedQuantity((quantity) => quantity + 1)
                      }
                      className="flex h-11 w-11 items-center justify-center text-lg text-white/60 transition hover:text-white"
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
                  className="mt-7 flex w-full items-center justify-center gap-3 bg-white px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-white/85 sm:mt-8"
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
            {/* Bag Header */}
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

            {/* Bag Contents */}
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
                          Price coming soon
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-4">
                          <div className="flex items-center border border-white/15">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="flex h-8 w-8 items-center justify-center text-sm text-white/60 hover:text-white"
                            >
                              −
                            </button>

                            <span className="flex h-8 w-8 items-center justify-center border-x border-white/15 text-[10px]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="flex h-8 w-8 items-center justify-center text-sm text-white/60 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bag Footer */}
            {cart.length > 0 && (
              <div className="border-t border-white/10 px-6 py-5 sm:px-7 sm:py-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                    Total
                  </span>

                  <span className="text-sm font-medium">
                    Price coming soon
                  </span>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-5 w-full cursor-not-allowed bg-white/20 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35"
                >
                  Checkout unavailable
                </button>

                <p className="mt-4 text-center text-[9px] leading-5 text-white/30">
                  Online payments will be connected when the store is ready
                  to launch.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}