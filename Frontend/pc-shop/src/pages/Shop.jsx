import { useEffect, useState } from "react";

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(""); // do śledzenia dodawania produktu

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/products/");

        if (!response.ok) {
          throw new Error("Błąd pobierania produktów");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError("Nie udało się pobrać produktów");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = async (productId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Musisz być zalogowany, aby dodać produkt do koszyka");
      return;
    }

    setAdding(productId);

    try {
      const res = await fetch("http://localhost:5000/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Błąd dodawania produktu do koszyka");
        return;
      }

      alert("Produkt dodany do koszyka ✅");
    } catch (err) {
      console.error(err);
      alert("Błąd połączenia z serwerem");
    } finally {
      setAdding("");
    }
  };

  if (loading) {
    return <p className="text-center mt-5">Ładowanie produktów...</p>;
  }

  if (error) {
    return <p className="text-center text-danger mt-5">{error}</p>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Sklep</h1>

      <div className="row">
        {products.map((product) => (
          <div className="col-md-4 mb-4" key={product._id}>
            <div className="card h-100 shadow">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">
                  {product.brand} {product.model}
                </h5>

                <p className="card-text">Typ: {product.type}</p>

                <div className="mt-auto">
                  <p className="fw-bold">{product.price} zł</p>

                  <button
                    className="btn btn-primary w-100"
                    onClick={() => addToCart(product._id)}
                    disabled={adding === product._id}
                  >
                    {adding === product._id ? "Dodawanie..." : "Dodaj do koszyka"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <p className="text-center">Brak produktów</p>
        )}
      </div>
    </div>
  );
}

export default Shop;
