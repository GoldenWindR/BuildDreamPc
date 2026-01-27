import { useEffect, useState } from "react";

/* 🔧 DEFINICJA PÓL DETAILS DLA TYPÓW PRODUKTÓW */
const detailFields = {
  cpu: [
    { name: "socket", label: "Socket" },
    { name: "tdp", label: "TDP", type: "number" },
    { name: "cores", label: "Rdzenie", type: "number" },
    { name: "threads", label: "Wątki", type: "number" },
    { name: "boost_clock", label: "Boost clock (GHz)", type: "number" }
  ],

  ram: [
    { name: "ram_type", label: "Typ RAM" },
    { name: "speed", label: "Taktowanie (MHz)", type: "number" },
    { name: "capacity", label: "Pojemność (GB)", type: "number" },
    { name: "voltage", label: "Napięcie", type: "number" }
  ],

  gpu: [
    { name: "length_mm", label: "Długość (mm)", type: "number" },
    { name: "power_draw", label: "Pobór mocy (W)", type: "number" },
    { name: "recommended_psu", label: "Zalecany PSU (W)", type: "number" }
  ],

  psu: [
    { name: "wattage", label: "Moc (W)", type: "number" },
    { name: "efficiency", label: "Sprawność (80+)" },
    { name: "modular", label: "Modularny (true / false)" }
  ],

  storage: [
    { name: "type", label: "Typ (SSD/HDD)" },
    { name: "protocol", label: "Interfejs" },
    { name: "capacity", label: "Pojemność (GB)", type: "number" },
    { name: "speed_read", label: "Prędkość odczytu", type: "number" }
  ]
};

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

  /* 🔄 POBIERANIE PRODUKTÓW */
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

  /* 💾 DODAWANIE / EDYCJA */
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
      setMessage(data.error || "Błąd zapisu produktu");
    }
  };

  /* 🗑 USUWANIE */
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

  /* ✏️ TRYB EDYCJI */
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
      <h2 className="mb-4">Panel admina – produkty</h2>

      {message && <div className="alert alert-info">{message}</div>}

      {/* ➕ FORMULARZ */}
      <div className="card p-4 mb-4 shadow">
        <h4>{editingId ? "Edytuj produkt" : "Dodaj produkt"}</h4>

        <form onSubmit={saveProduct}>
          <select
            className="form-control mb-2"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value,
                details: {}
              })
            }
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
            required
          />

          <input
            className="form-control mb-2"
            placeholder="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            required
          />

          <input
            className="form-control mb-2"
            placeholder="Cena"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
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

          {/* 🔧 DYNAMICZNE POLA DETAILS */}
          {detailFields[form.type]?.map((field) => (
            <input
              key={field.name}
              className="form-control mb-2"
              placeholder={field.label}
              type={field.type || "text"}
              value={form.details[field.name] || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  details: {
                    ...form.details,
                    [field.name]:
                      field.type === "number"
                        ? Number(e.target.value)
                        : e.target.value
                  }
                })
              }
              required
            />
          ))}

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

      {/* 🔍 WYSZUKIWARKA */}
      <input
        className="form-control mb-3"
        placeholder="Szukaj produktu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 📦 LISTA PRODUKTÓW */}
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
