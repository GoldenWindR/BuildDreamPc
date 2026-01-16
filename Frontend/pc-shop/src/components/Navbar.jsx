import { Link } from "react-router-dom";

function Navbar() {
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
          <li className="nav-item">
            <Link className="nav-link" to="/login">Logowanie</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
