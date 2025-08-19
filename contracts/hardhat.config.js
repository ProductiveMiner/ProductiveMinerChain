require("@nomicfoundation/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1, // Low runs value for size optimization
          },
          viaIR: true, // Enable IR-based code generation for better optimization
        },
      },
      {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1, // Low runs value for size optimization
          },
          viaIR: true, // Enable IR-based code generation for better optimization
        },
      }
    ],
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/your-project-id",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
