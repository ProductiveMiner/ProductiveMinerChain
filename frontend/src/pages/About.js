import React from 'react';
import { motion } from 'framer-motion';
import {
  FaRocket,
  FaUsers,
  FaChartLine,
  FaShieldAlt,
  FaBrain,
  FaNetworkWired,
  FaGraduationCap,
  FaCog,
  FaStar,
  FaAward,
  FaLightbulb
} from 'react-icons/fa';
import './About.css';

const About = () => {
  const teamMembers = [
    {
      name: "Sarah",
      role: "Founder",
      description: "Leading the vision for mathematical discovery blockchain technology",
      icon: <FaRocket />,
      expertise: ["Blockchain Architecture", "Mathematical Research", "Strategic Vision"]
    }
  ];

  const milestones = [
    {
      year: 2024,
      title: "Project Genesis",
      description: "ProductiveMiner blockchain concept development and initial mathematical engine design",
      icon: <FaLightbulb />
    },
    {
      year: 2024,
      title: "Core Development",
      description: "Implementation of hybrid consensus mechanism and mathematical computation engines",
      icon: <FaCog />
    },
    {
      year: 2024,
      title: "TestNet Launch",
      description: "Deployment of ProductiveMiner TestNet with initial validators and miners",
      icon: <FaNetworkWired />
    },
    {
      year: 2024,
      title: "Research Repository",
      description: "Launch of mathematical discoveries repository and research collaboration platform",
      icon: <FaBrain />
    },
    {
      year: 2024,
      title: "MainNet Preparation",
      description: "Final preparations for ProductiveMiner MainNet launch with full ecosystem",
      icon: <FaRocket />
    }
  ];

  const values = [
    {
      title: "Mathematical Innovation",
      description: "Pushing the boundaries of computational mathematics through blockchain technology",
      icon: <FaBrain />
    },
    {
      title: "Decentralized Research",
      description: "Democratizing access to mathematical research and computational resources",
      icon: <FaUsers />
    },
    {
      title: "Proof-of-Research",
      description: "Rewarding meaningful mathematical discoveries that advance human knowledge",
      icon: <FaChartLine />
    },
    {
      title: "Quantum Security",
      description: "Implementing quantum-resistant cryptographic protocols for future-proof security",
      icon: <FaShieldAlt />
    }
  ];

  return (
    <div className="about">
      <div className="about-container">
        {/* Header */}
        <motion.div
          className="about-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <h1>About ProductiveMiner</h1>
            <p>The world's first blockchain that rewards mathematical discoveries and computational proofs</p>
          </div>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          className="mission-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2>Our Mission</h2>
          <p>
            ProductiveMiner is revolutionizing the intersection of blockchain technology and mathematical research. 
            We've created a unique ecosystem where computational power is directed toward solving complex mathematical 
            problems, advancing human knowledge while securing a decentralized network through proof-of-research consensus.
          </p>
          <p>
            Our platform combines nine specialized mathematical computation engines with a hybrid consensus mechanism 
            that rewards meaningful discoveries, making mathematical research accessible to everyone while building 
            the most secure and innovative blockchain network.
          </p>
        </motion.div>

        {/* Values Section */}
        <motion.div
          className="values-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>Our Values</h2>
          <div className="values-grid">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="value-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="value-icon">
                  {value.icon}
                </div>
                <div className="value-content">
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          className="team-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2>Our Team</h2>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                className="team-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="member-avatar">
                  {member.icon}
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <p className="member-description">{member.description}</p>
                  <div className="member-expertise">
                    {member.expertise.map((skill, idx) => (
                      <span key={idx} className="expertise-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline Section */}
        <motion.div
          className="timeline-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2>Project Timeline</h2>
          <div className="timeline">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year + milestone.title}
                className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <div className="timeline-content">
                  <div className="timeline-icon">
                    {milestone.icon}
                  </div>
                  <div className="timeline-info">
                    <h3>{milestone.title}</h3>
                    <span className="timeline-year">{milestone.year}</span>
                    <p>{milestone.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technology Section */}
        <motion.div
          className="technology-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2>Our Technology</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <div className="tech-icon">
                <FaNetworkWired />
              </div>
              <div className="tech-content">
                <h3>Hybrid Consensus</h3>
                <p>Combining Proof-of-Work, Proof-of-Stake, and Proof-of-Research for optimal security and efficiency</p>
              </div>
            </div>
            
            <div className="tech-card">
              <div className="tech-icon">
                <FaBrain />
              </div>
              <div className="tech-content">
                <h3>Mathematical Engines</h3>
                <p>Nine specialized computation engines solving complex mathematical problems from Riemann zeros to quantum field theory</p>
              </div>
            </div>
            
            <div className="tech-card">
              <div className="tech-icon">
                <FaShieldAlt />
              </div>
              <div className="tech-content">
                <h3>Quantum Security</h3>
                <p>Quantum-resistant cryptographic protocols ensuring long-term security against future threats</p>
              </div>
            </div>
            
            <div className="tech-card">
              <div className="tech-icon">
                <FaGraduationCap />
              </div>
              <div className="tech-content">
                <h3>Research Repository</h3>
                <p>Decentralized platform for publishing and accessing mathematical discoveries and research papers</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="about-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2>Join the Mathematical Revolution</h2>
          <p>Be part of the future where blockchain technology advances human knowledge through mathematical discovery</p>
          <div className="cta-actions">
            <button className="btn btn-primary">
              <FaRocket /> Start Mining
            </button>
            <button className="btn btn-secondary">
              <FaUsers /> Join Community
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
