const ServiceRequest = artifacts.require("ServiceRequest");
const GeekToken = artifacts.require("GeekToken"); // Make sure to import your other contracts if necessary
const DisputedServiceRequest = artifacts.require("DisputedServiceRequest");
const UserRoleRequest = artifacts.require("UserRoleRequest");
const Types = artifacts.require("Types");
const Helpers = artifacts.require("Helpers");
const Errors = artifacts.require("Errors");
const Events = artifacts.require("Events");
const Computation = artifacts.require("Computation");
const Validation = artifacts.require("Validation");
const Refund = artifacts.require("Refund");

module.exports = async function (deployer, network, accounts) {
  // Define the initial owner of the GeekToken
  const initialOwner = accounts[0];

  // Link the libraries to the ServiceRequest contract
  deployer.link(Types, ServiceRequest);
  deployer.link(Helpers, ServiceRequest);
  deployer.link(Errors, ServiceRequest);
  deployer.link(Events, ServiceRequest);
  deployer.link(Computation, ServiceRequest);
  deployer.link(Validation, ServiceRequest);
  deployer.link(Refund, ServiceRequest);

  const geekTokenInstance = await GeekToken.deployed();

  const disputedServiceRequestInstance =
    await DisputedServiceRequest.deployed();

  const userRoleRequestInstance = await UserRoleRequest.deployed();

  // Deploy ServiceRequest contract and pass in the addresses of the other contracts
  await deployer.deploy(
    ServiceRequest,
    initialOwner,
    geekTokenInstance.address,
    disputedServiceRequestInstance.address,
    userRoleRequestInstance.address
  );
  const serviceRequestInstance = await ServiceRequest.deployed();
  console.log("ServiceRequest deployed at: ", serviceRequestInstance.address);
};
