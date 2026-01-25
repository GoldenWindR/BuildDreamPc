import { useEffect, useState } from "react";

function Profile() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [editProfile, setEditProfile] = useState(false);
  const [editPassword, setEditPassword] = useState(false);

  const [user, setUser] = useState({
    login: "",
    email: "",
    first_name: "",
    last_name: "",
    role: ""
  });

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: ""
  });

  // 🔮 historia – placeholder
  const [orders] = useState([
    { id: 1, product: "Laptop X-Pro", price: "4999 zł", status: "Zrealizowane" },
    { id: 2, product: "Monitor 27\"", price: "999 zł", status: "W realizacji" }
  ]);

  // 🆕 ADMIN – FORMULARZ PRODUKTU
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: ""
  });

  // 🔐 POBIERANIE PROFILU
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setUser(data);
        setProfileForm({
          first_name: data.first_name,
          last_name: data.last_name
        });
      })
      .catch(() => setMessage("Błąd pobierania profilu"))
      .finally(() => setLoading(false));
  }, []);

  // ✏️ ZAPIS PROFILU
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

    if (res.ok) {
      setUser({ ...user, ...profileForm });
      setMessage("Profil zaktualizowany");
      setEditProfile(false);
    }
  };

  // 🔑 ZMIANA HASŁA
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

    if (res.ok) {
      setMessage("Hasło zmienione");
      setPasswordForm({ old_password: "", new_password: "" });
      setEditPassword(false);
    }
  };

  // 🛒 ADMIN – DODANIE PRODUKTU (na razie mock)
  const addProduct = (e) => {
    e.preventDefault();
    console.log("Nowy produkt:", productForm);
    setMessage("Produkt dodany (mock)");
    setProductForm({ name: "", price: "", description: "" });
  };

  if (loading) return <div className="text-center mt-5">Ładowanie...</div>;

  return (
    <div className="container mt-5">

      {message && <div className="alert alert-info text-center">{message}</div>}

      <div className="row">

        {/* LEWA */}
        <div className="col-md-4">

          {/* PROFIL */}
          <div className="card p-4 shadow mb-4">
            <h4>Profil</h4>
            <p><strong>Login:</strong> {user.login}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rola:</strong> {user.role}</p>

            {!editProfile ? (
              <>
                <p>{user.first_name} {user.last_name}</p>
                <button className="btn btn-primary w-100" onClick={() => setEditProfile(true)}>
                  Edytuj profil
                </button>
              </>
            ) : (
              <form onSubmit={saveProfile}>
                <input className="form-control mb-2"
                  value={profileForm.first_name}
                  onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
                />
                <input className="form-control mb-2"
                  value={profileForm.last_name}
                  onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
                />
                <button className="btn btn-success w-100 mb-2">Zapisz</button>
                <button type="button" className="btn btn-secondary w-100" onClick={() => setEditProfile(false)}>
                  Anuluj
                </button>
              </form>
            )}
          </div>

          {/* HASŁO */}
          <div className="card p-4 shadow">
            {!editPassword ? (
              <button className="btn btn-warning w-100" onClick={() => setEditPassword(true)}>
                Zmień hasło
              </button>
            ) : (
              <form onSubmit={changePassword}>
                <input type="password" className="form-control mb-2"
                  placeholder="Stare hasło"
                  value={passwordForm.old_password}
                  onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                />
                <input type="password" className="form-control mb-2"
                  placeholder="Nowe hasło"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                />
                <button className="btn btn-success w-100">Zapisz</button>
              </form>
            )}
          </div>

        </div>

        {/* PRAWA */}
        <div className="col-md-8">

          {/* HISTORIA */}
          <div className="card p-4 shadow">
            <h4>Historia zamówień</h4>

            {orders.map(order => (
              <div key={order.id} className="border rounded p-3 mb-3">
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <strong>{order.product}</strong><br />
                  Cena: {order.price}<br />
                  Status: <strong>{order.status}</strong>
                </div>

                {expandedOrder === order.id && (
                  <div className="mt-3 bg-light p-3 rounded">
                    <p><strong>Data:</strong> {order.date}</p>
                    <p>ID zamówienia: {order.id}</p>
                  </div>
                )}
              </div>
            ))}

          </div>

          {/* 🛑 ADMIN PANEL */}
          {user.role === "admin" && (
            <div className="card p-4 shadow border-danger">
              <h4 className="text-danger">Panel administratora</h4>

              <form onSubmit={addProduct}>
                <input className="form-control mb-2"
                  placeholder="Nazwa produktu"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                />
                <input className="form-control mb-2"
                  placeholder="Cena"
                  value={productForm.price}
                  onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                />
                <textarea className="form-control mb-2"
                  placeholder="Opis"
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                />
                <button className="btn btn-danger w-100">Dodaj produkt</button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default Profile;
