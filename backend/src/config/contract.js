const CONTRACT_CONFIG = {
  SEPOLIA: {
    rpcUrl: process.env.WEB3_PROVIDER || 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC',
    tokenAddress: '0x7877EFAb4aD3610792a135f6f8A241962fD2ab76', // MINEDToken contract
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io'
  }
};

module.exports = { CONTRACT_CONFIG };
