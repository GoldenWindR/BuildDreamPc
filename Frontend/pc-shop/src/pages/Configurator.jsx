import { useState } from "react";

function Configurator() {
  const parts = {
    cpu: [
      { id: 1, name: "Intel Core i5-12400F", price: 900 },
      { id: 2, name: "Intel Core i7-12700K", price: 1600 },
      { id: 3, name: "Ryzen 5 5600X", price: 850 },
    ],
    gpu: [
      { id: 4, name: "RTX 3060", price: 1500 },
      { id: 5, name: "RTX 4060", price: 1900 },
      { id: 6, name: "RTX 4070", price: 2800 },
    ],
    ram: [
      { id: 7, name: "16GB DDR4", price: 300 },
      { id: 8, name: "32GB DDR4", price: 550 },
    ],
    disk: [
      { id: 9, name: "SSD 1TB NVMe", price: 350 },
      { id: 10, name: "SSD 2TB NVMe", price: 650 },
    ],
      kurwy: [
      { id: 9, name: "karzeł", price: 350 },
      { id: 10, name: "goblin", price: 650 },
      { id: 11, name: "normalna", price: 650 },
      { id: 12, name: "dziencioł", price: 650 },
    ],
  };

  const [selected, setSelected] = useState({
    cpu: null,
    gpu: null,
    ram: null,
    disk: null,
  });

  const handleSelect = (type, id) => {
    const item = parts[type].find((p) => p.id === Number(id));
    setSelected({ ...selected, [type]: item });
  };

  const totalPrice = Object.values(selected).reduce(
    (sum, item) => sum + (item ? item.price : 0),
    0
  );

  const renderSelect = (label, type) => (
    <div className="card shadow mb-3">
      <div className="card-body">
        <label className="form-label fw-bold">{label}</label>
        <select
          className="form-select"
          value={selected[type]?.id || ""}
          onChange={(e) => handleSelect(type, e.target.value)}
        >
          <option value="">— wybierz —</option>
          {parts[type].map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.price} zł)
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Konfigurator PC</h1>

      {renderSelect("Procesor", "cpu")}
      {renderSelect("Karta graficzna", "gpu")}
      {renderSelect("Pamięć RAM", "ram")}
      {renderSelect("Dysk", "disk")}
      {renderSelect("kurwy", "kurwy")}

      <div className="card shadow mt-4">
        <div className="card-body text-center">
          <h4>Podsumowanie</h4>

          <p className="mt-3">
            CPU: {selected.cpu?.name || "—"} <br />
            GPU: {selected.gpu?.name || "—"} <br />
            RAM: {selected.ram?.name || "—"} <br />
            Dysk: {selected.disk?.name || "—"}  <br />
            kurwa: {selected.kurwy?.name || "—"}
          </p>

          <h3 className="text-success">
            Cena: {totalPrice} zł
          </h3>

          <button
            className="btn btn-primary mt-3"
            disabled={totalPrice === 0}
          >
            Dodaj zestaw do koszyka
          </button>
        </div>
      </div>
    </div>
  );
}

export default Configurator;
