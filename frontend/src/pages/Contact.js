import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from 'react-query';
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTwitter,
  FaGithub,
  FaDiscord,
  FaTelegram,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { backendAPI } from '../utils/api';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('idle'); // idle, loading, success, error

  // Submit contact form mutation
  const submitFormMutation = useMutation(
    (formData) => backendAPI.submitContactForm(formData),
    {
      onSuccess: () => {
        setFormStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setFormStatus('idle'), 3000);
      },
      onError: (error) => {
        setFormStatus('error');
        setTimeout(() => setFormStatus('idle'), 3000);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 3000);
      return;
    }
    
    setFormStatus('loading');
    submitFormMutation.mutate(formData);
  };

  const contactInfo = {
    email: 'admin@productiveminer.org',
    phone: '+1 (555) 123-4567',
    address: '123 Blockchain Street, Crypto City, CC 12345',
    social: {
      twitter: 'https://twitter.com/ProductiveMiner',
      github: 'https://github.com/ProductiveMiner',
      discord: 'https://discord.gg/productiveminer',
      telegram: 'https://t.me/ProductiveMiner'
    }
  };

  const supportTopics = [
    {
      title: 'Technical Support',
      description: 'Get help with mining setup, wallet configuration, and technical issues',
      icon: '🔧'
    },
    {
      title: 'Mathematical Research',
      description: 'Questions about mathematical engines, algorithms, and research collaboration',
      icon: '🧮'
    },
    {
      title: 'Staking & Validation',
      description: 'Information about becoming a validator and staking rewards',
      icon: '💰'
    },
    {
      title: 'Partnership & Business',
      description: 'Business partnerships, integrations, and enterprise solutions',
      icon: '🤝'
    }
  ];

  return (
    <div className="contact">
      <div className="contact-container">
        {/* Header */}
        <motion.div
          className="contact-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1>Contact Us</h1>
            <p>Get in touch with the ProductiveMiner team for support, partnerships, or general inquiries</p>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          className="contact-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <FaEnvelope />
              </div>
              <div className="info-content">
                <h3>Email</h3>
                <p>{contactInfo.email}</p>
                <span className="info-description">General inquiries and support</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaPhone />
              </div>
              <div className="info-content">
                <h3>Phone</h3>
                <p>{contactInfo.phone}</p>
                <span className="info-description">Business hours: 9AM-6PM EST</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="info-content">
                <h3>Address</h3>
                <p>{contactInfo.address}</p>
                <span className="info-description">Headquarters location</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Information */}
        <motion.div
          className="team-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h3>Our Team</h3>
          <div className="team-member">
            <div className="member-info">
              <h4>Sarah</h4>
              <p className="member-title">Founder</p>
              <p className="member-description">Leading the vision for mathematical discovery blockchain technology</p>
            </div>
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div
          className="social-links"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Connect With Us</h3>
          <div className="social-grid">
            <a href={contactInfo.social.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
              <FaTwitter />
              <span>Twitter</span>
            </a>
            <a href={contactInfo.social.github} target="_blank" rel="noopener noreferrer" className="social-link">
              <FaGithub />
              <span>GitHub</span>
            </a>
            <a href={contactInfo.social.discord} target="_blank" rel="noopener noreferrer" className="social-link">
              <FaDiscord />
              <span>Discord</span>
            </a>
            <a href={contactInfo.social.telegram} target="_blank" rel="noopener noreferrer" className="social-link">
              <FaTelegram />
              <span>Telegram</span>
            </a>
          </div>
        </motion.div>

        {/* Support Topics */}
        <motion.div
          className="support-topics"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>How Can We Help?</h3>
          <div className="topics-grid">
            {supportTopics.map((topic, index) => (
              <motion.div
                key={index}
                className="topic-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="topic-icon">{topic.icon}</div>
                <div className="topic-content">
                  <h4>{topic.title}</h4>
                  <p>{topic.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          className="contact-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="form-container">
            <h3>Send us a Message</h3>
            <form onSubmit={handleSubmit} className="contact-form-element">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="What is this regarding?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Please describe your inquiry in detail..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className={`submit-btn ${formStatus === 'loading' ? 'loading' : ''}`}
                  disabled={formStatus === 'loading'}
                >
                  {formStatus === 'loading' ? (
                    <>
                      <div className="spinner"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Send Message
                    </>
                  )}
                </button>

                {formStatus === 'success' && (
                  <div className="status-message success">
                    <FaCheckCircle />
                    Message sent successfully! We'll get back to you soon.
                  </div>
                )}

                {formStatus === 'error' && (
                  <div className="status-message error">
                    <FaTimesCircle />
                    {submitFormMutation.error?.message || 'Failed to send message. Please try again.'}
                  </div>
                )}
              </div>
            </form>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="faq-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3>Frequently Asked Questions</h3>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>How do I start mining on ProductiveMiner?</h4>
              <p>Download our mining software, configure your mathematical engine preferences, and start contributing to mathematical discoveries while earning MINED tokens.</p>
            </div>
            
            <div className="faq-item">
              <h4>What are the minimum requirements for becoming a validator?</h4>
              <p>You need at least 100,000 MINED tokens, 99%+ uptime, reliable server infrastructure, and community approval.</p>
            </div>
            
            <div className="faq-item">
              <h4>How are mathematical discoveries rewarded?</h4>
              <p>Discoveries are evaluated based on complexity, novelty, and impact. Rewards are distributed in MINED tokens and contribute to the network's research value.</p>
            </div>
            
            <div className="faq-item">
              <h4>Can I contribute to mathematical research without mining?</h4>
              <p>Yes! You can submit research papers, propose new mathematical problems, or collaborate with existing researchers through our research repository.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
