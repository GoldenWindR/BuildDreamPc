import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();

    // Walidacja
    if (!email || !password || !confirmPassword) {
      setError("Wszystkie pola są wymagane");
      setSuccess("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są takie same");
      setSuccess("");
      return;
    }

    // FAKE rejestracja
    setError("");
    setSuccess("Rejestracja zakończona sukcesem!");

    // Symulacja przekierowania na login
    setTimeout(() => {
      navigate("/login");
    }, 1500);
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
              Masz już konto? <br />
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
