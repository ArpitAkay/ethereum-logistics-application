const UserRoleRequest = artifacts.require("UserRoleRequest");
const DrivingLicenseNFT = artifacts.require("DrivingLicenseNFT");
const Types = artifacts.require("Types");
const Helpers = artifacts.require("Helpers");
const Errors = artifacts.require("Errors");
const Computation = artifacts.require("Computation");
const Events = artifacts.require("Events");

module.exports = async function (deployer, network, accounts) {
  // Define the initial owner of the UserRoleRequest contract
  const initialOwner = accounts[0];

  // Link the libraries to the UserRoleRequest contract
  deployer.link(Types, UserRoleRequest);
  deployer.link(Helpers, UserRoleRequest);
  deployer.link(Errors, UserRoleRequest);
  deployer.link(Computation, UserRoleRequest);
  deployer.link(Events, UserRoleRequest);

  // Fetch the deployed DrivingLicenseNFT contract instance
  const drivingLicenseNFTInstance = await DrivingLicenseNFT.deployed();

  // Deploy the UserRoleRequest contract
  await deployer.deploy(
    UserRoleRequest,
    initialOwner,
    drivingLicenseNFTInstance.address
  );

  // Fetch the deployed contract instance
  const userRoleRequestInstance = await UserRoleRequest.deployed();

  console.log(
    `UserRoleRequest deployed at address: ${userRoleRequestInstance.address}`
  );
};
