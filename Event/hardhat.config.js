require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.26",
  networks: {
    sepolia: {
      url: process.env.INFURA_API_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`] 
    }
  },
etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

sourcify: {
  enabled: true
},
}