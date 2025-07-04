import { ethers } from "ethers";
import * as PaniniNFTs from "../artifacts/contracts/PaniniNfts/PaniniNFTs.sol/PaniniNFTs.json"

const abiCoder = new ethers.AbiCoder();
const adminPrivateKey = "0xa38079e6582d10a45d881de68f3944424fd7e1bd1fa43847077616b81805a18b"; 
const userPrivateKey = "0x97a320ad14872abafc2b764f1278ad83395d0696d76071c7e7bc191ca9d277e0"
const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/IYCRbmkzSXAXDYR98TXonbac6eBMfeSV");
const admin = new ethers.Wallet(adminPrivateKey, provider);
const signer = new ethers.Wallet(userPrivateKey, provider);
const chainId = 11155111;
const contractAddress = "0x6E126923356f1e5Dbcc5314D45076783c053FdaE";

async function batchLockSignMessage(toAddress:string, tokenIds: Array<Number>) {
    const requestNonce =  Date.now();    
    const futureTimestamp = Math.floor(Date.now() / 1000) + 120*100;
    const message = abiCoder.encode(
        ["uint256", "address", "uint256[]", "uint256","uint256"],
        [ chainId, toAddress, tokenIds, requestNonce,futureTimestamp]
    );
    const messageHash = ethers.keccak256(message);
    const signature = await admin.signMessage(ethers.getBytes(messageHash));
    console.log("Message Hash:", messageHash);
    console.log("Signature:", signature);
    console.log("requestNonce:", requestNonce);
    console.log('futureTimestamp',futureTimestamp);
    batchLockSendTransaction(tokenIds, requestNonce, futureTimestamp, signature);
}


async function batchLockSendTransaction(tokenIds:any, requestNonce:any, futureTimestamp:any, signature:any){
    try {
            const contract = new ethers.Contract(contractAddress, PaniniNFTs.abi, signer);
            const gasEstimate = await contract.batchLockNFT.estimateGas(
              tokenIds,
              requestNonce,
              futureTimestamp,
              signature,
            );
            console.log("Estimated Gas:", gasEstimate.toString());
            // Add 10% buffer
            const gasLimit = gasEstimate * BigInt(110) / BigInt(100);   
            console.log("gasLimit",gasLimit);
            const feeData = await provider.getFeeData();
            const gasPrice = BigInt(Math.ceil(Number(feeData.gasPrice) * 1));
            const totalCostInWei = gasEstimate * gasPrice;
            const totalCostInEth = ethers.formatEther(totalCostInWei);
            console.log(`Estimated Total Gas Cost: ${totalCostInEth} ETH`);
            const nonceLatest = await provider.getTransactionCount(signer.address);
            console.log(nonceLatest)
            const tx = await contract.batchLockNFT(tokenIds, 
                requestNonce,futureTimestamp,signature,{
                // maxFeePerGas: feeData.maxFeePerGas,
                // maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                // gasPrice: gasPrice,
                nonce : nonceLatest
                }
            );
            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("NFT Locked Successfully!");
    
        }
        catch (error) {
            console.error("Error Locking NFTs:", error);
        }
}

batchLockSignMessage("0x087DDC2172C826350ff5E80D917393eb9cD28050", [1, 2])