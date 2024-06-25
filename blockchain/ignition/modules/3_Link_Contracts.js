const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const contractsModule = require("./2_Deploy_Contracts");

module.exports = buildModule("Link_Contracts", (m) => {
  const owner = m.getAccount(0);
  const { geekToken, disputeSR, usersContract, srContract } =
    m.useModule(contractsModule);

  // Link ServiceRequest address to GeekToken
  const token = m.contractAt("GeekToken", geekToken);
  m.call(token, "updateServiceRequestAddress", [srContract], {
    from: owner,
    id: "GeekToken_updateServiceRequestAddress",
  });

  // Link DisputedServiceRequest address to UserRoleRequest
  const users = m.contractAt("UserRoleRequest", usersContract);
  m.call(users, "setDisputeContractAddress", [disputeSR], {
    from: owner,
    id: "UserRoleRequest_setDisputeContractAddress",
  });

  // Link ServiceRequest address to DisputedServiceRequest
  const disputes = m.contractAt("DisputedServiceRequest", disputeSR);
  m.call(disputes, "updateServiceRequestAddr", [srContract], {
    from: owner,
    id: "DisputedServiceRequest_updateServiceRequestAddr",
  });

  return true;
});
