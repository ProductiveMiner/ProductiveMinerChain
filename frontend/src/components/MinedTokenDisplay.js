import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MINED_TOKEN_CONFIG } from '../config/mined-token-config';
import MINEDTokenFixedABI from '../contracts/MINEDTokenFixed.json';
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
      console.log('ABI length:', MINEDTokenFixedABI.abi.length);
      
      // Verify the contract address is valid
      if (!ethers.isAddress(contractAddress)) {
        throw new Error(`Invalid contract address: ${contractAddress}`);
      }
      
      const minedTokenContract = new ethers.Contract(
        contractAddress,
        MINEDTokenFixedABI.abi,
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

      // Get token info with better error handling (new fixed contract has 7 return values)
      console.log('Getting asymptotic token info...');
      try {
        const info = await minedTokenContract.getAsymptoticTokenInfo();
        console.log('Asymptotic info result:', info);
        setTokenInfo({
          name: info[0],
          symbol: info[1],
          decimals: info[2],
          totalSupply: ethers.formatEther(info[3].toString()),
          currentBlockHeight: info[4].toString(),
          totalResearchValue: info[5].toString(),
          softCap: ethers.formatEther(info[6].toString())
        });
        
        // Get totalEmitted from emission parameters
        const params = await minedTokenContract.getEmissionParameters();
        setTokenInfo(prev => ({
          ...prev,
          totalEmitted: ethers.formatEther(params[4].toString())
        }));
      } catch (infoError) {
        console.error('getAsymptoticTokenInfo error:', infoError);
        throw new Error(`Failed to get token info: ${infoError.message}`);
      }

      // Get emission parameters with better error handling
      console.log('Getting emission parameters...');
      try {
        const params = await minedTokenContract.getEmissionParameters();
        console.log('Emission params result:', params);
        setEmissionParams({
          initialEmissionRate: ethers.formatEther(params[0].toString()),
          decayConstant: params[1].toString(),
          researchMultiplierBase: params[2].toString(),
          decayScale: params[3].toString(),
          researchScale: params[4].toString()
        });
      } catch (paramsError) {
        console.error('getEmissionParameters error:', paramsError);
        throw new Error(`Failed to get emission parameters: ${paramsError.message}`);
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
