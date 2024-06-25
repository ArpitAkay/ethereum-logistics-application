const DrivingLicenseNFT = artifacts.require("DrivingLicenseNFT");
const Types = artifacts.require("Types");
const Helpers = artifacts.require("Helpers");
const Errors = artifacts.require("Errors");
const Validation = artifacts.require("Validation");

module.exports = async function (deployer, network, accounts) {
  // Define the initial owner of the DrivingLicenseNFT
  const initialOwner = accounts[0];

  // Link the libraries to the DrivingLicenseNFT contract
  deployer.link(Types, DrivingLicenseNFT);
  deployer.link(Helpers, DrivingLicenseNFT);
  deployer.link(Errors, DrivingLicenseNFT);
  deployer.link(Validation, DrivingLicenseNFT);

  // Deploy the DrivingLicenseNFT contract
  await deployer.deploy(DrivingLicenseNFT, initialOwner);

  // Fetch the deployed contract instance
  const drivingLicenseNFTInstance = await DrivingLicenseNFT.deployed();

  console.log(
    `DrivingLicenseNFT deployed at address: ${drivingLicenseNFTInstance.address}`
  );
};
