import { useEffect, useState } from "react";

function Profile() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [editProfile, setEditProfile] = useState(false);
  const [editPassword, setEditPassword] = useState(false);

  const [hoveredOrder, setHoveredOrder] = useState(null);
  const [hoveredConfig, setHoveredConfig] = useState(null);

  const [user, setUser] = useState({});
  const [orders, setOrders] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [productsMap, setProductsMap] = useState({});

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    Promise.all([
      fetch("http://localhost:5000/users/profile", {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch("http://localhost:5000/cart/orders", {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch("http://localhost:5000/cart/configurations", {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch("http://localhost:5000/products")
    ])
      .then(async ([p, o, c, pr]) => {
        const profile = await p.json();
        const orders = await o.json();
        const configs = await c.json();
        const products = await pr.json();

        const map = {};
        products.forEach(p => {
          map[p._id] = `${p.brand} ${p.model}`;
        });

        setUser(profile);
        setProfileForm({
          first_name: profile.first_name,
          last_name: profile.last_name
        });
        setOrders(orders);
        setConfigs(configs);
        setProductsMap(map);
      })
      .catch(() => setMessage("Błąd ładowania danych"))
      .finally(() => setLoading(false));
  }, []);

  /* ================= PROFIL ================= */

  const saveProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/users/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileForm)
    });

    const data = await res.json();

    if (res.ok) {
      setUser({ ...user, ...profileForm });
      setMessage("Profil zaktualizowany");
      setEditProfile(false);
    } else {
      setMessage(data.error || "Błąd zapisu");
    }
  };

  /* ================= HASŁO ================= */

  const changePassword = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/users/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(passwordForm)
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Hasło zmienione");
      setPasswordForm({ old_password: "", new_password: "" });
      setEditPassword(false);
    } else {
      setMessage(data.error || "Błąd zmiany hasła");
    }
  };

  if (loading) return <div className="text-center mt-5">Ładowanie...</div>;

  return (
    <div className="container mt-5">

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row">

        {/* LEWA KOLUMNA */}
        <div className="col-md-4">

          {/* PROFIL */}
          <div className="card p-4 shadow mb-4">
            <h4>Profil</h4>
            <p><strong>Login:</strong> {user.login}</p>
            <p><strong>Email:</strong> {user.email}</p>

            {!editProfile ? (
              <>
                <p><strong>Imię:</strong> {user.first_name}</p>
                <p><strong>Nazwisko:</strong> {user.last_name}</p>
                <button className="btn btn-primary w-100" onClick={() => setEditProfile(true)}>
                  Edytuj profil
                </button>
              </>
            ) : (
              <form onSubmit={saveProfile}>
                <input
                  className="form-control mb-2"
                  value={profileForm.first_name}
                  onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
                />
                <input
                  className="form-control mb-2"
                  value={profileForm.last_name}
                  onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
                />
                <button className="btn btn-success w-100 mb-2">Zapisz</button>
                <button type="button" className="btn btn-secondary w-100"
                  onClick={() => setEditProfile(false)}>
                  Anuluj
                </button>
              </form>
            )}
          </div>

          {/* HASŁO */}
          <div className="card p-4 shadow">
            <h4>Hasło</h4>

            {!editPassword ? (
              <button className="btn btn-warning w-100"
                onClick={() => setEditPassword(true)}>
                Zmień hasło
              </button>
            ) : (
              <form onSubmit={changePassword}>
                <input
                  type="password"
                  className="form-control mb-2"
                  placeholder="Stare hasło"
                  value={passwordForm.old_password}
                  onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                />
                <input
                  type="password"
                  className="form-control mb-2"
                  placeholder="Nowe hasło"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                />
                <button className="btn btn-success w-100 mb-2">Zapisz</button>
                <button type="button" className="btn btn-secondary w-100"
                  onClick={() => setEditPassword(false)}>
                  Anuluj
                </button>
              </form>
            )}
          </div>
        </div>

        {/* PRAWA KOLUMNA */}
        <div className="col-md-8">

          {/* ZAMÓWIENIA */}
          <div className="card p-4 shadow mb-4">
            <h4>Historia zamówień</h4>

            {orders.map(order => (
              <div key={order._id}
                className="border rounded p-3 mb-3"
                onMouseEnter={() => setHoveredOrder(order._id)}
                onMouseLeave={() => setHoveredOrder(null)}
              >
                <strong>Zamówienie #{order._id.slice(-6)}</strong>
                <br />Cena: {order.total_price} zł

                {hoveredOrder === order._id && (
                  <ul className="list-group mt-3">
                    {order.items.map((i, idx) => (
                      <li key={idx} className="list-group-item">
                        {i.brand} {i.model} × {i.quantity}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* KONFIGURACJE */}
          <div className="card p-4 shadow">
            <h4>Historia konfiguracji</h4>

            {configs.map(cfg => (
              <div key={cfg._id}
                className="border rounded p-3 mb-3"
                onMouseEnter={() => setHoveredConfig(cfg._id)}
                onMouseLeave={() => setHoveredConfig(null)}
              >
                <strong>{cfg.name}</strong>

                {hoveredConfig === cfg._id && (
                  <ul className="list-group mt-3">
                    {cfg.items.map((i, idx) => (
                      <li key={idx} className="list-group-item">
                        {productsMap[i.product_id] || "Nieznany produkt"} × {i.quantity}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
