import { HardhatUserConfig } from "hardhat/config";
require("@openzeppelin/hardhat-upgrades");
import "@nomicfoundation/hardhat-toolbox";
require('dotenv').config({path:__dirname+'/.env'})

const privateKey : any = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  sourcify: {
    enabled: true
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },    
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC,
      accounts: [privateKey]
    },
    polygon: {
      url: process.env.POLYGON_RPC,
      accounts: [privateKey]
    },
    sepolia:{
      url: process.env.SEPOLIA_RPC,
      accounts: [privateKey]      
    }
    
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.AMOYSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.SEPOLIASCAN_API_KEY || ''

    },
    // For custom networks
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        },
      }
    ]
  },

  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }


};

export default config;

