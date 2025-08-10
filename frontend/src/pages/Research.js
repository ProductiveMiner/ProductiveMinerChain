import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import {
  FaDownload,
  FaFileAlt,
  FaDatabase,
  FaChartLine,
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUnlock,
  FaCog,
  FaHistory,
  FaRocket,
  FaGraduationCap,
  FaCode,
  FaCloud,
  FaShieldAlt,
  FaCoins,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';
import { backendAPI, flowAPI } from '../utils/api';
import './Research.css';

const Research = () => {
  const [activeTab, setActiveTab] = useState('papers');
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [accessTier, setAccessTier] = useState('premium');
  const [showFormatDetails, setShowFormatDetails] = useState(false);
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);

  // Fetch research papers from backend
  const { data: researchPapers, isLoading: papersLoading } = useQuery(
    ['researchPapers'],
    () => backendAPI.getResearchPapers(),
    { 
      refetchInterval: false, // Disabled for debugging
      onSuccess: (data) => {
        console.log('🎯 Research - Research papers received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Research papers error:', error);
      }
    }
  );

  // Fetch mathematical discoveries from backend
  const { data: discoveries, isLoading: discoveriesLoading } = useQuery(
    ['discoveries'],
    () => backendAPI.getDiscoveries(),
    { 
      refetchInterval: false, // Disabled for debugging
      onSuccess: (data) => {
        console.log('🎯 Research - Discoveries received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Discoveries error:', error);
      }
    }
  );

  // Fetch research statistics from backend
  const { data: researchStats, isLoading: statsLoading } = useQuery(
    ['researchStats'],
    () => backendAPI.getResearchStats(),
    { 
      refetchInterval: false, // Disabled for debugging
      onSuccess: (data) => {
        console.log('🎯 Research - Research stats received:', data);
      },
      onError: (error) => {
        console.error('❌ Research - Research stats error:', error);
      }
    }
  );

  // Download mutation: expect server to return file data with content-disposition, so trigger browser download
  const downloadMutation = useMutation(
    async (data) => {
      // Use the same endpoint but request blob for direct download
      const response = await fetch('/api/research/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      // Try to read filename from content-disposition
      const disposition = response.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match ? match[1] : `research-${data?.format || 'json'}.dat`;
      return { blob, filename };
    },
    {
      onSuccess: ({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      },
      onError: (error) => {
        console.error('Download failed:', error);
      }
    }
  );

  const handleDownload = (format, discoveryId = null) => {
    downloadMutation.mutate({
      format,
      discoveryId,
      accessTier
    });
  };

  const handleAccessTierChange = (tier) => {
    setAccessTier(tier);
  };

  const getFormatDetails = (format) => {
    const details = formatOptions.find(f => f.id === format);
    return details || formatOptions[0];
  };

  const formatOptions = [
    {
      id: 'json',
      name: 'JSON',
      description: 'Structured data format for API integration and data processing',
      useCase: 'API development, data analysis, web applications',
      codeExample: `{
  "discovery": {
    "id": "riemann-zero-001",
    "type": "Riemann Zeros",
    "complexity": "Ultra-Extreme",
    "value": 50000,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`,
      features: ['Human readable', 'API compatible', 'Schema validation']
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Comma-separated values for spreadsheet analysis and data import',
      useCase: 'Excel analysis, data visualization, statistical modeling',
      codeExample: `discovery_id,type,complexity,value,timestamp
riemann-zero-001,Riemann Zeros,Ultra-Extreme,50000,2024-01-15T10:30:00Z
yang-mills-002,Yang-Mills Theory,Ultra-Extreme,45000,2024-01-15T11:15:00Z`,
      features: ['Spreadsheet compatible', 'Lightweight', 'Easy parsing']
    },
    {
      id: 'latex',
      name: 'LaTeX',
      description: 'Mathematical notation for academic papers and research publications',
      useCase: 'Academic publishing, mathematical documentation, research papers',
      codeExample: `\\begin{equation}
\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s}
\\end{equation}

\\begin{theorem}
The Riemann zeta function has non-trivial zeros at $s = \\frac{1}{2} + it$.
\\end{theorem}`,
      features: ['Mathematical notation', 'Academic standard', 'Publication ready']
    },
    {
      id: 'solidity',
      name: 'Solidity',
      description: 'Smart contract code for blockchain integration and verification',
      useCase: 'Blockchain development, smart contracts, decentralized applications',
      codeExample: `contract MathematicalDiscovery {
    struct Discovery {
        string id;
        string discoveryType;
        uint256 complexity;
        uint256 value;
        uint256 timestamp;
    }
    
    mapping(string => Discovery) public discoveries;
    
    function addDiscovery(string memory _id, string memory _type, uint256 _complexity) public {
        discoveries[_id] = Discovery(_id, _type, _complexity, 0, block.timestamp);
    }
}`,
      features: ['Blockchain compatible', 'Smart contract ready', 'Ethereum standard']
    },
    {
      id: 'mathml',
      name: 'MathML',
      description: 'Mathematical markup language for web display and accessibility',
      useCase: 'Web applications, accessibility, mathematical web content',
      codeExample: `<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mrow>
    <mi>ζ</mi>
    <mo>(</mo>
    <mi>s</mi>
    <mo>)</mo>
    <mo>=</mo>
    <munderover>
      <mo>∑</mo>
      <mrow><mi>n</mi><mo>=</mo><mn>1</mn></mrow>
      <mo>∞</mo>
    </munderover>
    <mfrac>
      <mn>1</mn>
      <msup><mi>n</mi><mi>s</mi></msup>
    </mfrac>
  </mrow>
</math>`,
      features: ['Web accessible', 'Screen reader friendly', 'Mathematical markup']
    },
    {
      id: 'ipfs',
      name: 'IPFS',
      description: 'Decentralized storage format for distributed research data',
      useCase: 'Decentralized storage, content addressing, distributed research',
      codeExample: `{
  "discovery": {
    "id": "riemann-zero-001",
    "ipfs_hash": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    "metadata": {
      "type": "Riemann Zeros",
      "complexity": "Ultra-Extreme",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}`,
      features: ['Decentralized storage', 'Content addressing', 'Immutable data']
    },
    {
      id: 'hdf5',
      name: 'HDF5',
      description: 'Hierarchical data format for large-scale scientific datasets',
      useCase: 'Scientific computing, big data analysis, machine learning',
      codeExample: `import h5py

with h5py.File('discoveries.h5', 'w') as f:
    discovery_group = f.create_group('discoveries')
    discovery_group.attrs['total_count'] = 1250
    discovery_group.attrs['total_value'] = 4660000
    
    # Store discovery data
    discovery_data = discovery_group.create_dataset('riemann_zeros', data=discovery_array)`,
      features: ['Large datasets', 'Scientific computing', 'Hierarchical structure']
    },
    {
      id: 'ndjson',
      name: 'NDJSON',
      description: 'Newline-delimited JSON for streaming and real-time processing',
      useCase: 'Real-time processing, streaming analytics, log processing',
      codeExample: `{"id": "riemann-zero-001", "type": "Riemann Zeros", "complexity": "Ultra-Extreme", "value": 50000}
{"id": "yang-mills-002", "type": "Yang-Mills Theory", "complexity": "Ultra-Extreme", "value": 45000}
{"id": "goldbach-003", "type": "Goldbach Conjecture", "complexity": "Extreme", "value": 38000}`,
      features: ['Streaming compatible', 'Real-time processing', 'Line-by-line parsing']
    }
  ];

  const accessTiers = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'Free',
      features: [
        'Access to public research papers',
        'Basic mathematical discoveries',
        'JSON and CSV downloads',
        'Community support'
      ],
      limits: [
        'Limited to 10 downloads per day',
        'No access to premium discoveries',
        'No API access'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$29/month',
      features: [
        'All research papers and discoveries',
        'All download formats',
        'API access',
        'Priority support',
        'Advanced analytics'
      ],
      limits: [
        '100 downloads per day',
        'No commercial use'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      features: [
        'Unlimited access to all content',
        'Custom data formats',
        'Dedicated API endpoints',
        'White-label solutions',
        'Commercial licensing',
        'Dedicated support team'
      ],
      limits: [
        'Unlimited downloads',
        'Custom integrations available'
      ]
    }
  ];

  // Real data from API or fallback
  const papersList = researchPapers?.papers || [
    {
      id: 'paper-001',
      title: 'Advanced Riemann Zeta Function Analysis',
      authors: ['Validator-0xMiner1', 'ProductiveMiner Research Team'],
      abstract: 'Novel approach to computing non-trivial zeros of the Riemann zeta function using quantum-inspired algorithms...',
      publicationDate: '2025-08-07',
      complexity: 'Ultra-Extreme',
      researchValue: 50000,
      downloads: 1250,
      citations: 45,
      format: 'PDF',
      size: '2.4 MB'
    },
    {
      id: 'paper-002',
      title: 'Yang-Mills Field Theory Solutions',
      authors: ['Miner-0xValidator2', 'ProductiveMiner Research Team'],
      abstract: 'Breakthrough solutions to Yang-Mills field equations with applications to quantum chromodynamics...',
      publicationDate: '2025-08-05',
      complexity: 'Ultra-Extreme',
      researchValue: 45000,
      downloads: 980,
      citations: 32,
      format: 'PDF',
      size: '3.1 MB'
    }
  ];

  const discoveriesList = discoveries?.discoveries || [
    {
      id: 'discovery-001',
      workType: 'Riemann Zeros',
      complexity: 'Ultra-Extreme',
      researchValue: 50000,
      validationScore: 98.5,
      impactScore: 95.2,
      status: 'verified',
      timestamp: '2025-08-07T10:30:00Z',
      discoverer: 'Validator-0xMiner1',
      description: 'Computed 1,000,000th non-trivial zero of Riemann zeta function'
    },
    {
      id: 'discovery-002',
      workType: 'Yang-Mills Theory',
      complexity: 'Ultra-Extreme',
      researchValue: 45000,
      validationScore: 97.8,
      impactScore: 92.1,
      status: 'verified',
      timestamp: '2025-08-05T09:15:00Z',
      discoverer: 'Miner-0xValidator2',
      description: 'Solved Yang-Mills field equations for specific boundary conditions'
    }
  ];

  const stats = researchStats || {
    totalPapers: 1250,
    totalDiscoveries: 2847,
    totalDownloads: 156000,
    totalCitations: 8900,
    averageComplexity: 'Extreme',
    totalResearchValue: 4660000,
    activeResearchers: 156,
    averageValidationScore: 96.8
  };

  const tabs = [
    { id: 'papers', label: 'Research Papers', icon: <FaFileAlt /> },
    { id: 'discoveries', label: 'Mathematical Discoveries', icon: <FaRocket /> },
    { id: 'formats', label: 'Download Formats', icon: <FaDownload /> },
    { id: 'statistics', label: 'Research Statistics', icon: <FaChartLine /> }
  ];

  return (
    <div className="research">
      <div className="research-container">
        {/* Header */}
        <motion.div
          className="research-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <div className="logo-section">
              <div className="logo">
                <div className="logo-icon">🔨</div>
              </div>
              <div className="header-text">
                <h1>ProductiveMiner Research Repository</h1>
                <p>Access mathematical discoveries, research papers, and computational proofs</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Simple Viewer Modal */}
        {selectedDiscovery && (
          <div className="viewer-modal-overlay" onClick={() => setSelectedDiscovery(null)}>
            <div className="viewer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="viewer-header">
                <h3>{selectedDiscovery.title || selectedDiscovery.id || 'Details'}</h3>
                <button className="close-btn" onClick={() => setSelectedDiscovery(null)}>×</button>
              </div>
              <div className="viewer-content">
                <div className="viewer-row"><strong>ID:</strong> {selectedDiscovery.id ?? '—'}</div>
                <div className="viewer-row"><strong>Type:</strong> {selectedDiscovery.workType || selectedDiscovery.engine || selectedDiscovery.category || '—'}</div>
                <div className="viewer-row"><strong>Complexity:</strong> {selectedDiscovery.complexity || '—'}</div>
                <div className="viewer-row"><strong>Value:</strong> {(selectedDiscovery.researchValue ?? selectedDiscovery.reward ?? 0).toLocaleString()} MINED</div>
                <div className="viewer-row"><strong>Discoverer/Authors:</strong> {selectedDiscovery.discoverer || (Array.isArray(selectedDiscovery.authors) ? selectedDiscovery.authors.join(', ') : '—')}</div>
                <div className="viewer-row"><strong>Timestamp/Date:</strong> {selectedDiscovery.timestamp || selectedDiscovery.publicationDate || selectedDiscovery.date || '—'}</div>
                {selectedDiscovery.description && (
                  <div className="viewer-row"><strong>Description:</strong> {selectedDiscovery.description}</div>
                )}
                {selectedDiscovery.abstract && (
                  <div className="viewer-row"><strong>Abstract:</strong> {selectedDiscovery.abstract}</div>
                )}
              </div>
              <div className="viewer-actions">
                <button className="action-btn primary" onClick={() => handleDownload(selectedFormat || 'json', selectedDiscovery.id || selectedDiscovery.title)}>
                  <FaDownload /> Download
                </button>
                <button className="action-btn" onClick={() => setSelectedDiscovery(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Access Tier Selection */}
        <motion.div
          className="access-tier-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3>Choose Your Access Tier</h3>
          <div className="tier-cards">
            {accessTiers.map((tier) => (
              <motion.div
                key={tier.id}
                className={`tier-card ${accessTier === tier.id ? 'selected' : ''}`}
                onClick={() => handleAccessTierChange(tier.id)}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="tier-header">
                  <h4>{tier.name}</h4>
                  <div className="tier-price">{tier.price}</div>
                </div>
                <div className="tier-features">
                  <h5>Features:</h5>
                  <ul>
                    {tier.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="tier-limits">
                  <h5>Limits:</h5>
                  <ul>
                    {tier.limits.map((limit, index) => (
                      <li key={index}>{limit}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="tab-navigation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          className="tab-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Research Papers Tab */}
          {activeTab === 'papers' && (
            <div className="papers-tab">
              <div className="section-header">
                <h3>Research Papers</h3>
                <div className="section-controls">
                  <button className="control-btn" onClick={() => console.log('Search papers clicked')}>
                    <FaSearch /> Search
                  </button>
                  <button className="control-btn" onClick={() => console.log('Filter papers clicked')}>
                    <FaFilter /> Filter
                  </button>
                  <button className="control-btn" onClick={() => console.log('Sort papers clicked')}>
                    <FaSort /> Sort
                  </button>
                </div>
              </div>
              
              <div className="papers-grid">
                {papersList.map((paper, index) => (
                  <motion.div
                    key={paper.id}
                    className="paper-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <div className="paper-header">
                      <h4>{paper.title}</h4>
                      <div className="paper-meta">
                        <span className="authors">{paper.authors.join(', ')}</span>
                        <span className="date">{paper.publicationDate}</span>
                      </div>
                    </div>
                    
                    <div className="paper-abstract">
                      <p>{paper.abstract}</p>
                    </div>
                    
                    <div className="paper-stats">
                      <div className="stat">
                        <span className="label">Complexity:</span>
                        <span className="value">{paper.complexity}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Value:</span>
                        <span className="value">{(() => {
                          const value = (paper?.researchValue || paper?.funding || 0) || 0;
                          return typeof value === 'number' ? value.toLocaleString() : '0';
                        })()} MINED</span>
                      </div>
                      <div className="stat">
                        <span className="label">Complexity:</span>
                        <span className="value">{paper.complexity || paper.category || 'Unknown'}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Citations:</span>
                        <span className="value">{paper.citations || 0}</span>
                      </div>
                    </div>
                    
                    <div className="paper-actions">
                      <button className="action-btn primary" onClick={() => handleDownload(selectedFormat || 'json', paper.id)}>
                        <FaDownload /> Download
                      </button>
                      <button className="action-btn secondary" onClick={() => setSelectedDiscovery(paper)}>
                        <FaEye /> View
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Mathematical Discoveries Tab */}
          {activeTab === 'discoveries' && (
            <div className="discoveries-tab">
              <div className="section-header">
                <h3>Mathematical Discoveries</h3>
                <div className="section-controls">
                  <button className="control-btn" onClick={() => console.log('Search discoveries clicked')}>
                    <FaSearch /> Search
                  </button>
                  <button className="control-btn" onClick={() => console.log('Filter discoveries clicked')}>
                    <FaFilter /> Filter
                  </button>
                  <button className="control-btn" onClick={() => console.log('Sort discoveries clicked')}>
                    <FaSort /> Sort
                  </button>
                </div>
              </div>
              
              <div className="discoveries-table">
                <table>
                  <thead>
                    <tr>
                      <th>Discovery ID</th>
                      <th>Work Type</th>
                      <th>Complexity</th>
                      <th>Research Value</th>
                      <th>Validation Score</th>
                      <th>Impact Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discoveriesList.map((discovery, index) => (
                      <tr key={discovery.id} className="discovery-row">
                        <td className="discovery-id">{discovery.id}</td>
                        <td className="work-type">{discovery.workType || discovery.engine || 'Unknown'}</td>
                        <td className="complexity">{discovery.complexity || 'Unknown'}</td>
                        <td className="research-value">{(() => {
                          const value = (discovery?.researchValue || discovery?.reward || 0) || 0;
                          return typeof value === 'number' ? value.toLocaleString() : '0';
                        })()} MINED</td>
                        <td className="validation-score">
                          {(() => {
                            const score = discovery.validationScore || discovery.validation_score || 0;
                            return typeof score === 'number' ? `${score.toFixed(1)}%` : '0%';
                          })()}
                        </td>
                        <td className="impact-score">
                          {(() => {
                            const score = discovery.impactScore || discovery.impact_score || 0;
                            return typeof score === 'number' ? `${score.toFixed(1)}%` : '0%';
                          })()}
                        </td>
                        <td className="status">
                          <span className={`status-badge ${discovery.status || discovery.verification || 'unknown'}`}>
                            {(discovery.status || discovery.verification) === 'verified' ? <FaCheckCircle /> : <FaTimesCircle />}
                            {discovery.status || discovery.verification || 'unknown'}
                          </span>
                        </td>
                        <td className="discovery-actions">
                          <button className="action-btn small" onClick={() => handleDownload(selectedFormat || 'json', discovery.id)}>
                            <FaDownload />
                          </button>
                          <button className="action-btn small" onClick={() => setSelectedDiscovery(discovery)}>
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Download Formats Tab */}
          {activeTab === 'formats' && (
            <div className="formats-tab">
              <div className="format-selection">
                <h3>Download Formats</h3>
                <p>Choose the format that best suits your needs for data analysis, integration, or research</p>
                
                <div className="format-grid">
                  {formatOptions.map((format, index) => (
                    <motion.div
                      key={format.id}
                      className={`format-card ${selectedFormat === format.id ? 'selected' : ''}`}
                      onClick={() => setSelectedFormat(format.id)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <div className="format-icon">
                        <FaFileAlt />
                      </div>
                      <div className="format-info">
                        <h4>{format.name}</h4>
                        <p>{format.description}</p>
                        <div className="format-features">
                          {format.features.map((feature, idx) => (
                            <span key={idx} className="feature-tag">{feature}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="format-details">
                  <div className="details-header">
                    <h4>Format Details: {getFormatDetails(selectedFormat).name}</h4>
                    <button
                      className="toggle-btn"
                      onClick={() => setShowFormatDetails(!showFormatDetails)}
                    >
                      {showFormatDetails ? <FaEyeSlash /> : <FaEye />}
                      {showFormatDetails ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                  
                  {showFormatDetails && (
                    <div className="details-content">
                      <div className="detail-section">
                        <h5>Use Case</h5>
                        <p>{getFormatDetails(selectedFormat).useCase}</p>
                      </div>
                      
                      <div className="detail-section">
                        <h5>Code Example</h5>
                        <pre className="code-example">
                          <code>{getFormatDetails(selectedFormat).codeExample}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  <div className="download-actions">
                    <button
                      className="download-btn primary"
                      onClick={() => handleDownload(selectedFormat)}
                    >
                      <FaDownload /> Download Sample
                    </button>
                    <button
                      className="download-btn secondary"
                      onClick={() => handleDownload(selectedFormat, 'all')}
                    >
                      <FaDownload /> Download All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Research Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="statistics-tab">
              {statsLoading ? (
                <div className="loading-state">
                  <h3>Loading Research Statistics...</h3>
                  <p>Please wait while we fetch the latest data.</p>
                </div>
              ) : (
                <>
                  <div className="stats-overview">
                    <h3>Research Statistics</h3>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-icon">
                          <FaFileAlt />
                        </div>
                        <div className="stat-content">
                          <h4>Total Papers</h4>
                          <p className="stat-value">{researchStats && researchStats.totalPapers && typeof researchStats.totalPapers === 'number' ? researchStats.totalPapers.toLocaleString() : '0'}</p>
                          <p className="stat-description">Published research papers</p>
                        </div>
                      </div>
                      
                      <div className="stat-card">
                        <div className="stat-icon">
                          <FaRocket />
                        </div>
                        <div className="stat-content">
                          <h4>Total Discoveries</h4>
                          <p className="stat-value">{researchStats && researchStats.totalDiscoveries && typeof researchStats.totalDiscoveries === 'number' ? researchStats.totalDiscoveries.toLocaleString() : '0'}</p>
                          <p className="stat-description">Mathematical breakthroughs</p>
                        </div>
                      </div>
                      
                      <div className="stat-card">
                        <div className="stat-icon">
                          <FaDownload />
                        </div>
                        <div className="stat-content">
                          <h4>Total Downloads</h4>
                          <p className="stat-value">{researchStats && researchStats.totalDownloads && typeof researchStats.totalDownloads === 'number' ? researchStats.totalDownloads.toLocaleString() : '0'}</p>
                          <p className="stat-description">Research downloads</p>
                        </div>
                      </div>
                      
                      <div className="stat-card">
                        <div className="stat-icon">
                          <FaUsers />
                        </div>
                        <div className="stat-content">
                          <h4>Active Researchers</h4>
                          <p className="stat-value">{researchStats && researchStats.activeResearchers ? researchStats.activeResearchers : '0'}</p>
                          <p className="stat-description">Contributing researchers</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="advanced-stats">
                    <h4>Advanced Metrics</h4>
                    <div className="metrics-grid">
                      <div className="metric">
                        <span className="metric-label">Average Complexity:</span>
                        <span className="metric-value">{researchStats && researchStats.averageComplexity ? researchStats.averageComplexity : 'N/A'}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Total Research Value:</span>
                        <span className="metric-value">{researchStats && researchStats.totalResearchValue && typeof researchStats.totalResearchValue === 'number' ? researchStats.totalResearchValue.toLocaleString() : '0'} MINED</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Average Validation Score:</span>
                        <span className="metric-value">{researchStats && researchStats.averageValidationScore ? researchStats.averageValidationScore : '0'}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Total Citations:</span>
                        <span className="metric-value">{researchStats && researchStats.totalCitations && typeof researchStats.totalCitations === 'number' ? researchStats.totalCitations.toLocaleString() : '0'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Research;
