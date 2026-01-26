import { useEffect, useState } from "react";

function AdminPanel() {
  const token = localStorage.getItem("token");

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const emptyForm = {
    type: "cpu",
    brand: "",
    model: "",
    price: "",
    power_draw: "",
    details: {}
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // 🔄 POBIERANIE PRODUKTÓW
  const fetchProducts = async () => {
    const res = await fetch(
      `http://localhost:5000/products?search=${search}`
    );
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  //  DODAJ /  EDYTUJ
  const saveProduct = async (e) => {
    e.preventDefault();

    const url = editingId
      ? `http://localhost:5000/products/${editingId}`
      : "http://localhost:5000/products";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        power_draw: form.power_draw ? Number(form.power_draw) : null
      })
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(editingId ? "Produkt zaktualizowany" : "Produkt dodany");
      setForm(emptyForm);
      setEditingId(null);
      fetchProducts();
    } else {
      setMessage(data.error || "Błąd zapisu");
    }
  };

  //  USUWANIE
  const deleteProduct = async (id) => {
    if (!window.confirm("Usunąć produkt?")) return;

    await fetch(`http://localhost:5000/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    fetchProducts();
  };

  //  TRYB EDYCJI
  const editProduct = (p) => {
    setForm({
      type: p.type,
      brand: p.brand,
      model: p.model,
      price: p.price,
      power_draw: p.power_draw || "",
      details: p.details || {}
    });
    setEditingId(p._id);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4"> Panel admina – produkty</h2>

      {message && <div className="alert alert-info">{message}</div>}

      {/* FORMULARZ */}
      <div className="card p-4 mb-4 shadow">
        <h4>{editingId ? "Edytuj produkt" : "Dodaj produkt"}</h4>

        <form onSubmit={saveProduct}>
          <select
            className="form-control mb-2"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="cpu">CPU</option>
            <option value="gpu">GPU</option>
            <option value="ram">RAM</option>
            <option value="motherboard">Motherboard</option>
            <option value="psu">PSU</option>
            <option value="storage">Storage</option>
          </select>

          <input
            className="form-control mb-2"
            placeholder="Marka"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />

          <input
            className="form-control mb-2"
            placeholder="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />

          <input
            className="form-control mb-2"
            placeholder="Cena"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />

          <input
            className="form-control mb-3"
            placeholder="Pobór mocy (opcjonalnie)"
            type="number"
            value={form.power_draw}
            onChange={(e) =>
              setForm({ ...form, power_draw: e.target.value })
            }
          />

          <button className="btn btn-success w-100">
            {editingId ? "Zapisz zmiany" : "Dodaj produkt"}
          </button>

          {editingId && (
            <button
              type="button"
              className="btn btn-secondary w-100 mt-2"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Anuluj edycję
            </button>
          )}
        </form>
      </div>

      {/* WYSZUKIWARKA */}
      <input
        className="form-control mb-3"
        placeholder="Szukaj produktu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* LISTA */}
      <div className="card p-4 shadow">
        <h4>Lista produktów</h4>

        {products.map((p) => (
          <div
            key={p._id}
            className="border rounded p-3 mb-2 d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{p.brand} {p.model}</strong><br />
              Typ: {p.type} | Cena: {p.price} zł
            </div>

            <div>
              <button
                className="btn btn-sm btn-primary me-2"
                onClick={() => editProduct(p)}
              >
                Edytuj
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => deleteProduct(p._id)}
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
