import { useEffect, useState } from "react";

function Configurator() {
  const [parts, setParts] = useState({});
  const [selected, setSelected] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 pobranie części
  useEffect(() => {
    fetch("http://localhost:5000/products")
      .then(res => res.json())
      .then(data => {
        const grouped = {};
        data.forEach(p => {
          if (!grouped[p.type]) grouped[p.type] = [];
          grouped[p.type].push(p);
        });
        setParts(grouped);
      });
  }, []);

  // 🔹 live compatibility check
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
            body: JSON.stringify(selected)
          }
        );

        const data = await res.json();
        setRecommendations(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchCompatibility();
  }, [selected]);

  const handleSelect = (type, id) => {
    setSelected(prev => ({
      ...prev,
      [type]: id || null
    }));
  };

  const isAllowed = (type, id) => {
    if (!recommendations?.recommendations?.[type]) return true;
    return recommendations.recommendations[type].some(p => p._id === id);
  };

  const renderSelect = (label, type) => (
    <div className="card shadow-sm mb-3" key={type}>
      <div className="card-body">
        <label className="fw-bold mb-2">{label}</label>
        <select
          className="form-select"
          value={selected[type] || ""}
          onChange={e => handleSelect(type, e.target.value)}
        >
          <option value="">— wybierz —</option>
          {parts[type]?.map(p => (
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
          <h6 className="text-uppercase text-muted">
            {type}
          </h6>

          {items.map(p => (
            <div className="card mb-2 shadow-sm" key={p._id}>
              <div className="card-body p-2">
                <strong>{p.brand} {p.model}</strong>
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
      )
    );
  };

  const isCompleteConfig = ["cpu", "motherboard", "ram", "gpu", "psu", "case"]
    .every(k => selected[k]);

  const addToCart = () => {
    console.log("Dodano do koszyka:", selected);
    alert("Zestaw dodany do koszyka");
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
                <strong>{recommendations.current_power_draw} W</strong><br />
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
          onClick={addToCart}
        >
          Dodaj do koszyka
        </button>

        {!isCompleteConfig && (
          <div className="text-muted mt-2">
            Wybierz wszystkie komponenty
          </div>
        )}
      </div>
    </div>
  );
}

export default Configurator;
