const Types = artifacts.require("Types");
const Events = artifacts.require("Events");
const Errors = artifacts.require("Errors");
const Helpers = artifacts.require("Helpers");
const Computation = artifacts.require("Computation");
const Validation = artifacts.require("Validation");
const Refund = artifacts.require("Refund");

module.exports = async function (deployer, network, accounts) {
  // Define the initial owner
  const initialOwner = accounts[0];

  // Deploy the GeekToken contract
  await deployer.deploy(Types, initialOwner);
  await deployer.deploy(Events, initialOwner);
  await deployer.deploy(Errors, initialOwner);
  await deployer.deploy(Helpers, initialOwner);
  await deployer.deploy(Computation, initialOwner);
  await deployer.deploy(Validation, initialOwner);
  await deployer.deploy(Refund, initialOwner);
};
