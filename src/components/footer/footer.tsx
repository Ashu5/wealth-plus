import './footer.css';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© 2026 Koshmitra.com. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/dashboard" state={{ fromApp: true }}>About</Link>
          <Link to="/contact" state={{ fromApp: true }}>Contact</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;