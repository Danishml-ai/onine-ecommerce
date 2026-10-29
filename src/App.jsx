import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const PRODUCTS = [
  { id: 1, name: "Wireless Headphones", category: "Electronics", price: 4500, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80" },
  { id: 2, name: "Smart Watch", category: "Electronics", price: 6500, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80" },
  { id: 3, name: "Running Shoes", category: "Fashion", price: 5500, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80" },
  { id: 4, name: "Backpack", category: "Fashion", price: 3000, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80" },
  { id: 5, name: "Bluetooth Speaker", category: "Electronics", price: 3800, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700&auto=format&fit=crop&q=80" },
  { id: 6, name: "Sunglasses", category: "Fashion", price: 1800, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&auto=format&fit=crop&q=80" },
  { id: 7, name: "Desk Lamp", category: "Home", price: 2200, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&auto=format&fit=crop&q=80" },
  { id: 8, name: "Coffee Mug", category: "Home", price: 900, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700&auto=format&fit=crop&q=80" },
];

const KEYS = {
  users: "all-in-store-users",
  session: "all-in-store-session",
  oldCart: "all-in-store-cart",
  oldPurchases: "all-in-store-purchases",
};

const money = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function userKey(prefix, email) {
  return `${prefix}:${email.toLowerCase()}`;
}

function App() {
  const [users, setUsers] = useState(() => readJSON(KEYS.users, []));
  const [currentUser, setCurrentUser] = useState(() => {
    const email = readJSON(KEYS.session, null);
    if (!email) return null;
    return readJSON(KEYS.users, []).find((user) => user.email === email) || null;
  });
  const [page, setPage] = useState(() => {
    const email = readJSON(KEYS.session, null);
    return email ? "shop" : "shop";
  });
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [notice, setNotice] = useState("");
  const skipNextCartSave = useRef(false);
  const skipNextPurchasesSave = useRef(false);

  const email = currentUser?.email?.toLowerCase() || "";

  useEffect(() => {
    localStorage.setItem(KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (!email) {
      setCart([]);
      setPurchases([]);
      return;
    }
    skipNextCartSave.current = true;
    skipNextPurchasesSave.current = true;
    setCart(readJSON(userKey("all-in-store-cart", email), []));
    setPurchases(readJSON(userKey("all-in-store-purchases", email), []));
  }, [email]);

  useEffect(() => {
    if (!email) return;
    if (skipNextCartSave.current) {
      skipNextCartSave.current = false;
      return;
    }
    localStorage.setItem(userKey("all-in-store-cart", email), JSON.stringify(cart));
  }, [cart, email]);

  useEffect(() => {
    if (!email) return;
    if (skipNextPurchasesSave.current) {
      skipNextPurchasesSave.current = false;
      return;
    }
    localStorage.setItem(userKey("all-in-store-purchases", email), JSON.stringify(purchases));
  }, [purchases, email]);

  const categories = ["All", ...new Set(PRODUCTS.map((product) => product.category))];

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesSearch =
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function setAuthField(event) {
    setAuthForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthError("");
    setAuthSuccess("");
    setAuthForm({ name: "", email: "", password: "", confirmPassword: "" });
    setPage("auth");
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const cleanEmail = authForm.email.trim().toLowerCase();
    const cleanName = authForm.name.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (authForm.password.length < 6) {
      setAuthError("Password must contain at least 6 characters.");
      return;
    }

    if (authMode === "signup") {
      if (!cleanName) {
        setAuthError("Please enter your name.");
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
      if (users.some((user) => user.email.toLowerCase() === cleanEmail)) {
        setAuthError("An account with this email already exists. Please log in.");
        return;
      }
      const newUser = {
        name: cleanName,
        email: cleanEmail,
        password: authForm.password,
        createdAt: new Date().toISOString(),
      };
      const nextUsers = [...users, newUser];
      setUsers(nextUsers);
      setCurrentUser(newUser);
      localStorage.setItem(KEYS.session, JSON.stringify(cleanEmail));
      setPage("shop");
      setNotice(`Welcome to All In Store, ${cleanName}!`);
      return;
    }

    const matchedUser = users.find(
      (user) => user.email.toLowerCase() === cleanEmail && user.password === authForm.password
    );
    if (!matchedUser) {
      setAuthError("Email or password is incorrect.");
      return;
    }
    setCurrentUser(matchedUser);
    localStorage.setItem(KEYS.session, JSON.stringify(cleanEmail));
    setPage("shop");
    setNotice(`Welcome back, ${matchedUser.name}!`);
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
    setCurrentUser(null);
    setCart([]);
    setPurchases([]);
    setPage("shop");
    setNotice("You have been logged out.");
  }

  function addToCart(product) {
    if (!currentUser) {
      setNotice("Please log in or sign up before adding items to your cart.");
      openAuth("login");
      return;
    }
    setCart((previous) => {
      const existing = previous.find((item) => item.id === product.id);
      if (existing) {
        return previous.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...previous, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to your cart.`);
  }

  function changeQuantity(id, amount) {
    setCart((previous) =>
      previous
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + amount } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((previous) => previous.filter((item) => item.id !== id));
  }

  function handleCheckout() {
    if (!currentUser) {
      openAuth("login");
      return;
    }
    if (cart.length === 0) {
      setNotice("Your cart is empty.");
      return;
    }
    const order = {
      id: `AIS-${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      items: cart.map(({ id, name, category, price, quantity, image }) => ({
        id, name, category, price, quantity, image,
      })),
      total: cartTotal,
      status: "Demo order placed",
    };
    setPurchases((previous) => [order, ...previous]);
    setCart([]);
    setPage("account");
    setNotice("Demo checkout complete. Your order is saved in My Account.");
  }

  function clearPurchaseHistory() {
    if (window.confirm("Clear all purchase history for this account?")) {
      setPurchases([]);
      setNotice("Purchase history cleared.");
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => setPage("shop")} aria-label="All In Store home">
          <span className="brand-mark">A</span>
          <span>All In Store</span>
        </button>

        <div className="header-search">
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage("shop"); }}
            placeholder="Search products..."
            aria-label="Search products"
          />
          <button onClick={() => setPage("shop")}>Search</button>
        </div>

        <nav className="header-actions" aria-label="Main navigation">
          <button className={page === "shop" ? "nav-link active" : "nav-link"} onClick={() => setPage("shop")}>Shop</button>
          {currentUser ? (
            <>
              <button className={page === "account" ? "nav-link active" : "nav-link"} onClick={() => setPage("account")}>My Account</button>
              <button className="cart-button" onClick={() => setPage("cart")}>Cart <span>{cartCount}</span></button>
              <button className="outline-button compact" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button className="nav-link" onClick={() => openAuth("login")}>Login</button>
              <button className="primary-button compact" onClick={() => openAuth("signup")}>Sign Up</button>
            </>
          )}
        </nav>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      )}

      <main>
        {page === "auth" && (
          <section className="auth-layout">
            <div className="auth-promo">
              <p className="eyebrow">WELCOME TO ALL IN STORE</p>
              <h1>Everything you need, all in one place.</h1>
              <p>Sign in to manage your cart and see your order history.</p>
              <div className="promo-points">
                <span>✓ Keep your cart saved</span>
                <span>✓ Review previous purchases</span>
                <span>✓ Simple demo account</span>
              </div>
            </div>
            <div className="auth-card">
              <div className="auth-tabs">
                <button className={authMode === "login" ? "selected" : ""} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Login</button>
                <button className={authMode === "signup" ? "selected" : ""} onClick={() => { setAuthMode("signup"); setAuthError(""); }}>Sign Up</button>
              </div>
              <h2>{authMode === "signup" ? "Create your account" : "Welcome back"}</h2>
              <p className="muted">{authMode === "signup" ? "Fill in the details below to get started." : "Enter your account details to continue."}</p>
              <form onSubmit={handleAuthSubmit} className="auth-form">
                {authMode === "signup" && (
                  <label>
                    Full name
                    <input name="name" value={authForm.name} onChange={setAuthField} placeholder="Your full name" autoComplete="name" required />
                  </label>
                )}
                <label>
                  Email address
                  <input name="email" type="email" value={authForm.email} onChange={setAuthField} placeholder="you@example.com" autoComplete="email" required />
                </label>
                <label>
                  Password
                  <input name="password" type="password" value={authForm.password} onChange={setAuthField} placeholder="At least 6 characters" autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={6} required />
                </label>
                {authMode === "signup" && (
                  <label>
                    Confirm password
                    <input name="confirmPassword" type="password" value={authForm.confirmPassword} onChange={setAuthField} placeholder="Enter password again" autoComplete="new-password" required />
                  </label>
                )}
                {authError && <p className="form-error">{authError}</p>}
                <button className="primary-button full-width" type="submit">{authMode === "signup" ? "Create Account" : "Login"}</button>
              </form>
              <p className="switch-auth">
                {authMode === "signup" ? "Already have an account?" : "New to All In Store?"}{" "}
                <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }}>
                  {authMode === "signup" ? "Login" : "Create an account"}
                </button>
              </p>
              <p className="demo-warning">University demo only: accounts and passwords are stored in this browser, not securely on a server.</p>
            </div>
          </section>
        )}

        {page === "shop" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">YOUR EVERYDAY MARKETPLACE</p>
                <h1>Find your next<br /><span>favourite thing.</span></h1>
                <p>Discover useful tech, everyday essentials, and little upgrades for your life.</p>
                <button className="primary-button hero-cta" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>Explore Products <span>→</span></button>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="hero-circle circle-one" />
                <div className="hero-circle circle-two" />
                <div className="hero-bag">AIS</div>
                <div className="floating-tag tag-one">Good finds</div>
                <div className="floating-tag tag-two">Everyday value</div>
              </div>
            </section>

            <section className="products-section" id="products">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">HANDPICKED FOR YOU</p>
                  <h2>Explore products</h2>
                </div>
                <span className="result-count">{filteredProducts.length} products</span>
              </div>
              <div className="category-row" aria-label="Filter by category">
                {categories.map((item) => (
                  <button key={item} className={category === item ? "category-chip selected" : "category-chip"} onClick={() => setCategory(item)}>{item}</button>
                ))}
              </div>
              {filteredProducts.length ? (
                <div className="product-grid">
                  {filteredProducts.map((product) => (
                    <article className="product-card" key={product.id}>
                      <div className="product-image-wrap">
                        <img src={product.image} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.src = "https://placehold.co/700x500/f0f3ef/344b3d?text=All+In+Store"; }} />
                        <span className="product-category">{product.category}</span>
                      </div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <div className="product-bottom">
                          <strong>{money(product.price)}</strong>
                          <button className="add-button" onClick={() => addToCart(product)} aria-label={`Add ${product.name} to cart`}>+</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><h3>No products found</h3><p>Try another search or category.</p><button className="outline-button" onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</button></div>
              )}
            </section>
          </>
        )}

        {page === "cart" && (
          <section className="page-section">
            <div className="section-heading">
              <div><p className="eyebrow">READY WHEN YOU ARE</p><h2>Your shopping cart</h2></div>
              <button className="text-button" onClick={() => setPage("shop")}>← Continue shopping</button>
            </div>
            {!currentUser ? (
              <div className="empty-state"><h3>Please log in</h3><p>Your cart is saved separately for each demo account.</p><button className="primary-button" onClick={() => openAuth("login")}>Login</button></div>
            ) : cart.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🛍</div><h3>Your cart is empty</h3><p>Find something you love and add it here.</p><button className="primary-button" onClick={() => setPage("shop")}>Browse products</button></div>
            ) : (
              <div className="cart-layout">
                <div className="cart-items">
                  {cart.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-details"><h3>{item.name}</h3><p>{item.category}</p><strong>{money(item.price)}</strong></div>
                      <div className="quantity-control">
                        <button onClick={() => changeQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => changeQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                      </div>
                      <button className="remove-button" onClick={() => removeFromCart(item.id)}>Remove</button>
                    </article>
                  ))}
                </div>
                <aside className="summary-card">
                  <h3>Order summary</h3>
                  <div className="summary-line"><span>Items ({cartCount})</span><span>{money(cartTotal)}</span></div>
                  <div className="summary-line"><span>Delivery</span><span className="free-label">Free</span></div>
                  <div className="summary-total"><span>Total</span><strong>{money(cartTotal)}</strong></div>
                  <button className="primary-button full-width" onClick={handleCheckout}>Place demo order</button>
                  <p className="summary-note">Demo checkout only. No payment will be taken.</p>
                </aside>
              </div>
            )}
          </section>
        )}

        {page === "account" && (
          <section className="page-section">
            {!currentUser ? (
              <div className="empty-state"><h3>Log in to view your account</h3><button className="primary-button" onClick={() => openAuth("login")}>Login</button></div>
            ) : (
              <>
                <div className="account-hero">
                  <div className="avatar">{currentUser.name.slice(0, 1).toUpperCase()}</div>
                  <div className="account-intro"><p className="eyebrow">YOUR PERSONAL SPACE</p><h2>Hello, {currentUser.name}!</h2><p>{currentUser.email}</p></div>
                  <button className="outline-button" onClick={logout}>Logout</button>
                </div>
                <div className="account-stats">
                  <div className="stat-card"><span>Orders placed</span><strong>{purchases.length}</strong></div>
                  <div className="stat-card"><span>Items in cart</span><strong>{cartCount}</strong></div>
                  <div className="stat-card"><span>Total spent</span><strong>{money(purchases.reduce((sum, order) => sum + order.total, 0))}</strong></div>
                </div>
                <div className="section-heading history-heading">
                  <div><p className="eyebrow">YOUR ORDER RECORD</p><h2>You Have Bought</h2></div>
                  {purchases.length > 0 && <button className="text-button danger-text" onClick={clearPurchaseHistory}>Clear history</button>}
                </div>
                {purchases.length === 0 ? (
                  <div className="empty-state compact-empty"><div className="empty-icon">📦</div><h3>No purchases yet</h3><p>Your completed demo orders will appear here.</p><button className="primary-button" onClick={() => setPage("shop")}>Start shopping</button></div>
                ) : (
                  <div className="purchase-list">
                    {purchases.map((order) => (
                      <article className="purchase-card" key={order.id}>
                        <div className="purchase-header">
                          <div><span className="order-label">ORDER</span><h3>{order.id}</h3></div>
                          <div className="purchase-date">{new Date(order.date).toLocaleString()}</div>
                          <span className="order-status">{order.status}</span>
                        </div>
                        <div className="purchase-products">
                          {order.items.map((item, index) => (
                            <div className="purchase-product" key={`${order.id}-${item.id}-${index}`}>
                              <img src={item.image} alt={item.name} />
                              <div><strong>{item.name}</strong><span>Qty: {item.quantity}</span></div>
                              <b>{money(item.price * item.quantity)}</b>
                            </div>
                          ))}
                        </div>
                        <div className="purchase-total"><span>Order total</span><strong>{money(order.total)}</strong></div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-mark">A</span><strong>All In Store</strong></div>
        <p>Useful finds for everyday life.</p>
        <span>© {new Date().getFullYear()} All In Store · University demo project</span>
      </footer>
    </div>
  );
}

export default App;
