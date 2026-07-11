import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Dashboard from './components/dashboard/Dashboard.tsx'
import Header from './components/header/header.tsx'
import Footer from './components/footer/footer.tsx'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  //   <Header />
  //   <Dashboard />
  //    <Footer />
  // </StrictMode>,
   <React.StrictMode>
    <App />
  </React.StrictMode>
);
