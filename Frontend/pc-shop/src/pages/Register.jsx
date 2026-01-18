import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [login, setLogin] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Walidacja
    if (!login || !firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są takie same");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          login: login,
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Błąd rejestracji");
        return;
      }

      setSuccess("Rejestracja zakończona sukcesem!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      setError("Brak połączenia z serwerem");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card p-4 shadow">
            <h3 className="text-center mb-3">Rejestracja</h3>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleRegister}>
              <input
                className="form-control mb-3"
                placeholder="Login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />

              <input
                className="form-control mb-3"
                placeholder="Imię"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <input
                className="form-control mb-3"
                placeholder="Nazwisko"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

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

              <input
                type="password"
                className="form-control mb-3"
                placeholder="Powtórz hasło"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button className="btn btn-primary w-100">
                Zarejestruj się
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              Masz już konto?{" "}
              <span
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/login")}
              >
                Zaloguj się
              </span>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
