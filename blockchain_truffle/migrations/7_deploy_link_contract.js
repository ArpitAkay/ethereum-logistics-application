const ServiceRequest = artifacts.require("ServiceRequest");
const GeekToken = artifacts.require("GeekToken");
const DisputedServiceRequest = artifacts.require("DisputedServiceRequest");
const UserRoleRequest = artifacts.require("UserRoleRequest");

module.exports = async function (_) {
  const geekTokenInstance = await GeekToken.deployed();
  const geekTokenAddress = await geekTokenInstance.address;
  console.log("geekTokenAddress: ", geekTokenAddress);

  const disputedServiceRequestInstance =
    await DisputedServiceRequest.deployed();
  const disputedServiceRequestAddress =
    await disputedServiceRequestInstance.address;
  console.log("disputedServiceRequestAddress: ", disputedServiceRequestAddress);

  const userRoleRequestInstance = await UserRoleRequest.deployed();
  const userRoleRequestAddress = await userRoleRequestInstance.address;
  console.log("userRoleRequestAddress: ", userRoleRequestAddress);

  const serviceRequestInstance = await ServiceRequest.deployed();
  const serviceRequestAddress = await serviceRequestInstance.address;
  console.log("serviceRequestInstance: ", serviceRequestAddress);

  await geekTokenInstance.updateServiceRequestAddress(serviceRequestAddress);
  console.log("Called updateServiceRequestAddress");

  await userRoleRequestInstance.setDisputeContractAddress(
    disputedServiceRequestAddress
  );
  console.log("Called setDisputeContractAddress");

  await disputedServiceRequestInstance.updateServiceRequestAddr(
    serviceRequestAddress
  );
  console.log("Called updateServiceRequestAddr");
};
