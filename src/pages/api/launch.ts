// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import ethers, { ZeroAddress, BigNumberish, parseUnits, Contract, formatUnits, parseEther, getBigInt, AbiCoder, } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

import erc20 from './erc20.json'
import { JsonRpcProvider } from "ethers";
import { Wallet } from "ethers";
import { ContractFactory } from "ethers";

type Data = {
  name: string;
};

// Constants
const HOOK_CONTRACT_ADDRESS = '0x3307Fd531412fc00a6001F21BF504D56a3508B72'; // Replace with actual hook contract address
const UNISWAP_V4_POOL_MANAGER_ADDRESS = '0x39BF2eFF94201cfAA471932655404F63315147a4'; // Replace with actual Uniswap V4 Pool Manager address

// Updated ABI for Uniswap V4 Pool Manager
const POOL_MANAGER_ABI = [
  "function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96, bytes calldata hookData) external returns (int24 tick)"
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  // const { tokenName, tokenSymbol, tokenDecimals, initialSupply, liquidity } = req.query
  // Connect to the Ethereum network
  const provider = new JsonRpcProvider('https://sepolia.base.org');
  const wallet = new Wallet('bb17feb252e3c81f344e55bd63fbe6495d754f3c9d1d3b8bc2876eb15a448050', provider);

  // Deploy ERC-20 Token
  const TokenFactory = new ContractFactory(erc20.abi, erc20.bytecode, wallet);
  const tokenName = "MyToken";
  const tokenSymbol = "MTK";
  const tokenDecimals = 18;
  const initialSupply = parseUnits("1000000", tokenDecimals); // 1 million tokens

  const token = await TokenFactory.deploy(tokenName, tokenSymbol, initialSupply);
  await token.deploymentTransaction()?.wait();
  console.log(`Token deployed at: ${await token.getAddress()}`);

  // Mint tokens
  const tokenContract = new Contract(await token.getAddress(), erc20.abi, wallet);

  console.log(`Minted ${formatUnits(initialSupply, tokenDecimals)} tokens`);

  // Approve Uniswap V4 Pool Manager as whitelisted spender.
  const spenderTx = await tokenContract.addWhitelistedSpender(UNISWAP_V4_POOL_MANAGER_ADDRESS);
  await spenderTx.wait();
  console.log("Approved Uniswap V4 Pool Manager as whitelisted spender");

  // Approve Uniswap V4 Pool Manager to spend tokens
  const approveTx = await tokenContract.approve(UNISWAP_V4_POOL_MANAGER_ADDRESS, initialSupply);
  await approveTx.wait();
  console.log("Approved Uniswap V4 Pool Manager to spend tokens");

  // Create liquidity pool on Uniswap V4const poolManager = new Contract(UNISWAP_V4_POOL_MANAGER_ADDRESS, POOL_MANAGER_ABI, wallet);
  const poolManager = new Contract(UNISWAP_V4_POOL_MANAGER_ADDRESS, POOL_MANAGER_ABI, wallet);

  console.log("PoolManager address:", poolManager.target);
  const token0Address = '0xa2D87E34E551c9ab5CAC5f37e9976AaBfC7778AB';
  const token1Address = '0x91D1e0b9f6975655A381c79fd6f1D118D1c5b958';
  // Ensure token0 is the lower address
  const [currency0, currency1] = token0Address.toLowerCase() < token1Address.toLowerCase()
    ? [token0Address, token1Address]
    : [token1Address, token0Address];

  const swapFee = 1; // 0.30% fee tier
  const tickSpacing = 1;
  const hookAddress = "0x33E2bEA214FF71c59c80c367686E5Ee56428eAe4"; // Replace with actual hook address
  
  // floor(sqrt(1) * 2^96)
  const startingPrice = getBigInt("79228162514264337593543950336");

  // Encode current timestamp for hook data
  const hookData = "0x"

  const poolKey = {
    currency0,
    currency1,
    fee: swapFee,
    tickSpacing,
    hooks: hookAddress
  };

  console.log("Initializing pool with key:", poolKey);
  console.log("Starting price:", startingPrice.toString());
  console.log("Hook data:", hookData);

  try {
    // Estimate gas
    const gasEstimate = await poolManager.initialize.estimateGas(
      poolKey,
      startingPrice,
      hookData
    );
    console.log("Estimated gas:", gasEstimate.toString());

    // Send the transaction
    const createPoolTx = await poolManager.initialize(
      poolKey,
      startingPrice,
      hookData
    );

    console.log("Transaction sent:", createPoolTx.hash);

    const receipt = await createPoolTx.wait();
    console.log("Liquidity pool created on Uniswap V4");
    console.log("Transaction receipt:", receipt);
  } catch (error) {
    console.error("Error creating pool:", error);
    if (error) {
      try {
        // const decodedError = poolManager.interface.parseError(error);
        console.log("Decoded error:", error);
      } catch (decodeError) {
        console.error("Failed to decode error:", decodeError);
      }
    }
  }

  res.status(200).json({ name: "John Doe" });
}
