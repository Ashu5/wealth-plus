import './header.css';
import logo from '../../assets/logo.svg';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <img src={logo} alt="Wealth Plus Logo" className="header-logo" />
      </div>
    </header>
  );
}

export default Header;