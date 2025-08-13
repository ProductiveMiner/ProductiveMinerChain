import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Mining from './pages/Mining';
import Research from './pages/Research';
import Validators from './pages/Validators';
import Wallet from './pages/Wallet';
import Explorer from './pages/Explorer';
import About from './pages/About';
import Contact from './pages/Contact';
import MinedToken from './pages/MinedToken';

// Create a client with retry configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 429 (rate limit) errors
        if (error?.response?.status === 429) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 20 * 60 * 1000, // 20 minutes
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnReconnect: false, // Disable refetch on reconnect
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mining" element={<Mining />} />
              <Route path="/research" element={<Research />} />
              <Route path="/validators" element={<Validators />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/explorer" element={<Explorer />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/token" element={<MinedToken />} />
            </Routes>
          </AnimatePresence>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
