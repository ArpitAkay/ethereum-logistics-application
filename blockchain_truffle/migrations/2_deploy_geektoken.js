const GeekToken = artifacts.require("GeekToken");
const Types = artifacts.require("Types");
const Events = artifacts.require("Events");
const Errors = artifacts.require("Errors");

module.exports = async function (deployer, network, accounts) {
  // Define the initial owner of the GeekToken
  const initialOwner = accounts[0];

  // Link the libraries to the GeekToken contract
  deployer.link(Types, GeekToken);
  deployer.link(Events, GeekToken);
  deployer.link(Errors, GeekToken);

  // Deploy the GeekToken contract
  await deployer.deploy(GeekToken, initialOwner);

  // Fetch the deployed contract instance
  const geekTokenInstance = await GeekToken.deployed();

  console.log(`GeekToken deployed at address: ${geekTokenInstance.address}`);
};
