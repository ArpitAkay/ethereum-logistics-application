const DisputedServiceRequest = artifacts.require("DisputedServiceRequest");
const UserRoleRequest = artifacts.require("UserRoleRequest");
const Types = artifacts.require("Types");
const Helpers = artifacts.require("Helpers");
const Errors = artifacts.require("Errors");
const Events = artifacts.require("Events");

module.exports = async function (deployer, network, accounts) {
  // Define the initial owner of the DisputedServiceRequest contract
  const initialOwner = accounts[0];

  // Link the libraries to the DisputedServiceRequest contract
  deployer.link(Types, DisputedServiceRequest);
  deployer.link(Helpers, DisputedServiceRequest);
  deployer.link(Errors, DisputedServiceRequest);
  deployer.link(Events, DisputedServiceRequest);

  // Fetch the deployed UserRoleRequest contract instance
  const userRoleRequestInstance = await UserRoleRequest.deployed();

  // Deploy the DisputedServiceRequest contract
  await deployer.deploy(
    DisputedServiceRequest,
    initialOwner,
    userRoleRequestInstance.address
  );

  // Fetch the deployed contract instance
  const disputedServiceRequestInstance =
    await DisputedServiceRequest.deployed();

  console.log(
    `DisputedServiceRequest deployed at address: ${disputedServiceRequestInstance.address}`
  );
};
