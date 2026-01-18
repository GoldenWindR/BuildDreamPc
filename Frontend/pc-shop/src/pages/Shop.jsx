function Shop() {
  const products = [
    {
      id: 1,
      name: "Laptop Gamingowy X-Pro",
      price: "4999 zł",
      description: "Intel i7, 16GB RAM, RTX 4060",
    },
    {
      id: 2,
      name: "Komputer PC Ryzen",
      price: "3799 zł",
      description: "Ryzen 5, 16GB RAM, RTX 3060",
    },
    {
      id: 3,
      name: "Monitor 27\" 144Hz",
      price: "999 zł",
      description: "Full HD, IPS, 1ms",
    },
    {
      id: 4,
      name: "Klawiatura Mechaniczna",
      price: "349 zł",
      description: "RGB, przełączniki Red",
    },
    {
      id: 5,
      name: "Mysz Gamingowa",
      price: "199 zł",
      description: "16000 DPI, RGB",
    },
    {
      id: 6,
      name: "Słuchawki Gamingowe",
      price: "299 zł",
      description: "7.1 Surround, Mikrofon",
    },
  ];

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Sklep</h1>

      <div className="row">
        {products.map((product) => (
          <div className="col-md-4 mb-4" key={product.id}>
            <div className="card h-100 shadow">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{product.name}</h5>
                <p className="card-text">{product.description}</p>

                <div className="mt-auto">
                  <p className="fw-bold">{product.price}</p>
                  <button className="btn btn-primary w-100">
                    Dodaj do koszyka
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shop;
