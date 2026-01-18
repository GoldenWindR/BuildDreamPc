function Cart() {
  const cartItems = [
    {
      id: 1,
      name: "Laptop Gamingowy X-Pro",
      price: 4999,
      quantity: 2,
    },
    {
      id: 2,
      name: "Monitor 27\" 144Hz",
      price: 999,
      quantity: 3,
    },
  ];

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Koszyk</h1>

      {cartItems.length === 0 ? (
        <p className="text-center">Koszyk jest pusty</p>
      ) : (
        <>
          <div className="row">
            {cartItems.map((item) => (
              <div className="col-md-12 mb-3" key={item.id}>
                <div className="card shadow">
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">{item.name}</h5>
                      <p className="mb-0">
                        Cena: {item.price} zł
                      </p>
                      <p className="mb-0">
                        Ilość: {item.quantity}
                      </p>
                    </div>

                    <div className="text-end">
                      <p className="fw-bold mb-2">
                        {item.price * item.quantity} zł
                      </p>
                      <button className="btn btn-danger btn-sm">
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
              <h3 className="text-success mt-2">
                Do zapłaty: {totalPrice} zł
              </h3>

              <button className="btn btn-success mt-3">
                Przejdź do płatności
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
