import { ethers } from "ethers";
import * as PaniniNFTs from "../artifacts/contracts/PaniniNfts/PaniniNFTs.sol/PaniniNFTs.json"

const abiCoder = new ethers.AbiCoder();
const bridgeSignerPrivateKey = "0xa38009e6582d10a45d881de68f3944424fd7e1bd1fa43847077616b81805a18b"; // replace keys 
const userPrivateKey = "0x90a320ad14872abafc2b764f1278ad83395d0696d76071c7e7bc191ca9d277e0" // replace keys
const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/IYCRbmkzSXAXDYR98TXonbac6eBMfeSV");
const bridgeSigner = new ethers.Wallet(bridgeSignerPrivateKey, provider);
const signer = new ethers.Wallet(userPrivateKey, provider);
const chainId = 11155111;
const contractAddress = "0x01d1E12761FCDC7C43A5Da68CB3dA56EB966978C";

// Function to will be called NFT is moving from Panini chain to Ethereum.
// From Panini Application user can NFTs he own on Panini chain. 
// User can select NFTs to bridge to Ethereum, and sumbit.
// Bridge/Backend will validate all require checks.
// Those NFTs will be Locked at Panini chain (Sawtooth).
// Bridge Signer, Signs payload, generate signature. send to Frontend app.

async function batchMintOrUnlockSignMessage(toAddress: string, tokenIds: Array<Number>, tokenURIs: Array<string>) {
    // Generate a unique request nonce based on the current timestamp (in milliseconds)
    const requestNonce = Date.now();

    // Set a future timestamp (in seconds) as a validity window for the signature (here: current time + 12000 seconds)
    const futureTimestamp = Math.floor(Date.now() / 1000) + 120 * 100;

    // Encode the data to create the message that will be signed
    const message = abiCoder.encode(
        ["uint256", "address", "uint256[]", "string[]", "uint256", "uint256"],
        [chainId, toAddress, tokenIds, tokenURIs, requestNonce, futureTimestamp]
    );

    // Generate a keccak256 hash of the encoded message
    const messageHash = ethers.keccak256(message);

    // Sign the hashed message using the bridgeSigner's private key
    const signature = await bridgeSigner.signMessage(ethers.getBytes(messageHash));

    // Log the signed data for transparency and debugging
    console.log("Message Hash:", messageHash);
    console.log("Signature:", signature);
    console.log("requestNonce:", requestNonce);
    console.log('futureTimestamp:', futureTimestamp);

    // Call the transaction function with the signed message and associated data
    batchMintOrUnlockSendTransaction(tokenIds, tokenURIs, requestNonce, futureTimestamp, signature);
}


// Now user upon click cliam NFTs, Metamask or supported wallet opens up with generated signatures.
// Send to ethereum, on all success validations, contract mints or unlocks NFTs ownership to sender (user), emits events.
async function batchMintOrUnlockSendTransaction(tokenIds: any, tokenURIs: any, requestNonce: any, futureTimestamp: any, signature: any) {
    try {
        // Create an instance of the smart contract using its ABI, address, and signer
        const contract = new ethers.Contract(contractAddress, PaniniNFTs.abi, signer);

        // Estimate the gas required for the batchMintOrUnlock function call
        const gasEstimate = await contract.batchMintOrUnlock.estimateGas(
            tokenIds,
            tokenURIs,
            requestNonce,
            futureTimestamp,
            signature,
        );
        console.log("Estimated Gas:", gasEstimate.toString());

        // Add a 10% buffer to the gas estimate for safety
        const gasLimit = gasEstimate * BigInt(110) / BigInt(100);
        console.log("gasLimit", gasLimit);

        // Fetch current fee data (gas price) from the provider
        const feeData = await provider.getFeeData();
        const gasPrice = BigInt(Math.ceil(Number(feeData.gasPrice) * 1));

        // Calculate the total estimated transaction cost in ETH
        const totalCostInWei = gasEstimate * gasPrice;
        const totalCostInEth = ethers.formatEther(totalCostInWei);
        console.log(`Estimated Total Gas Cost: ${totalCostInEth} ETH`);

        // Get the latest transaction nonce for the signer to avoid nonce conflicts
        const nonceLatest = await provider.getTransactionCount(signer.address);
        console.log(nonceLatest);

        // Send the transaction to the blockchain
        const tx = await contract.batchMintOrUnlock(
            tokenIds,
            tokenURIs,
            requestNonce,
            futureTimestamp,
            signature,
            {
                // Optional: gas settings (left commented out, can be used if needed)
                // maxFeePerGas: feeData.maxFeePerGas,
                // maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                // gasPrice: gasPrice,
                nonce: nonceLatest
            }
        );

        console.log("Transaction sent:", tx.hash);

        // Wait for the transaction to be mined
        await tx.wait();

        console.log("NFT Minted Successfully!");

    } catch (error) {
        // Catch and log any errors that occur during transaction execution
        console.error("Error Minting NFTs:", error);
    }
}



async function batchMintOrUnlockSignMessageEIP712(toAddress: string, tokenIds: Array<number>, tokenURIs: Array<string>) {
    const requestNonce = Date.now();
    const futureTimestamp = Math.floor(Date.now() / 1000) + 120 * 100;
    console.log(requestNonce, futureTimestamp);

    const domain = {
        name: 'PhoenixNFTs',
        version: '1',
        chainId: chainId,
        verifyingContract: contractAddress
    };

    const types = {
        BatchMintOrUnlock: [
            { name: 'to', type: 'address' },
            { name: 'tokenIds', type: 'uint256[]' },
            { name: 'tokenURIs', type: 'string[]' },
            { name: 'requestNonce', type: 'uint256' },
            { name: 'futureTimestamp', type: 'uint256' }
        ]
    };

    const message = {
        to: toAddress,
        tokenIds: tokenIds,
        tokenURIs: tokenURIs,
        requestNonce: requestNonce,
        futureTimestamp: futureTimestamp
    };

    const signature = await admin.signTypedData(domain, types, message);

    console.log("Signature:", signature);

    batchMintOrUnlockSendTransaction(tokenIds, tokenURIs, requestNonce, futureTimestamp, signature);
}



// batchMintOrUnlockSignMessage("0x513c2ff203619F0e8576f316c9e654C014d88d05", [90, 96], ["https://arweave.net/WZBAnUAmSa6zl8K7", "https://arweave.net/RYut_fDWOHOV2WE_2u7Xtr7Ej0"])

batchMintOrUnlockSignMessageEIP712("0x087DDC2172C826350ff5E80D917393eb9cD28050", [1, 2], ["https://arweave.net/WZBAnUAmSa6zl8K7", "https://arweave.net/RYut_fDWOHOV2WE_2u7Xtr7Ej0"])