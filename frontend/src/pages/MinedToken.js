import React, { useState, useEffect } from 'react';
import MinedTokenDisplay from '../components/MinedTokenDisplay';
import { MINED_TOKEN_CONFIG } from '../config/mined-token-config';
import './MinedToken.css';

const MinedToken = () => {
  const [userAddress, setUserAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask to connect your wallet');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }
            ]
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          alert('Failed to add Sepolia network to MetaMask');
        }
      } else {
        console.error('Error switching to Sepolia:', switchError);
        alert('Failed to switch to Sepolia network');
      }
    }
  };

  return (
    <div className="mined-token-page">
      <div className="token-hero">
        <div className="hero-content">
          <h1>🪙 MINED Token (Enhanced)</h1>
          <p className="hero-subtitle">
            The revolutionary enhanced token powering mathematical discovery mining with 15B asymptotic emission model
          </p>
          
          {!isConnected ? (
            <div className="connect-section">
              <p>Connect your wallet to view your MINED token balance and participate in mathematical discovery mining</p>
              <button onClick={connectWallet} className="connect-wallet-btn">
                🔗 Connect Wallet
              </button>
            </div>
          ) : (
            <div className="wallet-section">
              <p>Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</p>
              <button onClick={switchToSepolia} className="switch-network-btn">
                🔄 Switch to Sepolia
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="token-content">
        {isConnected ? (
          <MinedTokenDisplay userAddress={userAddress} />
        ) : (
          <div className="connect-prompt">
            <div className="prompt-card">
              <h3>🔗 Connect Your Wallet</h3>
              <p>To view your MINED token balance and participate in mathematical discovery mining, please connect your MetaMask wallet.</p>
              <button onClick={connectWallet} className="connect-btn">
                Connect MetaMask
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="token-info-section">
        <div className="info-container">
          <h2>About MINED Token</h2>
          
          <div className="info-grid">
            <div className="info-card">
              <h3>🎯 Asymptotic Emission Model</h3>
              <p>
                MINED token uses a sophisticated asymptotic emission model that combines exponential decay 
                with research value multipliers. The formula E(t) = E₀ × e^(-λt) × (1 + α × ResearchValue(t)) 
                ensures sustainable token distribution while rewarding mathematical discoveries.
              </p>
            </div>

            <div className="info-card">
              <h3>⛏️ Mathematical Discovery Mining</h3>
              <p>
                Earn MINED tokens by contributing to mathematical research and discoveries. 
                The more valuable your mathematical contributions, the higher your token rewards. 
                This creates a unique incentive system for mathematical innovation.
              </p>
            </div>

            <div className="info-card">
              <h3>🔬 Research Value Integration</h3>
              <p>
                Your mathematical discoveries directly impact token emission rates through the 
                ResearchValue(t) component. This creates a direct correlation between 
                mathematical progress and token economics.
              </p>
            </div>

            <div className="info-card">
              <h3>📊 Real-time Monitoring</h3>
              <p>
                Track emission rates, research value contributions, and token distribution 
                in real-time. The system provides complete transparency into how mathematical 
                discoveries influence token economics.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="token-stats-section">
        <div className="stats-container">
          <h2>Token Statistics</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">750M</div>
              <div className="stat-label">Initial Supply</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">15B</div>
              <div className="stat-label">Soft Cap</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">14.25B</div>
              <div className="stat-label">Available for Mining</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">Sepolia</div>
              <div className="stat-label">Network</div>
            </div>
          </div>
        </div>
      </div>

      <div className="token-links-section">
        <div className="links-container">
          <h2>Useful Links</h2>
          
          <div className="links-grid">
            <a 
              href={`https://sepolia.etherscan.io/address/${MINED_TOKEN_CONFIG.contracts.minedToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
            >
              <h3>🪙 MINED Token Contract</h3>
              <p>Enhanced asymptotic token with 15B soft cap</p>
            </a>
            
            <a 
              href={`https://sepolia.etherscan.io/address/${MINED_TOKEN_CONFIG.contracts.productiveMiner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
            >
              <h3>⛏️ ProductiveMiner Contract</h3>
              <p>Mathematical discovery mining contract</p>
            </a>
            
            <a 
              href="https://sepoliafaucet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
            >
              <h3>🚰 Sepolia Faucet</h3>
              <p>Get free Sepolia ETH for gas fees</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinedToken;
