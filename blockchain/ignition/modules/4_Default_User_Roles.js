const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const contractsModule = require("./2_Deploy_Contracts");

module.exports = buildModule("Default_User_Roles", (m) => {
  const owner = m.getAccount(0);
  const shipper = m.getAccount(1);
  const receiver = m.getAccount(2);
  const drivers = [m.getAccount(3), m.getAccount(4), m.getAccount(5)];

  const { dlContract, usersContract } = m.useModule(contractsModule);
  const users = m.contractAt("UserRoleRequest", usersContract);
  const dlNFT = m.contractAt("DrivingLicenseNFT", dlContract);

  // Create Shipper role
  const shipperCreate = m.call(
    users,
    "createUser",
    [`Shipper`, `shipper_unique_id`, `+919876143220`],
    {
      from: shipper,
      id: `createUser_shipper`,
      after: [users],
    }
  );
  const shipperRoleCreate = m.call(users, "createRoleRequest", [2], {
    from: shipper,
    id: `createRoleRequest_shipper`,
    after: [shipperCreate],
  });
  m.call(users, "approveOrRejectRoleRequest", [0, true], {
    from: owner,
    id: `approveOrRejectRoleRequest_shipper`,
    after: [shipperRoleCreate],
  });

  // Create Receiver role
  const receiverCreate = m.call(
    users,
    "createUser",
    [`Receiver`, `receiver_unique_id`, `+919896143220`],
    {
      from: receiver,
      id: `createUser_receiver`,
      after: [shipperRoleCreate],
    }
  );
  const receiverRoleCreate = m.call(users, "createRoleRequest", [4], {
    from: receiver,
    id: `createRoleRequest_receiver`,
    after: [receiverCreate],
  });
  m.call(users, "approveOrRejectRoleRequest", [1, true], {
    from: owner,
    id: `approveOrRejectRoleRequest_receiver`,
    after: [receiverRoleCreate],
  });

  // Create Driver roles
  for (const [index, driver] of drivers.entries()) {
    const driverCreate = m.call(
      users,
      "createUser",
      [`Driver-${index + 1}`, index == 3 ? "ttm" : "ttt", `+919879${index + 5}43220`],
      {
        from: driver,
        id: `createUser_driver_${index + 1}`,
        after: [dlNFT, receiverRoleCreate],
      }
    );

    const nftCreation = m.call(
      dlNFT,
      "publicMint",
      [
        `Driver-${index + 1}`,
        `KA03MA123456${index}`,
        `dummy_ipfs_hash_${index + 1}`,
      ],
      {
        from: driver,
        id: `DrivingLicenseNFT_${index + 1}`,
        // value: 1_000_000_000n, // 1gwei
        value: 10_000_000_000_000_000n, // 0.01 ETH
        after: [driverCreate],
      }
    );

    const roleCreation = m.call(users, "createRoleRequest", [3], {
      from: driver,
      id: `createRoleRequest_driver_${index + 1}`,
      after: [nftCreation],
    });

    m.call(users, "approveOrRejectRoleRequest", [index + 2, true], {
      from: owner,
      id: `approveOrRejectRoleRequest_driver_${index + 1}`,
      after: [roleCreation],
    });
  }

  return true;
});
