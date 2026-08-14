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
  'my-reports': 'My Reports',
  'e-wallet': 'eWallet',
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

  const currentCrumb = crumbs[crumbs.length - 1];

  if (!currentCrumb || currentCrumb.to === '/dashboard') {
    return null;
  }

  return (
    <nav className="breadcrumb" aria-label="Page context">
      <div className="breadcrumb-content">
        <Link className="breadcrumb-back" to="/dashboard" state={{ fromApp: true }}>
          <span aria-hidden="true">&#8592;</span>
          <span>Back to Dashboard</span>
        </Link>
        <span className="breadcrumb-current" aria-current="page">{currentCrumb.label}</span>
      </div>
    </nav>
  );
};

export default Breadcrumb;
