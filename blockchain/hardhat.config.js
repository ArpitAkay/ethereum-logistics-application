require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    development: {
      url: "http://127.0.0.1:7545", // Ganache
    },
    hardhat: {
      accounts: {
        count: 10,
        accountsBalance: "1000000000000000000000", // 1000 ETH
        mnemonic: "<YOUR_MEMONIC>",
      },
      chainId: 1337,
    },
    // sepolia: {
    //   url: "https://sepolia.infura.io/v3/<API_KEY>",
    //   accounts: ["<PRIVATE_KEY>"],
    // },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    ignition: "./ignition",
  },
  mocha: {
    timeout: 60000, // Tests will have maximum 60 seconds to complete
  },
};
