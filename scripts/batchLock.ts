import { ethers } from "ethers";
import * as PaniniNFTs from "../artifacts/contracts/PaniniNfts/PaniniNFTs.sol/PaniniNFTs.json"

const abiCoder = new ethers.AbiCoder();
const bridgeSignerPrivateKey = "0xa38009e6582d10a45d881de68f3944424fd7e1bd1fa43847077616b81805a18b"; // replace keys
const userPrivateKey = "0x90a320ad14872abafc2b764f1278ad83395d0696d76071c7e7bc191ca9d277e0" // replace keys
const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/IYCRbmkzSXAXDYR98TXonbac6eBMfeSV");
const bridgeSigner = new ethers.Wallet(bridgeSignerPrivateKey, provider);
const signer = new ethers.Wallet(userPrivateKey, provider);
const chainId = 11155111;
const contractAddress = "0x6E126923356f1e5Dbcc5314D45076783c053FdaE";


// Function to will be called NFT is moving from Ethereum to Panini chain. 
// Assume Lock at Panini chain (Sawtooth) is done.
// From Panini Application user can NFTs he own on Ethereum for connected Wallet. 
// User can select NFTs to bring it back, and sumbit.
// Bridge/Backend will validate all require checks. 
// Then, Signs payload, generate signature. send to Frontend app.

async function batchLockSignMessage(toAddress: string, tokenIds: Array<Number>) {
    // Generate a unique request nonce using the current timestamp (milliseconds)
    const requestNonce = Date.now();

    // Set a future timestamp (in seconds) to define the signature's expiry window
    const futureTimestamp = Math.floor(Date.now() / 1000) + 120 * 100;

    // Encode the message parameters as per the expected structure of the smart contract
    const message = abiCoder.encode(
        ["uint256", "address", "uint256[]", "uint256", "uint256"],
        [chainId, toAddress, tokenIds, requestNonce, futureTimestamp]
    );

    // Hash the encoded message using keccak256
    const messageHash = ethers.keccak256(message);

    // Sign the hashed message with the bridgeSigner's private key to generate a valid signature
    const signature = await bridgeSigner.signMessage(ethers.getBytes(messageHash));

    // Log all relevant information for transparency and debugging
    console.log("Message Hash:", messageHash);
    console.log("Signature:", signature);
    console.log("requestNonce:", requestNonce);
    console.log("futureTimestamp:", futureTimestamp);

    // Call the function that sends the actual transaction to the blockchain
    batchLockSendTransaction(tokenIds, requestNonce, futureTimestamp, signature);
}


// Now user upon click bridge NFTs to Panini Chain, Metamask or supported wallet opens up with generated signatures.
// Send to ethereum, on all success validations, contract takes NFTs ownership, emits event for oracle. 
async function batchLockSendTransaction(tokenIds: any, requestNonce: any, futureTimestamp: any, signature: any) {
    try {
        // Create a new instance of the contract using its address, ABI, and signer
        const contract = new ethers.Contract(contractAddress, PaniniNFTs.abi, signer);

        // Estimate the amount of gas required to execute the batchLockNFT function
        const gasEstimate = await contract.batchLockNFT.estimateGas(
            tokenIds,
            requestNonce,
            futureTimestamp,
            signature,
        );
        console.log("Estimated Gas:", gasEstimate.toString());

        // Add a 10% buffer to the gas estimate to avoid out-of-gas errors
        const gasLimit = gasEstimate * BigInt(110) / BigInt(100);
        console.log("gasLimit", gasLimit);

        // Retrieve current gas price data from the provider
        const feeData = await provider.getFeeData();
        const gasPrice = BigInt(Math.ceil(Number(feeData.gasPrice) * 1));

        // Calculate the total transaction cost in both Wei and ETH for user awareness
        const totalCostInWei = gasEstimate * gasPrice;
        const totalCostInEth = ethers.formatEther(totalCostInWei);
        console.log(`Estimated Total Gas Cost: ${totalCostInEth} ETH`);

        // Fetch the latest transaction nonce for the signer to prevent transaction conflicts
        const nonceLatest = await provider.getTransactionCount(signer.address);
        console.log(nonceLatest);

        // Send the actual transaction to lock the NFTs using the signed data
        const tx = await contract.batchLockNFT(
            tokenIds,
            requestNonce,
            futureTimestamp,
            signature,
            {
                // Optional: You can uncomment and set specific gas settings here if needed
                // maxFeePerGas: feeData.maxFeePerGas,
                // maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                // gasPrice: gasPrice,
                nonce: nonceLatest
            }
        );

        console.log("Transaction sent:", tx.hash);

        // Wait for the transaction to be confirmed on the blockchain
        await tx.wait();

        console.log("NFT Locked Successfully!");

    } catch (error) {
        // Log any errors that occur during the transaction process
        console.error("Error Locking NFTs:", error);
    }
}


batchLockSignMessage("0x087DDC2172C826350ff5E80D917393eb9cD28050", [1, 2])