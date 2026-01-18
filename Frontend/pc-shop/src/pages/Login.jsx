import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Walidacja
    if (!email || !password) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    // FAKE login (na razie)
    if (email === "admin@pcshop.pl" && password === "admin") {
      setError("");
      navigate("/");
    } else {
      setError("Nieprawidłowy email lub hasło");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card p-4 shadow">
            <h3 className="text-center mb-3">Logowanie</h3>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleLogin}>
              <input
                type="email"
                className="form-control mb-3"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                className="form-control mb-3"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button className="btn btn-primary w-100">
                Zaloguj się
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              Login testowy:<br />
              <strong>admin@pcshop.pl / admin</strong>

            </p>
            <p className="text-center mt-3 mb-0">
              jeszcze nie masz kont?
              <span
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/register")}
              >
                rejestruj sie 
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
