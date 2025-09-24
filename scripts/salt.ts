import { ethers } from "ethers";

const salt = ethers.keccak256(ethers.toUtf8Bytes("phoenix-nfts-eth-hdbhfv"));
console.log("Salt:", salt);

// npx hardhat run scripts/salt.ts
// 0xecb9cb7497ba35ca388c92a284fb1d1c44804ab6fecfc98f0e681fd4e5838704