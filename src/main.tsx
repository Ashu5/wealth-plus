import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Dashboard from './components/dashboard/dashboard.tsx'
import Header from './components/header/header.tsx'
import Footer from './components/footer/footer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Header />
    <Dashboard />
     <Footer />
  </StrictMode>,
)
