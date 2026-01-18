import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!login || !password) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: login,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Błąd logowania");
        return;
      }

      //  zapis JWT
      localStorage.setItem("token", data.access_token);

      //  przekierowanie
      navigate("/");
    } catch (err) {
      setError("Brak połączenia z serwerem");
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
                type="text"
                className="form-control mb-3"
                placeholder="Login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />

              <input
                type="password"
                className="form-control mb-3"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button className="btn btn-primary w-100">Zaloguj się</button>
            </form>

            <p className="text-center mt-3 mb-0">
              Login testowy:
              <br />
              <strong>admin / admin</strong>
            </p>

            <p className="text-center mt-3 mb-0">
              Jeszcze nie masz konta?{" "}
              <span
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/register")}
              >
                Zarejestruj się
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
