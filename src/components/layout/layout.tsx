import type { ReactNode } from 'react';
import Header from '../header/header';
import Footer from '../footer/footer';
import './layout.css';

type LayoutProps = {
  children: ReactNode;
};

function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-content">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;