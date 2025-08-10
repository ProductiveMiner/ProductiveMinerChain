import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTwitter, FaLinkedin, FaGithub, FaEnvelope, FaGlobe } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Mining', path: '/mining' },
      { name: 'Research', path: '/research' },
      { name: 'Validators', path: '/validators' }
    ],
    company: [
      { name: 'About', path: '/about' },
      { name: 'Contact', path: '/contact' },
      { name: 'Careers', path: '/careers' },
      { name: 'Press', path: '/press' }
    ],
    resources: [
      { name: 'Documentation', path: '/docs' },
      { name: 'API Reference', path: '/api' },
      { name: 'Whitepaper', path: '/whitepaper' },
      { name: 'Blog', path: '/blog' }
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' },
      { name: 'Security', path: '/security' }
    ]
  };

  const socialLinks = [
    {
      icon: <FaTwitter />,
      name: 'Twitter',
      url: 'https://twitter.com/productiveminer'
    },
    {
      icon: <FaLinkedin />,
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/productiveminer'
    },
    {
      icon: <FaGithub />,
      name: 'GitHub',
      url: 'https://github.com/productiveminer'
    },
    {
      icon: <FaEnvelope />,
      name: 'Email',
      url: 'mailto:contact@productiveminer.org'
    }
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Company Info */}
          <motion.div
            className="footer-section company-info"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="footer-logo">
              <h3>ProductiveMiner</h3>
              <span className="logo-symbol">$MINED</span>
            </div>
            <p className="company-description">
              Revolutionizing blockchain through mathematical discovery and proof-of-research consensus.
            </p>
            <div className="social-links">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Footer Links */}
          <div className="footer-links">
            {Object.entries(footerLinks).map(([category, links]) => (
              <motion.div
                key={category}
                className="footer-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="footer-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                <ul className="footer-link-list">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link to={link.path} className="footer-link">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <motion.div
          className="newsletter-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3>Stay Updated</h3>
          <p>Get the latest updates on mathematical discoveries and platform developments</p>
          <div className="newsletter-form">
            <input
              type="email"
              id="newsletter-email"
              name="newsletterEmail"
              placeholder="Enter your email address"
              className="newsletter-input"
            />
            <button className="btn btn-primary">
              Subscribe
            </button>
          </div>
        </motion.div>

        {/* Footer Bottom */}
        <motion.div
          className="footer-bottom"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} ProductiveMiner. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy" className="footer-bottom-link">Privacy</Link>
              <Link to="/terms" className="footer-bottom-link">Terms</Link>
              <Link to="/cookies" className="footer-bottom-link">Cookies</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
