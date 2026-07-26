import { Link, useLocation } from 'react-router-dom';
import './breadcrumb.css';

type Crumb = {
  label: string;
  to: string;
};

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  'my-funds': 'My Funds',
  'my-journey': 'My Journey',
  'fund-transactions': 'Fund Transactions',
  profile: 'Profile',
  contact: 'Contact',
  admin: 'Admin',
};

const formatSegmentLabel = (segment: string) =>
  labelMap[segment] ?? segment.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0 || location.pathname === '/home') {
    return null;
  }

  const crumbs: Crumb[] = pathSegments.map((segment, index) => {
    const to = `/${pathSegments.slice(0, index + 1).join('/')}`;
    return {
      label: formatSegmentLabel(segment),
      to,
    };
  });

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <div className="breadcrumb-content">
        <ol>
          <li>
            <Link to="/dashboard" state={{ fromApp: true }}>Dashboard</Link>
          </li>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;

            if (crumb.to === '/dashboard') {
              return null;
            }

            return (
              <li key={crumb.to}>
                <span className="breadcrumb-separator">/</span>
                {isLast ? (
                  <span className="breadcrumb-current" aria-current="page">{crumb.label}</span>
                ) : (
                  <Link to={crumb.to} state={{ fromApp: true }}>{crumb.label}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumb;
