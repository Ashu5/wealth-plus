import './header.css';
import logo from '../../assets/logo.svg';
import ProfileComponent from '../profile/profile';
import { Link, useLocation } from 'react-router-dom';

type BreadcrumbItem = {
  label: string;
  path: string;
};

function Header() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = pathSegments.reduce<BreadcrumbItem[]>(
    (items, segment, index) => {
      const isHomeSegment = segment.toLowerCase() === 'home';
      const segmentPath = `/${pathSegments.slice(0, index + 1).join('/')}`;

      if (isHomeSegment) {
        return [...items, { label: 'Home', path: '/home' }];
      }

      const label = segment
        .split('-')
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(' ');

      return [...items, { label, path: segmentPath }];
    },
    [{ label: 'Home', path: '/home' }]
  );

  const uniqueBreadcrumbs = breadcrumbs.filter(
    (crumb, index, list) => list.findIndex((item) => item.path === crumb.path) === index
  );

  return (
    <header className="header">
      <div className="header-content">
        <nav className="header-breadcrumb" aria-label="Breadcrumb">
          <ol className="header-breadcrumb-list">
            {uniqueBreadcrumbs.map((crumb, index) => {
              const isCurrentPage = index === uniqueBreadcrumbs.length - 1;

              return (
                <li key={crumb.path} className="header-breadcrumb-item">
                  {isCurrentPage ? (
                    <span className="header-breadcrumb-current">{crumb.label}</span>
                  ) : (
                    <Link className="header-breadcrumb-link" to={crumb.path}>
                      {crumb.label}
                    </Link>
                  )}

                  {!isCurrentPage && <span className="header-breadcrumb-separator">/</span>}
                </li>
              );
            })}
          </ol>
        </nav>
        <img src={logo} alt="Wealth Plus Logo" className="header-logo" />
        <ProfileComponent />
      </div>
    </header>
  );
}

export default Header;