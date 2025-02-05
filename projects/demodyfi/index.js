const { calculateUsdUniTvl } = require("../helper/getUsdUniTvl");
const sdk = require("@defillama/sdk");
const BigNumber = require("bignumber.js");
const wGLMR = "0x5f6c5C2fB289dB2228d159C69621215e354218d7"; 
const { unwrapUniswapLPs } = require("../helper/unwrapLPs");
const { transformBscAddress } = require("../helper/portedTokens");

async function dmodBscStakingPool(timestamp, block, chainBlocks) {
  const stakingBalance = new BigNumber(
    (
      await sdk.api.abi.call({
        abi: "erc20:balanceOf",
        chain: "bsc",
        target: "0x002D8563759f5e1EAf8784181F3973288F6856e4",
        params: ["0xc94e085E2E2D92A950fa4A6B923263C0B47c6dBa"],
        block: chainBlocks["bsc"],
      })
    ).output
  );

  const decimals = new BigNumber(
    (
      await sdk.api.abi.call({
        abi: "erc20:decimals",
        chain: "bsc",
        target: "0x002D8563759f5e1EAf8784181F3973288F6856e4",
        params: [],
        block: chainBlocks["bsc"],
      })
    ).output
  );

  return stakingBalance.div(new BigNumber(10).pow(decimals)).toFixed(0);
}

async function dmodEthereumStakingPool(timestamp, block, chainBlocks) {
  const stakingBalance = new BigNumber(
    (
      await sdk.api.abi.call({
        abi: "erc20:balanceOf",
        chain: "ethereum",
        target: "0x5f6c5c2fb289db2228d159c69621215e354218d7",
        params: ["0x024D59Ac0Bb03dEd28B9A16cd50B3d242B43a683"],
      })
    ).output
  );

  const decimals = new BigNumber(
    (
      await sdk.api.abi.call({
        abi: "erc20:decimals",
        chain: "ethereum",
        target: "0x5f6c5c2fb289db2228d159c69621215e354218d7",
        params: [],
      })
    ).output
  );

  return stakingBalance.div(new BigNumber(10).pow(decimals)).toFixed(0);
}

async function dmodBscLPPool(timestamp, block, chainBlocks) {
  const transform = await transformBscAddress();
  const balances = {};

  const lpTokenbalance = new BigNumber(
    (
      await sdk.api.abi.call({
        abi: "erc20:balanceOf",
        chain: "bsc",
        target: "0x0f35d854C267D29C0E418F561b75aE09B9E413D4",
        params: ["0xc94e085E2E2D92A950fa4A6B923263C0B47c6dBa"],
        block: chainBlocks["bsc"],
      })
    ).output
  );

  await unwrapUniswapLPs(
    balances,
    [
      {
        balance: lpTokenbalance,
        token: "0x0f35d854C267D29C0E418F561b75aE09B9E413D4",
      },
    ],
    block,
    (chain = "bsc"),
    transform
  );

  return balances;
}

async function dmodEthereumLPPool(timestamp, block, chainBlocks) {
  const balances = {};

  const lpTokenbalance = new BigNumber(
    (
      await sdk.api.abi.call({
        abi: "erc20:balanceOf",
        chain: "ethereum",
        target: "0xD5B1Cd8D245A93E0697707AEe82497388508b132",
        params: ["0x024D59Ac0Bb03dEd28B9A16cd50B3d242B43a683"],
      })
    ).output
  );

  await unwrapUniswapLPs(
    balances,
    [
      {
        balance: lpTokenbalance,
        token: "0xD5B1Cd8D245A93E0697707AEe82497388508b132",
      },
    ],
    block,
    (chain = "ethereum")
  );

  return balances;
}

async function bscTvl(timestamp, block, chainBlocks) {
  const balances = {};
  const stakingBalance = await dmodBscStakingPool(
    timestamp,
    block,
    chainBlocks
  );
  const lpBalances = await dmodBscLPPool(timestamp, block, chainBlocks);
  sdk.util.sumSingleBalance(balances, "demodyfi", stakingBalance);

  return { ...balances, ...lpBalances };
}

async function mainnetTvl(timestamp, block) {
  const balances = {};
  const stakingBalance = await dmodEthereumStakingPool(timestamp, block);
  const lpBalances = await dmodEthereumLPPool(timestamp, block);
  sdk.util.sumSingleBalance(balances, "demodyfi", stakingBalance);

  return { ...balances, ...lpBalances };
}

module.exports = {
  misrepresentedTokens: true,
  ethereum: {
    tvl: mainnetTvl,
  },
  bsc: {
    tvl: bscTvl,
  },
  moonbeam: {
    tvl: calculateUsdUniTvl(
      "0x61999fAb7fdcEe1B26b82b5c2f825BCC8F8c2458",
      "moonbeam",
      wGLMR,
      [],
      "moonbeam"
    ),
  },
};
