const CONTRACT_CONFIG = {
  SEPOLIA: {
    rpcUrl: process.env.WEB3_PROVIDER || 'https://eth-sepolia.g.alchemy.com/v2/EsD9nEjl3rvwE35tYtTZC',
    tokenAddress: '0x78916EB89CDB2Ef32758fCc41f3aef3FDf052ab3', // MINEDTokenStandalone contract
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io'
  }
};

module.exports = { CONTRACT_CONFIG };
