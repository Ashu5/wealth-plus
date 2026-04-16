import { useState } from 'react';
import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import './home.css';

function HomeComponent() {
  const [selectedMarket, setSelectedMarket] = useState('US Market');

  return (
    <div className="app-wrapper">
      <Header />
      <main className="main-content">
        <div className="home-container">
          <h1>Home Component</h1>
          
          <section className="market-section">
            {/* Top Gainers Container */}
            <div className="market-card">
              <h2>Top Gainers</h2>
              {/* Add your top gainers content here */}
            </div>

            {/* Top Losers Container */}
            <div className="market-card">
              <h2>Top Losers</h2>
              {/* Add your top losers content here */}
            </div>

            {/* Right Side Card */}
            <div className="right-card">
              {/* Markets Dropdown Container */}
              <div className="info-container">
                <label htmlFor="markets-dropdown" className="container-label">Markets</label>
                <select 
                  id="markets-dropdown"
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="dropdown"
                >
                  <option value="US Market">US Market</option>
                  <option value="Japan">Japan</option>
                  <option value="Indian Market">Indian Market</option>
                </select>
              </div>

              {/* Current Status Container */}
              <div className="info-container">
                <label className="container-label">Current Status</label>
                <div className="status-content">
                  <p className="status-point">• Market is Open</p>
                  <p className="status-point">• Trading Active</p>
                  <p className="status-point">• Volume: High</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomeComponent;