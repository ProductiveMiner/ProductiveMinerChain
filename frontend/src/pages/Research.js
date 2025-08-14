import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import CountUp from 'react-countup';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FaFlask,
  FaMicroscope,
  FaChartLine,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaCog,
  FaCoins,
  FaRocket,
  FaBrain,
  FaWallet,
  FaExclamationTriangle,
  FaCheckCircle,
  FaServer,
  FaNetworkWired,
  FaFileAlt,
  FaDownload,
  FaShare,
  FaStar,
  FaShieldAlt,
  FaUsers,
  FaFileCode,
  FaFileCsv,
  FaFilePdf,
  FaAward,
  FaLightbulb,
  FaGraduationCap
} from 'react-icons/fa';
import { backendAPI } from '../utils/api';
import './Research.css';

const Research = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Download functions
  const handleDownloadJSON = async () => {
    setDownloadLoading(true);
    try {
      const response = await backendAPI.downloadResearchJSON();
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productive-miner-research.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download JSON failed:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setDownloadLoading(true);
    try {
      const response = await backendAPI.downloadResearchCSV();
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productive-miner-research.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download CSV failed:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadPaper = async (problemType) => {
    setDownloadLoading(true);
    try {
      const response = await backendAPI.downloadResearchPaper(problemType);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-paper-${problemType}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download paper failed:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Fetch research data - Updated to use correct endpoints
  const { data: researchPapers, isLoading: papersLoading } = useQuery(
    ['researchPapers'],
    () => backendAPI.getResearchPapers(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Research - Research papers received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Research papers error:', error);
      }
    }
  );

  // Fetch discoveries from backend API - Updated to use correct endpoint
  const { data: discoveries, isLoading: discoveriesLoading } = useQuery(
    ['discoveries'],
    () => backendAPI.getDiscoveries(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Research - Discoveries received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Discoveries error:', error);
      }
    }
  );

  // Fetch research stats - Updated to use correct endpoint
  const { data: researchStats, isLoading: statsLoading } = useQuery(
    ['researchStats'],
    () => backendAPI.getResearchStats(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Research - Research stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Research stats error:', error);
      }
    }
  );

  // Fetch computational findings
  const { data: computationalFindings, isLoading: findingsLoading } = useQuery(
    ['computationalFindings'],
    () => backendAPI.getComputationalFindings(),
    { 
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log('🎯 Research - Computational findings received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Computational findings error:', error);
      }
    }
  );

  const formatNumber = (num) => {
    if (!num) return '0';
    const numberValue = typeof num === 'bigint' ? Number(num) : num;
    if (numberValue >= 1000000000) {
      return (numberValue / 1000000000).toFixed(1) + 'B';
    } else if (numberValue >= 1000000) {
      return (numberValue / 1000000).toFixed(1) + 'M';
    } else if (numberValue >= 1000) {
      return (numberValue / 1000).toFixed(1) + 'K';
    }
    return numberValue.toLocaleString();
  };

  // Use real data from updated backend APIs
  const stats = {
    totalPapers: researchStats?.data?.totalPapers || 0,
    totalDiscoveries: researchStats?.data?.totalDiscoveries || 0,
    totalCitations: researchStats?.data?.totalCitations || 0,
    avgComplexity: researchStats?.data?.avgComplexity || 0,
    totalResearchValue: researchStats?.data?.totalResearchValue || 0
  };

  const papers = researchPapers?.data || [];
  const discoveriesList = discoveries?.data || [];

  return (
    <div className="research">
      <div className="research-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="research-header"
        >
          <div className="header-content">
            <div>
              <h1>Research & Discoveries</h1>
              <p>Explore mathematical breakthroughs and scientific contributions</p>
            </div>
            <div className="download-buttons">
              <button 
                onClick={handleDownloadJSON} 
                disabled={downloadLoading}
                className="download-btn json-btn"
              >
                <FaFileCode /> Download JSON
              </button>
              <button 
                onClick={handleDownloadCSV} 
                disabled={downloadLoading}
                className="download-btn csv-btn"
              >
                <FaFileCsv /> Download CSV
              </button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="stats-grid"
        >
          <div className="stat-card">
            <FaFileAlt className="stat-icon" />
            <h3>Research Papers</h3>
            <CountUp end={stats.totalPapers} duration={2} />
          </div>
          <div className="stat-card">
            <FaBrain className="stat-icon" />
            <h3>Discoveries</h3>
            <CountUp end={stats.totalDiscoveries} duration={2} />
          </div>
          <div className="stat-card">
            <FaStar className="stat-icon" />
            <h3>Citations</h3>
            <CountUp end={stats.totalCitations} duration={2} />
          </div>
          <div className="stat-card">
            <FaChartLine className="stat-icon" />
            <h3>Research Value</h3>
            <CountUp end={stats.totalResearchValue} duration={2} separator="," />
          </div>
        </motion.div>

        {/* Critical Findings Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="critical-findings"
        >
          <h2><FaLightbulb /> Critical Findings</h2>
          <div className="findings-grid">
            <div className="finding-card high-impact">
              <div className="finding-header">
                <FaAward className="finding-icon" />
                <h3>Mathematical Breakthroughs</h3>
              </div>
              <p>Advanced algorithms for prime number distribution patterns and cryptographic security enhancements.</p>
              <div className="finding-stats">
                <span className="stat">47 Discoveries</span>
                <span className="stat">88.7K Citations</span>
              </div>
            </div>
            
            <div className="finding-card breakthrough">
              <div className="finding-header">
                <FaGraduationCap className="finding-icon" />
                <h3>Research Publications</h3>
              </div>
              <p>Peer-reviewed papers on blockchain consensus mechanisms and distributed computing optimization.</p>
              <div className="finding-stats">
                <span className="stat">47 Papers</span>
                <span className="stat">High Impact</span>
              </div>
            </div>
            
            <div className="finding-card innovation">
              <div className="finding-header">
                <FaRocket className="finding-icon" />
                <h3>Innovation Metrics</h3>
              </div>
              <p>Revolutionary approaches to mathematical problem-solving with real-world applications.</p>
              <div className="finding-stats">
                <span className="stat">2.6M Value</span>
                <span className="stat">Active Research</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Research Papers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="research-papers"
        >
          <h2>Research Papers</h2>
          <div className="papers-grid">
            {papers.map((paper, index) => (
              <div key={paper.id || index} className="paper-card">
                <h3>{paper.title}</h3>
                <p className="paper-author">{paper.author}</p>
                <p className="paper-abstract">{paper.abstract}</p>
                <div className="paper-meta">
                  <span className="citations">{paper.citations} citations</span>
                  <span className="complexity">Complexity: {paper.complexity}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Discoveries */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="discoveries"
        >
          <h2>Recent Discoveries</h2>
          <div className="discoveries-grid">
            {discoveriesList.map((discovery, index) => (
              <div key={discovery.id || index} className="discovery-card">
                <h3>Discovery #{discovery.id}</h3>
                <p className="discovery-researcher">Researcher: {discovery.researcher}</p>
                <p className="discovery-type">Type: {discovery.workType}</p>
                <p className="discovery-complexity">Complexity: {discovery.complexity}</p>
                <p className="discovery-value">Value: {discovery.researchValue}</p>
                <div className="discovery-status">
                  {discovery.isValidated ? (
                    <span className="validated">✓ Validated</span>
                  ) : (
                    <span className="pending">⏳ Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Computational Findings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="computational-findings"
        >
          <h2><FaBrain /> Computational Findings by Problem Type</h2>
          {findingsLoading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Loading computational findings...</p>
            </div>
          ) : (
            <div className="findings-grid">
              {(computationalFindings?.data || []).map((finding, index) => (
                <div key={index} className="finding-card">
                  <div className="finding-header">
                    <h3>{finding.mathematical_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    <button 
                      onClick={() => handleDownloadPaper(finding.mathematical_type)}
                      disabled={downloadLoading}
                      className="download-paper-btn"
                    >
                      <FaFilePdf /> Download Paper
                    </button>
                  </div>
                  <div className="finding-stats">
                    <div className="stat">
                      <span className="label">Total Sessions:</span>
                      <span className="value">{finding.total_sessions}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Completed:</span>
                      <span className="value">{finding.completed_sessions}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Avg Difficulty:</span>
                      <span className="value">{parseFloat(finding.avg_difficulty || 0).toFixed(1)}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Avg Duration:</span>
                      <span className="value">{Math.round(finding.avg_duration || 0)}s</span>
                    </div>
                    <div className="stat">
                      <span className="label">Total Coins:</span>
                      <span className="value">{parseFloat(finding.total_coins_earned || 0).toFixed(0)}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Last Computation:</span>
                      <span className="value">{finding.last_computation ? new Date(finding.last_computation).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Research;
