import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBars, FaTimes, FaWallet, FaSearch, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { web3Service } from '../services/web3Service';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [web3Connected, setWeb3Connected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize Web3 connection status
  useEffect(() => {
    const checkWeb3Connection = async () => {
      try {
        if (web3Service.isWeb3Connected()) {
          setWeb3Connected(true);
          setCurrentAccount(web3Service.getCurrentAccount());
          setCurrentNetwork(web3Service.getCurrentNetwork());
        }
      } catch (error) {
        console.error('Failed to check Web3 connection:', error);
      }
    };

    checkWeb3Connection();

    // Setup listeners for connection changes
    const checkConnection = () => {
      setWeb3Connected(web3Service.isWeb3Connected());
      setCurrentAccount(web3Service.getCurrentAccount());
      setCurrentNetwork(web3Service.getCurrentNetwork());
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/mining', label: 'Mining' },
    { path: '/research', label: 'Research' },
    { path: '/validators', label: 'Validators' },
    { path: '/explorer', label: 'Explorer', icon: <FaSearch /> },
    { path: '/wallet', label: 'Wallet', icon: <FaWallet /> },
    { path: '/token', label: 'MINED Token', icon: '🪙' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-text">ProductiveMiner</span>
          <span className="logo-symbol">$MINED</span>
        </Link>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <motion.div
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={item.path}
                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeMenu}
              >
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                {item.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Web3 Connection Status */}
        <div className="web3-status">
          {web3Connected ? (
            <motion.div
              className="web3-connected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #00b894, #00cec9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                marginRight: '15px'
              }}
            >
              <FaCheckCircle style={{ marginRight: '6px', fontSize: '14px' }} />
              <span>{formatAddress(currentAccount)}</span>
            </motion.div>
          ) : (
            <motion.div
              className="web3-disconnected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                marginRight: '15px'
              }}
            >
              <FaExclamationTriangle style={{ marginRight: '6px', fontSize: '14px' }} />
              <span>Connect Wallet</span>
            </motion.div>
          )}
        </div>

        <div className="navbar-toggle" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
