import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {
  const [isLogged, setIsLogged] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLogged(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLogged(false);
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">PC-Shop</Link>

        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/">Sklep</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/configurator">Konfigurator</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/cart">Koszyk</Link>
          </li>

          {isLogged && (
            <li className="nav-item">
              <Link className="nav-link" to="/profile">Profil</Link>
            </li>
          )}

          {!isLogged ? (
            <li className="nav-item">
              <Link className="nav-link" to="/login">Logowanie</Link>
            </li>
          ) : (
            <li className="nav-item">
              <button
                className="btn btn-outline-light ms-2"
                onClick={handleLogout}
              >
                Wyloguj
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
