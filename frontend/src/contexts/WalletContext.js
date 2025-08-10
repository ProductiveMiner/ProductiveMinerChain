import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { backendAPI, flowAPI } from '../utils/api';

const WalletContext = createContext();

const initialState = {
  isConnected: false,
  address: null,
  balance: 0,
  transactions: [],
  stakingInfo: {
    staked: 0,
    rewards: 0,
    apy: 0,
    validators: []
  },
  miningInfo: {
    isMining: false,
    currentEngine: null,
    hashrate: 0,
    rewards: 0
  },
  loading: false,
  error: null
};

const walletReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'CONNECT_WALLET':
      return {
        ...state,
        isConnected: true,
        address: action.payload.address,
        balance: action.payload.balance || 0,
        loading: false,
        error: null
      };
    
    case 'DISCONNECT_WALLET':
      return {
        ...state,
        isConnected: false,
        address: null,
        balance: 0,
        transactions: [],
        stakingInfo: { staked: 0, rewards: 0, apy: 0, validators: [] },
        miningInfo: { isMining: false, currentEngine: null, hashrate: 0, rewards: 0 },
        error: null
      };
    
    case 'UPDATE_BALANCE':
      return { ...state, balance: action.payload };
    
    case 'UPDATE_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    
    case 'UPDATE_STAKING_INFO':
      return { ...state, stakingInfo: action.payload };
    
    case 'UPDATE_MINING_INFO':
      return { ...state, miningInfo: action.payload };
    
    case 'REFRESH_WALLET_DATA':
      return { ...state, loading: true };
    
    default:
      return state;
  }
};

export const WalletProvider = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const lastWalletFetchRef = useRef(0);
  const backoffUntilRef = useRef(0);

  // Connect to internal blockchain wallet
  const connectWallet = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Get wallet info from internal blockchain
      const walletInfo = await backendAPI.getWalletInfo();
      
      if (walletInfo) {
        dispatch({
          type: 'CONNECT_WALLET',
          payload: {
            address: walletInfo.address,
            balance: walletInfo.balance
          }
        });

        // Avoid immediate duplicate fetch; periodic refresher will update
      } else {
        throw new Error('Failed to connect to internal wallet');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Disconnect from internal wallet
  const disconnectWallet = () => {
    dispatch({ type: 'DISCONNECT_WALLET' });
  };

  // Send transaction through internal blockchain
  const sendTransaction = async (transactionData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await backendAPI.sendTransaction(transactionData);
      
      if (result.success) {
        // Refresh wallet data after successful transaction
        await refreshWalletData();
        return result;
      } else {
        throw new Error(result.message || 'Transaction failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Stake tokens through internal blockchain
  const stakeTokens = async (stakeData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await backendAPI.stakeTokens(stakeData);
      
      if (result.success) {
        await refreshWalletData();
        return result;
      } else {
        throw new Error(result.message || 'Staking failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Unstake tokens through internal blockchain
  const unstakeTokens = async (unstakeData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await backendAPI.unstakeTokens(unstakeData);
      
      if (result.success) {
        await refreshWalletData();
        return result;
      } else {
        throw new Error(result.message || 'Unstaking failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Claim staking rewards through internal blockchain
  const claimRewards = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await backendAPI.claimRewards();
      
      if (result.success) {
        await refreshWalletData();
        return result;
      } else {
        throw new Error(result.message || 'Claiming rewards failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Start mining through internal mathematical engine
  const startMining = async (engineType) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Backend expects optional difficulty; engine type currently unused in backend
      const result = await backendAPI.startMining({ difficulty: 25 });
      
      if (result.success) {
        dispatch({
          type: 'UPDATE_MINING_INFO',
          payload: {
            isMining: true,
            currentEngine: engineType,
            hashrate: result.mining?.hashrate || 0,
            rewards: result.mining?.rewards || 0
          }
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return result;
      } else {
        throw new Error(result.message || 'Failed to start mining');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Stop mining through internal mathematical engine
  const stopMining = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await backendAPI.stopMining();
      
      if (result.success) {
        dispatch({
          type: 'UPDATE_MINING_INFO',
          payload: {
            isMining: false,
            currentEngine: null,
            hashrate: 0,
            rewards: 0
          }
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return result;
      } else {
        throw new Error(result.message || 'Failed to stop mining');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Refresh all wallet data from internal blockchain
  const refreshWalletData = async () => {
    try {
      const now = Date.now();
      if (now < backoffUntilRef.current) {
        return; // Backing off due to prior 429
      }
      if (now - lastWalletFetchRef.current < 10000) {
        return; // Throttle to at most once every 10s
      }
      lastWalletFetchRef.current = now;
      dispatch({ type: 'REFRESH_WALLET_DATA' });
      
      // Fetch wallet info
      const walletInfo = await backendAPI.getWalletInfo();
      if (walletInfo) {
        // Normalize to an object with MINED and USD to avoid NaN in UI
        const normalizedBalance = typeof walletInfo === 'number'
          ? { MINED: walletInfo, USD: 0 }
          : (walletInfo.MINED || walletInfo.USD || walletInfo.balance)
            ? { MINED: walletInfo.MINED ?? walletInfo.balance ?? 0, USD: walletInfo.USD ?? 0 }
            : { MINED: 0, USD: 0 };
        dispatch({ type: 'UPDATE_BALANCE', payload: normalizedBalance });
      }
      
      // Fetch staking info
      const stakingInfo = await backendAPI.getStakingInfo();
      if (stakingInfo) {
        // Ensure numeric fields for UI formatting
        const normalizedStaking = {
          staked: Number(stakingInfo.staked ?? stakingInfo.userStaked ?? 0),
          rewards: Number(stakingInfo.rewards ?? stakingInfo.userRewards ?? 0),
          apy: Number(stakingInfo.apy ?? 0),
          validators: Array.isArray(stakingInfo.validators) ? stakingInfo.validators : []
        };
        dispatch({ type: 'UPDATE_STAKING_INFO', payload: normalizedStaking });
      }
      
      // Fetch mining info
      const miningInfo = await backendAPI.getMiningInfo();
      if (miningInfo) {
        dispatch({ type: 'UPDATE_MINING_INFO', payload: miningInfo });
      }
      
      // Fetch recent transactions
      const transactionsResponse = await backendAPI.getWalletTransactions();
      if (transactionsResponse && transactionsResponse.transactions) {
        dispatch({ type: 'UPDATE_TRANSACTIONS', payload: transactionsResponse.transactions });
      } else if (transactionsResponse && Array.isArray(transactionsResponse)) {
        dispatch({ type: 'UPDATE_TRANSACTIONS', payload: transactionsResponse });
      } else {
        dispatch({ type: 'UPDATE_TRANSACTIONS', payload: [] });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      // 429 backoff for 60s
      const status = error?.response?.status || error?.status;
      if (status === 429) {
        backoffUntilRef.current = Date.now() + 60000;
      }
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Auto-refresh wallet data periodically when connected
  useEffect(() => {
    if (state.isConnected) {
      const tick = () => {
        if (!document.hidden) {
          refreshWalletData();
        }
      };
      const interval = setInterval(tick, 30000); // 30s
      return () => clearInterval(interval);
    }
  }, [state.isConnected]);

  const value = {
    ...state,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    stakeTokens,
    unstakeTokens,
    claimRewards,
    startMining,
    stopMining,
    refreshWalletData,
    clearError
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
