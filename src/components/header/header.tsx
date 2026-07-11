import './header.css';
import logo from '../../assets/logo.svg';
import ProfileComponent from '../profile/profile';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <img src={logo} alt="Wealth Plus Logo" className="header-logo" />
        <ProfileComponent />
      </div>
    </header>
  );
}

export default Header;