import React from 'react';
// Force cache refresh - enhanced mathematical computation data v2.0
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { WalletProvider } from './contexts/WalletContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Mining from './pages/Mining';
import Research from './pages/Research';
import Validators from './pages/Validators';
import Explorer from './pages/Explorer';
import Wallet from './pages/Wallet';
import MinedToken from './pages/MinedToken';
import About from './pages/About';
import Contact from './pages/Contact';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mining" element={<Mining />} />
                <Route path="/research" element={<Research />} />
                <Route path="/validators" element={<Validators />} />
                <Route path="/explorer" element={<Explorer />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/token" element={<MinedToken />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
