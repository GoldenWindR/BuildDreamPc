import { useEffect, useState } from "react";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchCart = async () => {
    try {
      const res = await fetch("http://localhost:5000/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const removeItem = async (productId) => {
    await fetch(`http://localhost:5000/cart/remove/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchCart();
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    await fetch("http://localhost:5000/cart/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        quantity,
      }),
    });

    fetchCart();
  };

  const checkout = async () => {
    const res = await fetch("http://localhost:5000/cart/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      alert("Zamówienie złożone ✅");
      fetchCart();
    } else {
      alert(data.error || "Błąd zamówienia");
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
      <h1 className="mb-4 text-center">Koszyk</h1>

      <div className="row">
        {cart.items.map((item) => (
          <div className="col-12 mb-3" key={item.product_id}>
            <div className="card shadow">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">
                    {item.brand} {item.model}
                  </h5>
                  <p className="mb-0">Cena: {item.price} zł</p>

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

      <div className="card mt-4 shadow">
        <div className="card-body text-center">
          <h4>Podsumowanie</h4>

          <p className="mb-1">
            Pobór mocy: <strong>{cart.total_power_draw} W</strong>
          </p>

          <h3 className="text-success mt-2">
            Do zapłaty: {cart.total_price} zł
          </h3>

          <button className="btn btn-success mt-3" onClick={checkout}>
            Przejdź do płatności
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
