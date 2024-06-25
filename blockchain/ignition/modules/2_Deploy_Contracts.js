const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// We need to link libraries only if we have external functions
// Otherwise it will be auto linked/added and doesn't need to be linked.
module.exports = buildModule("Contracts", (m) => {
  const owner = m.getAccount(0);

  const geekToken = m.contract("GeekToken", [owner], {
    from: owner,
    id: "Contract_GeekToken",
  });

  const dlContract = m.contract("DrivingLicenseNFT", [owner], {
    from: owner,
    id: "Contract_DL",
  });

  const usersContract = m.contract("UserRoleRequest", [owner, dlContract], {
    from: owner,
    id: "Contract_Users",
    after: [dlContract],
    dependencies: {
      DrivingLicenseNFT: dlContract,
    },
  });

  const disputeSR = m.contract(
    "DisputedServiceRequest",
    [owner, usersContract],
    {
      from: owner,
      id: "Contract_DisputeSR",
      after: [usersContract],
      dependencies: {
        UserRoleRequest: usersContract,
      },
    }
  );

  const srContract = m.contract(
    "ServiceRequest",
    [owner, geekToken, disputeSR, usersContract],
    {
      from: owner,
      after: [geekToken, usersContract, disputeSR],
      id: "Contract_SR",
      libraries: {},
      dependencies: {
        DisputedServiceRequest: disputeSR,
        GeekToken: geekToken,
        UserRoleRequest: usersContract,
      },
    }
  );

  return { geekToken, dlContract, usersContract, disputeSR, srContract };
});
