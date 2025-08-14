import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MINED_TOKEN_CONFIG } from '../config/mined-token-config';
import MINEDTokenStandaloneABI from '../contracts/MINEDTokenStandalone.json';
import './MinedTokenDisplay.css';

const MinedTokenDisplay = ({ userAddress }) => {
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [emissionParams, setEmissionParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userAddress) {
      loadTokenData();
    }
  }, [userAddress]);

  const loadTokenData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Connect to provider - try BrowserProvider first, fallback to JsonRpcProvider
      let provider;
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        console.log('Using BrowserProvider');
      } catch (providerError) {
        console.warn('BrowserProvider failed, using JsonRpcProvider:', providerError);
        // Fallback to direct RPC provider
        provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC');
        console.log('Using JsonRpcProvider fallback');
      }
      
      // Get the correct network
      const network = await provider.getNetwork();
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
      
      // Check if we're on Sepolia
      if (network.chainId !== 11155111n) { // Sepolia
        console.error('Wrong network detected. Expected Sepolia (11155111), got:', network.chainId);
        throw new Error(`Please connect to Sepolia testnet. Current network: ${network.name} (Chain ID: ${network.chainId})`);
      }
      
      console.log('✅ Network check passed - connected to Sepolia');

      // Create contract instance with better error handling
      const contractAddress = MINED_TOKEN_CONFIG.contracts.minedToken;
      console.log('Creating contract instance with address:', contractAddress);
      console.log('ABI length:', MINEDTokenStandaloneABI.abi.length);
      
      // Verify the contract address is valid
      if (!ethers.isAddress(contractAddress)) {
        throw new Error(`Invalid contract address: ${contractAddress}`);
      }
      
      const minedTokenContract = new ethers.Contract(
        contractAddress,
        MINEDTokenStandaloneABI.abi,
        provider
      );
      
      console.log('✅ Contract instance created successfully');

      // Check if contract has code deployed
      console.log('Checking if contract has code deployed...');
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        throw new Error(`No contract deployed at address: ${contractAddress}`);
      }
      console.log('✅ Contract code found at address');

      // Test basic contract functions first
      console.log('Testing basic contract functions...');
      const name = await minedTokenContract.name();
      const symbol = await minedTokenContract.symbol();
      console.log('Contract name:', name, 'Symbol:', symbol);

      // Get token balance with better error handling
      if (userAddress) {
        console.log('Getting balance for address:', userAddress);
        try {
          const balance = await minedTokenContract.balanceOf(userAddress);
          console.log('Raw balance result:', balance);
          setTokenBalance(ethers.formatEther(balance.toString()));
        } catch (balanceError) {
          console.error('BalanceOf error:', balanceError);
          throw new Error(`Failed to get token balance: ${balanceError.message}`);
        }
      }

      // Get token info with better error handling
      console.log('Getting token info...');
      try {
        // Get basic token info
        const name = await minedTokenContract.name();
        const symbol = await minedTokenContract.symbol();
        const decimals = await minedTokenContract.decimals();
        const totalSupply = await minedTokenContract.totalSupply();
        
        // Get system info from standalone token (returns tuple: totalSupply_, totalBurned_, totalResearchValue_, totalValidators_, currentEmission)
        const systemInfo = await minedTokenContract.getSystemInfo();
        console.log('Raw systemInfo result:', systemInfo);
        
        // systemInfo is a tuple, access by index: [totalSupply_, totalBurned_, totalResearchValue_, totalValidators_, currentEmission]
        const [systemTotalSupply, totalBurned, totalResearchValue, totalValidators, currentEmission] = systemInfo;
        
        console.log('Parsed system info:', {
          totalSupply: systemTotalSupply.toString(),
          totalBurned: totalBurned.toString(),
          totalResearchValue: totalResearchValue.toString(),
          totalValidators: totalValidators.toString(),
          currentEmission: currentEmission.toString()
        });
        
        setTokenInfo({
          name: name,
          symbol: symbol,
          decimals: Number(decimals),
          totalSupply: ethers.formatEther(systemTotalSupply.toString()),
          totalBurned: ethers.formatEther(totalBurned.toString()),
          totalResearchValue: totalResearchValue.toString(),
          totalValidators: totalValidators.toString(),
          currentEmission: ethers.formatEther(currentEmission.toString()),
          softCap: ethers.formatEther(systemTotalSupply.toString()) // Use total supply as soft cap
        });
        
        // Get totalEmitted from calculateEmission (standalone contract doesn't have separate emission parameters)
        try {
          const currentEmission = await minedTokenContract.calculateEmission();
          setTokenInfo(prev => ({
            ...prev,
            totalEmitted: ethers.formatEther(currentEmission.toString())
          }));
        } catch (emissionError) {
          console.warn('calculateEmission not available, using totalSupply as fallback:', emissionError.message);
          setTokenInfo(prev => ({
            ...prev,
            totalEmitted: ethers.formatEther(systemTotalSupply.toString())
          }));
        }
      } catch (infoError) {
        console.error('getSystemInfo error:', infoError);
        throw new Error(`Failed to get token info: ${infoError.message}`);
      }

      // Get emission parameters from calculateEmission (standalone contract doesn't have separate emission parameters)
      console.log('Getting emission data from calculateEmission...');
      try {
        const currentEmission = await minedTokenContract.calculateEmission();
        console.log('Current emission result:', currentEmission);
        setEmissionParams({
          initialEmissionRate: ethers.formatEther(currentEmission.toString()),
          decayConstant: '1', // Default for standalone contract
          researchMultiplierBase: '1', // Default for standalone contract
          decayScale: '10000', // Default for standalone contract
          researchScale: '100' // Default for standalone contract
        });
      } catch (emissionError) {
        console.warn('calculateEmission not available, using defaults:', emissionError.message);
        setEmissionParams({
          initialEmissionRate: '1000',
          decayConstant: '1',
          researchMultiplierBase: '1',
          decayScale: '10000',
          researchScale: '100'
        });
      }

    } catch (err) {
      console.error('Error loading token data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTokenToMetaMask = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: MINED_TOKEN_CONFIG.contracts.minedToken,
            symbol: MINED_TOKEN_CONFIG.token.symbol,
            decimals: MINED_TOKEN_CONFIG.token.decimals,
            image: 'https://productiveminer.org/favicon.ico' // You can update this with your token logo
          }
        }
      });

      alert('MINED token added to MetaMask!');
    } catch (err) {
      console.error('Error adding token to MetaMask:', err);
      alert('Failed to add token to MetaMask: ' + err.message);
    }
  };

  const formatNumber = (num) => {
    if (num === '0') return '0';
    return parseFloat(num).toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="mined-token-display">
        <div className="token-loading">
          <div className="loading-spinner"></div>
          <p>Loading MINED token data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mined-token-display">
        <div className="token-error">
          <h3>⚠️ Connection Error</h3>
          <p>{error}</p>
          <button onClick={loadTokenData} className="retry-button">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mined-token-display">
      <div className="token-header">
        <h2>🪙 MINED Token</h2>
        <button onClick={addTokenToMetaMask} className="add-to-metamask-btn">
          Add to MetaMask
        </button>
      </div>

      <div className="token-grid">
        {/* Token Balance */}
        <div className="token-card balance-card">
          <h3>Your Balance</h3>
          <div className="balance-amount">
            {formatNumber(tokenBalance)} <span className="token-symbol">MINED</span>
          </div>
          {userAddress && (
            <div className="wallet-info">
              <small>Wallet: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</small>
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="token-card info-card">
          <h3>Token Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{tokenInfo?.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Symbol:</span>
              <span className="value">{tokenInfo?.symbol}</span>
            </div>
            <div className="info-item">
              <span className="label">Total Supply:</span>
              <span className="value">{formatNumber(tokenInfo?.totalSupply)} MINED</span>
            </div>
            <div className="info-item">
              <span className="label">Soft Cap:</span>
              <span className="value">{formatNumber(tokenInfo?.softCap)} MINED</span>
            </div>
          </div>
        </div>

        {/* Emission Model */}
        <div className="token-card emission-card">
          <h3>Asymptotic Emission Model</h3>
          <div className="emission-formula">
            E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t))
          </div>
          <div className="emission-params">
            <div className="param-item">
              <span className="label">Initial Rate:</span>
              <span className="value">{formatNumber(emissionParams?.initialEmissionRate)} MINED/block</span>
            </div>
            <div className="param-item">
              <span className="label">Decay Constant:</span>
              <span className="value">{emissionParams?.decayConstant}</span>
            </div>
            <div className="param-item">
              <span className="label">Research Multiplier:</span>
              <span className="value">{emissionParams?.researchMultiplierBase}</span>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="token-card network-card">
          <h3>Network Information</h3>
          <div className="network-info">
            <div className="info-item">
              <span className="label">Network:</span>
              <span className="value">{MINED_TOKEN_CONFIG.network.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Chain ID:</span>
              <span className="value">{MINED_TOKEN_CONFIG.network.chainId}</span>
            </div>
            <div className="info-item">
              <span className="label">Contract:</span>
              <span className="value contract-link">
                <a 
                  href={`https://sepolia.etherscan.io/address/${MINED_TOKEN_CONFIG.contracts.minedToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Etherscan
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="token-actions">
        <button onClick={loadTokenData} className="refresh-button">
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default MinedTokenDisplay;
