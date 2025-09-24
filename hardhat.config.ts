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
    },
    bsc_testnet:{
      url: process.env.BSC_TESTNET_RPC,
      accounts: [privateKey]      
    },
    arb_sepolia:{
      url: process.env.ARB_SEPOLIA_RPC,
      accounts: [privateKey]      
    },
    mainnet:{
      url: process.env.MAINNET_PRC,
      accounts: [privateKey]      
    },
    
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.AMOYSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.SEPOLIASCAN_API_KEY || '',
      bscTestnet: process.env.BSC_TESTNET_API_KEY || ''

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
  ignition: {
    strategyConfig: {
      create2: {
        // To learn more about salts, see the CreateX documentation
        // salt: "0x171cd042c507f24ef667f9ac79dd3674696fb2b43b0393f36c1106f0d6a20e64",
         salt: "0x624c15a5d0c0bbdfe8946e50c9d7b7f79091f4e0ff45e4204850a051e0a2e12d"//t2
        // salt: "0xecb9cb7497ba35ca388c92a284fb1d1c44804ab6fecfc98f0e681fd4e5838704",        
        
      },
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

};

export default config;

