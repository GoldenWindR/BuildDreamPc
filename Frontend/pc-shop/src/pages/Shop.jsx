import { useEffect, useState } from "react";

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

                <p className="card-text">
                  Typ: {product.type}
                </p>

                <div className="mt-auto">
                  <p className="fw-bold">
                    {product.price} zł
                  </p>

                  <button className="btn btn-primary w-100">
                    Dodaj do koszyka
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
