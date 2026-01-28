import { useEffect, useState } from "react";

function Toast({ message, type = "success", onClose }) {
  return (
    <div
      className={`toast show text-white bg-${type}`}
      style={{
        minWidth: "200px",
        marginBottom: "0.5rem",
        opacity: 0.95,
        transition: "all 0.3s",
      }}
    >
      <div className="toast-body d-flex justify-content-between align-items-center">
        <span>{message}</span>
        <button
          type="button"
          className="ml-2 mb-1 close text-white"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
    </div>
  );
}

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const token = localStorage.getItem("token");

  const showToast = (message, type = "success") => {
    setToasts((prev) => {
      return [...prev, { id: Date.now(), message, type }];
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.message !== message));
    }, 3500);
  };

  const fetchCart = async () => {
    try {
      const res = await fetch("http://localhost:5000/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
      showToast("Błąd pobierania koszyka", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const removeItem = async (productId) => {
    try {
      await fetch(`http://localhost:5000/cart/remove/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("Produkt usunięty z koszyka", "success");
      fetchCart();
    } catch {
      showToast("Błąd usuwania produktu", "danger");
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    try {
      await fetch("http://localhost:5000/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity }),
      });

      showToast("Zaktualizowano ilość", "success");
      fetchCart();
    } catch {
      showToast("Błąd aktualizacji ilości", "danger");
    }
  };

  const checkout = async () => {
    try {
      const res = await fetch("http://localhost:5000/cart/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Zamówienie złożone", "success");
        fetchCart();
      } else {
        showToast(data.error || "Błąd zamówienia", "danger");
      }
    } catch {
      showToast("Błąd połączenia z serwerem", "danger");
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <h1>Koszyk</h1>
        <p>Koszyk jest pusty</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Koszyk</h1>

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 9999 }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() =>
              setToasts((prev) => prev.filter((toast) => toast.id !== t.id))
            }
          />
        ))}
      </div>

      {/* Lista produktów w koszyku */}
      <div className="row">
        {cart.items.map((item) => (
          <div className="col-12 mb-3" key={item.product_id}>
            <div className="card shadow">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h5>
                    {item.brand} {item.model}
                  </h5>
                  <p className="mb-1">Cena: {item.price} zł</p>

                  <div className="d-flex align-items-center mt-2">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity - 1)
                      }
                    >
                      −
                    </button>
                    <span className="mx-3">{item.quantity}</span>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-end">
                  <p className="fw-bold mb-2">
                    {item.price * item.quantity} zł
                  </p>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeItem(item.product_id)}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Podsumowanie */}
      <div className="card shadow mt-4 text-center">
        <div className="card-body">
          <h4>Podsumowanie</h4>
          <p>
            Pobór mocy: <strong>{cart.total_power_draw} W</strong>
          </p>
          <h3 className="text-success">{cart.total_price} zł</h3>
          <button className="btn btn-success mt-3" onClick={checkout}>
            Przejdź do płatności
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
