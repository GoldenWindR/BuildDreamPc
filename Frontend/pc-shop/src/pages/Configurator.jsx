import { useEffect, useState } from "react";

function Configurator() {
  const [parts, setParts] = useState({});
  const [selected, setSelected] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // 🔹 POBRANIE PRODUKTÓW
  // =========================
  useEffect(() => {
    fetch("http://localhost:5000/products")
      .then((res) => res.json())
      .then((data) => {
        const grouped = {};
        data.forEach((p) => {
          if (!grouped[p.type]) grouped[p.type] = [];
          grouped[p.type].push(p);
        });
        setParts(grouped);
      })
      .catch(console.error);
  }, []);

  // =========================
  // 🔹 LIVE COMPATIBILITY
  // =========================
  useEffect(() => {
    if (Object.keys(selected).length === 0) return;

    const fetchCompatibility = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "http://localhost:5000/compatibility/recommend",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(selected),
          },
        );
        const data = await res.json();
        setRecommendations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompatibility();
  }, [selected]);

  // =========================
  // 🔹 HANDLERY
  // =========================
  const handleSelect = (type, id) => {
    setSelected((prev) => ({
      ...prev,
      [type]: id || null,
    }));
  };

  const isAllowed = (type, id) => {
    if (!recommendations?.recommendations?.[type]) return true;
    return recommendations.recommendations[type].some((p) => p._id === id);
  };

  // =========================
  // 🔹 ZAPIS KONFIGURACJI
  // =========================
  const saveConfiguration = async () => {
    const token = localStorage.getItem("token");

    const items = Object.values(selected)
      .filter(Boolean)
      .map((id) => ({
        product_id: id,
        quantity: 1,
      }));

    try {
      const res = await fetch("http://localhost:5000/cart/configurations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "Moja konfiguracja PC",
          items,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd zapisu konfiguracji");
      }

      alert("💾 Konfiguracja zapisana");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // =========================
  // 🔹 DODAJ DO KOSZYKA
  // =========================
  const addConfigToCart = async () => {
    const token = localStorage.getItem("token");

    const items = Object.values(selected)
      .filter(Boolean)
      .map((id) => ({
        product_id: id,
        quantity: 1,
      }));

    if (items.length === 0) {
      alert("Brak komponentów do dodania");
      return;
    }

    try {
      for (const item of items) {
        const res = await fetch("http://localhost:5000/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Błąd dodawania do koszyka");
        }
      }

      alert("🛒 Konfiguracja dodana do koszyka");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // =========================
  // 🔹 RENDER
  // =========================
  const renderSelect = (label, type) => (
    <div className="card shadow-sm mb-3" key={type}>
      <div className="card-body">
        <label className="fw-bold mb-2">{label}</label>
        <select
          className="form-select"
          value={selected[type] || ""}
          onChange={(e) => handleSelect(type, e.target.value)}
        >
          <option value="">— wybierz —</option>
          {parts[type]?.map((p) => (
            <option
              key={p._id}
              value={p._id}
              disabled={!isAllowed(type, p._id)}
            >
              {p.brand} {p.model} ({p.price} zł)
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const isCompleteConfig = [
    "cpu",
    "motherboard",
    "ram",
    "gpu",
    "psu",
    "case",
  ].every((k) => selected[k]);

  const renderRecommendations = () => {
    if (!recommendations?.recommendations) {
      return (
        <div className="alert alert-secondary">
          Wybierz komponenty, aby zobaczyć rekomendacje
        </div>
      );
    }

    return Object.entries(recommendations.recommendations).map(
      ([type, items]) => (
        <div className="mb-4" key={type}>
          <h6 className="text-uppercase text-muted">{type}</h6>

          {items.map((p) => (
            <div className="card mb-2 shadow-sm" key={p._id}>
              <div className="card-body p-2">
                <strong>
                  {p.brand} {p.model}
                </strong>
                <div className="small">{p.price} zł</div>
                <button
                  className="btn btn-sm btn-outline-primary mt-2"
                  onClick={() => handleSelect(type, p._id)}
                >
                  Wybierz
                </button>
              </div>
            </div>
          ))}
        </div>
      ),
    );
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Konfigurator PC</h1>

      <div className="row">
        <div className="col-md-7">
          {renderSelect("Procesor", "cpu")}
          {renderSelect("Płyta główna", "motherboard")}
          {renderSelect("Pamięć RAM", "ram")}
          {renderSelect("Karta graficzna", "gpu")}
          {renderSelect("Zasilacz", "psu")}
          {renderSelect("Obudowa", "case")}
        </div>

        <div className="col-md-5">
          <div className="sticky-top" style={{ top: "80px" }}>
            <h4>Rekomendacje</h4>

            {loading && (
              <div className="alert alert-secondary">
                Sprawdzanie kompatybilności...
              </div>
            )}

            {recommendations && (
              <div className="alert alert-info">
                Pobór mocy:{" "}
                <strong>{recommendations.current_power_draw} W</strong>
                <br />
                Zalecany PSU:{" "}
                <strong>{recommendations.recommended_psu_wattage} W</strong>
              </div>
            )}

            {renderRecommendations()}
          </div>
        </div>
      </div>

      <div className="text-center mt-5">
        <button
          className="btn btn-lg btn-success px-5"
          disabled={!isCompleteConfig}
          onClick={saveConfiguration}
        >
          Zapisz konfigurację
        </button>

        {!isCompleteConfig && (
          <div className="text-muted mt-2">Wybierz wszystkie komponenty</div>
        )}
      </div>

      <div className="text-center mt-3">
        <button
          className="btn btn-lg btn-primary px-5"
          disabled={!isCompleteConfig}
          onClick={addConfigToCart}
        >
          Dodaj konfigurację do koszyka
        </button>
      </div>
    </div>
  );
}

export default Configurator;
