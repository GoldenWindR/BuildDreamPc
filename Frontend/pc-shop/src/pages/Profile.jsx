import { useState } from "react";

function Profile() {
  const [editProfile, setEditProfile] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [message, setMessage] = useState(""); // komunikat na górze
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [user, setUser] = useState({
    login: "admin",
    email: "admin@example.com"
  });

  const [address, setAddress] = useState({
    street: "Kwiatowa",
    houseNumber: "12A",
    city: "Warszawa",
    postalCode: "00-001",
    country: "Polska"
  });

  const [orders] = useState([
    {
      id: 1,
      product: "Laptop Dell XPS",
      price: "5999 zł",
      status: "Zrealizowane",
      buyer: { name: "Jan Kowalski", email: "jan@example.com" },
      deliveryAddress: address
    },
    {
      id: 2,
      product: "Mysz Logitech MX",
      price: "399 zł",
      status: "W realizacji",
      buyer: { name: "Jan Kowalski", email: "jan@example.com" },
      deliveryAddress: address
    }
  ]);

  const [profileForm, setProfileForm] = useState({
    login: user.login,
    email: user.email
  });

  const [addressForm, setAddressForm] = useState(address);

  const [passwordForm, setPasswordForm] = useState({
    password: "",
    passwordConfirm: ""
  });

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const saveProfile = (e) => {
    e.preventDefault();
    setUser({ ...user, ...profileForm });
    setMessage("Dane profilu zapisane poprawnie!");
    setEditProfile(false);
  };

  const saveAddress = (e) => {
    e.preventDefault();
    setAddress(addressForm);
    setMessage("Adres zapisany poprawnie!");
    setEditAddress(false);
  };

  const savePassword = (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.passwordConfirm) {
      setMessage("Hasła nie są takie same!");
      return;
    }
    setMessage("Hasło zmienione poprawnie!");
    setPasswordForm({ password: "", passwordConfirm: "" });
    setEditPassword(false);
  };

  return (
    <div className="container mt-5">
      {/* KOMUNIKAT NA GÓRZE */}
      {message && (
        <div className="alert alert-info text-center mb-4">{message}</div>
      )}

      <div className="row">

        {/* LEWA KOLUMNA */}
        <div className="col-md-4">

          {/* PROFIL */}
          <div className="card p-4 shadow mb-4">
            <h4 className="text-center mb-3">Profil użytkownika</h4>
            {!editProfile ? (
              <>
                <p><strong>Login:</strong> {user.login}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <button
                  className="btn btn-primary w-100"
                  onClick={() => setEditProfile(true)}
                >
                  Edytuj profil
                </button>
              </>
            ) : (
              <form onSubmit={saveProfile}>
                <input
                  className="form-control mb-2"
                  name="login"
                  value={profileForm.login}
                  onChange={handleProfileChange}
                />
                <input
                  className="form-control mb-2"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                />
                <button className="btn btn-success w-100 mb-2">Zapisz</button>
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={() => setEditProfile(false)}
                >
                  Anuluj
                </button>
              </form>
            )}
          </div>

          {/* ADRES */}
          <div className="card p-4 shadow mb-4">
            <h4 className="text-center mb-3">Adres zamieszkania</h4>
            {!editAddress ? (
              <>
                <p>{address.street} {address.houseNumber}</p>
                <p>{address.postalCode} {address.city}</p>
                <p>{address.country}</p>
                <button
                  className="btn btn-primary w-100"
                  onClick={() => setEditAddress(true)}
                >
                  Edytuj adres
                </button>
              </>
            ) : (
              <form onSubmit={saveAddress}>
                <input className="form-control mb-2" name="street" value={addressForm.street} onChange={handleAddressChange} placeholder="Ulica" />
                <input className="form-control mb-2" name="houseNumber" value={addressForm.houseNumber} onChange={handleAddressChange} placeholder="Numer domu" />
                <input className="form-control mb-2" name="postalCode" value={addressForm.postalCode} onChange={handleAddressChange} placeholder="Kod pocztowy" />
                <input className="form-control mb-2" name="city" value={addressForm.city} onChange={handleAddressChange} placeholder="Miasto" />
                <input className="form-control mb-2" name="country" value={addressForm.country} onChange={handleAddressChange} placeholder="Kraj" />
                <button className="btn btn-success w-100 mb-2">Zapisz</button>
                <button type="button" className="btn btn-secondary w-100" onClick={() => setEditAddress(false)}>Anuluj</button>
              </form>
            )}
          </div>

          {/* HASŁO */}
          <div className="card p-4 shadow">
            <h4 className="text-center mb-3">Zmiana hasła</h4>
            {!editPassword ? (
              <button
                className="btn btn-warning w-100"
                onClick={() => setEditPassword(true)}
              >
                Zmień hasło
              </button>
            ) : (
              <form onSubmit={savePassword}>
                <input
                  type="password"
                  className="form-control mb-2"
                  name="password"
                  value={passwordForm.password}
                  placeholder="Nowe hasło"
                  onChange={handlePasswordChange}
                />
                <input
                  type="password"
                  className="form-control mb-2"
                  name="passwordConfirm"
                  value={passwordForm.passwordConfirm}
                  placeholder="Powtórz hasło"
                  onChange={handlePasswordChange}
                />
                <button className="btn btn-success w-100 mb-2">Zapisz hasło</button>
                <button type="button" className="btn btn-secondary w-100" onClick={() => setEditPassword(false)}>Anuluj</button>
              </form>
            )}
          </div>

        </div>

        {/* PRAWA KOLUMNA – HISTORIA */}
        <div className="col-md-8">
          <div className="card p-4 shadow">
            <h4 className="mb-3">Historia zamówień</h4>
            {orders.map(order => (
              <div key={order.id} className="border rounded p-3 mb-3">
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <strong>{order.product}</strong><br />
                  Cena: {order.price}<br />
                  Status: <span className="fw-bold">{order.status}</span>
                </div>
                {expandedOrder === order.id && (
                  <div className="mt-3 bg-light p-3 rounded">
                    <p><strong>Kupujący:</strong> {order.buyer.name}</p>
                    <p><strong>Email:</strong> {order.buyer.email}</p>
                    <p><strong>Adres dostawy:</strong></p>
                    <p>
                      {order.deliveryAddress.street} {order.deliveryAddress.houseNumber}<br />
                      {order.deliveryAddress.postalCode} {order.deliveryAddress.city}<br />
                      {order.deliveryAddress.country}
                    </p>
                  </div>
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
