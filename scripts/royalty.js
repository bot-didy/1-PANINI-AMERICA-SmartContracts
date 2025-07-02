const { ethers } = require("ethers");

// --- CONFIGURATION ---

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x3286cE1d88cF55D6F264879cC062902A07Cc0c73";

// Replace with your contract ABI
const CONTRACT_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "EnforcedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ExpectedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidInitialization",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInitializing",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "version",
          "type": "uint64"
        }
      ],
      "name": "Initialized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isWhitelisted",
          "type": "bool"
        }
      ],
      "name": "ReceiverWhitelistUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "ethIn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokenOut",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SwappedETHForToken",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isWhitelisted",
          "type": "bool"
        }
      ],
      "name": "TokenWhitelistUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpaused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isWhitelisted",
          "type": "bool"
        }
      ],
      "name": "WhitelistUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Withdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "WithdrawnERC20",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "routerAddress",
          "type": "address"
        }
      ],
      "name": "approveTokenForSwap",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getEthBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "getTokenBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_whitelistedAccounts",
          "type": "address[]"
        },
        {
          "internalType": "address[]",
          "name": "_whitelistedTokens",
          "type": "address[]"
        },
        {
          "internalType": "address",
          "name": "_uniswapRouter",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "paused",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountOutMin",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "outToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        }
      ],
      "name": "swapEthForToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountOutMin",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "inToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "outToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        }
      ],
      "name": "swapTokenForToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "tokenWhitelist",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "uniswapRouter",
      "outputs": [
        {
          "internalType": "contract IUniswapV2Router02",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "status",
          "type": "bool"
        }
      ],
      "name": "updateReceiversWhitelist",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "status",
          "type": "bool"
        }
      ],
      "name": "updateTokenWhitelist",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "status",
          "type": "bool"
        }
      ],
      "name": "updateWhitelist",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "vaultManagers",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "whitelistedReceivers",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "withdrawERC20",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "withdrawETH",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ]

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function decimals() view returns (uint8)" // Optional: for converting human-readable values
];

// Replace with your provider (Infura, Alchemy, Hardhat, etc.)
const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/IYCRbmkzSXAXDYR98TXonbac6eBMfeSV");

// Wallet (for signing transactions)
const wallet = new ethers.Wallet("0xa38079e6582d10a45d881de68f3944424fd7e1bd1fa43847077616b81805a18b", provider);

// Create contract instance
const vault = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

async function depositETHToVault(amountInEther) {
  const tx = await wallet.sendTransaction({
    to: CONTRACT_ADDRESS,
    value: ethers.parseEther(amountInEther),
  });
  console.log("Deposit tx hash:", tx.hash);
  await tx.wait();
  console.log("ETH deposited to contract");
}

async function sendERC20ToVault(tokenAddress, amountInUnits) {
  // Create ERC20 token contract instance
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

//   // Optional: convert to correct decimals
  const decimals = await token.decimals();
  
  const amount = ethers.parseUnits(amountInUnits, decimals);

  const tx = await token.transfer(CONTRACT_ADDRESS, amount);
  console.log("ERC20 transfer tx hash:", tx.hash);
  await tx.wait();
  console.log("ERC20 tokens sent to the vault");
}


async function withdrawETH(recipient, amountInEther) {
  const amount = ethers.parseEther(amountInEther);
  const tx = await vault.withdrawETH(amount, recipient);
  console.log("ETH Withdrawal tx:", tx.hash);
  await tx.wait();
  console.log("ETH Withdrawal successful");
}

async function withdrawERC20(recipient, tokenAddress, amountInUnits) {
  const amount = ethers.parseUnits(amountInUnits,6); // default 18 decimals
  const tx = await vault.withdrawERC20(recipient, tokenAddress, amount);
  console.log("ERC20 Withdrawal tx:", tx.hash);
  await tx.wait();
  console.log("ERC20 Withdrawal successful");
}

async function swapETHForToken(tokenOut, recipient, amountOutMin, ethToSend) {
  
  const tx = await vault.swapEthForToken(
    ethers.parseEther(ethToSend,18), 
    ethers.parseUnits(amountOutMin,6),
    tokenOut,
    recipient
  );
  console.log("Swap tx:", tx.hash);
  await tx.wait();
  console.log("ETH swapped to token");
}

async function swapTokenForToken(tokenOut, tokenIn, recipient, amountOutMin, tokenToSend) {
  
  const tx = await vault.swapTokenForToken(
    ethers.parseUnits(tokenToSend, 6), 
    ethers.parseUnits(amountOutMin, 18),
    tokenIn,
    tokenOut,
    recipient
  );
  console.log("Swap tx:", tx.hash);
  await tx.wait();
  console.log("ETH swapped to token");
}

async function addVaultManager(address, status) {
  const tx = await vault.updateWhitelist(address, status);
  console.log("Set vault manager tx:", tx.hash);
  await tx.wait();
}

async function addWhitelistedReceiver(address, status) {
  const tx = await vault.updateReceiversWhitelist(address, status);
  console.log("Set receiver tx:", tx.hash);
  await tx.wait();
}

async function addWhitelistedToken(address, status) {
  const tx = await vault.updateTokenWhitelist(address, status);
  console.log("Set token tx:", tx.hash);
  await tx.wait();
}

async function approveTokenForSwap(token, amount, routerAddress) {
  const tokenamount = ethers.parseUnits(amount, 6)
  const tx = await vault.approveTokenForSwap(token, tokenamount, routerAddress);
  console.log("Set token tx:", tx.hash);
  await tx.wait();
}

async function pauseContract() {
  const tx = await vault.pause();
  console.log("Paused:", tx.hash);
  await tx.wait();
}

async function unpauseContract() {
  const tx = await vault.unpause();
  console.log("Unpaused:", tx.hash);
  await tx.wait();
}


// depositETHToVault("0.000001")
// sendERC20ToVault("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", "0.1")
// addVaultManager("0xcAb8FF7275813e6Afa5Ee3DbDA7B786a393beDdF", true)
// addWhitelistedReceiver("0x513c2ff203619F0e8576f316c9e654C014d88d05", true)
// addWhitelistedToken("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", true)
// withdrawERC20("0x513c2ff203619F0e8576f316c9e654C014d88d05", "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", "0.1")
// withdrawETH("0x513c2ff203619F0e8576f316c9e654C014d88d05", "0.000001")
// swapETHForToken("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238","0x513c2ff203619F0e8576f316c9e654C014d88d05","0.001", "0.000001")
// approveTokenForSwap("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", "0.205", "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3")
swapTokenForToken("0xBBd3EDd4D3b519c0d14965d9311185CFaC8c3220","0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238","0x513c2ff203619F0e8576f316c9e654C014d88d05","0.000000000000000001","0.205" )
// pauseContract();
// unpauseContract()
