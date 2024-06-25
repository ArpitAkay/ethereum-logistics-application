const DrivingLicenseNFT = artifacts.require("DrivingLicenseNFT");
const UserRoleRequest = artifacts.require("UserRoleRequest");
const ServiceRequest = artifacts.require("ServiceRequest");

module.exports = async function (deployer, network, accounts) {
  // Define Accounts that needs to be mapped to roles
  const admin_ = accounts[0];
  const shipper_ = accounts[1];
  const receiver_ = accounts[2];
  const driver1_ = accounts[3];
  const driver2_ = accounts[4];
  const driver3_ = accounts[5];
  const driver4_ = accounts[6];

  const usersInstance = await UserRoleRequest.deployed();
  const dlInstance = await DrivingLicenseNFT.deployed();
  const srInstance = await ServiceRequest.deployed();

  // Shipper
  await usersInstance.createUser("Shipper", "ttmzyseb", "+919876543210", {
    from: shipper_,
  });
  await usersInstance.createRoleRequest(2, {
    from: shipper_,
  });
  await usersInstance.approveOrRejectRoleRequest(0, true, {
    from: admin_,
  });

  // Receiver
  await usersInstance.createUser("Receiver", "ttmzys", "+919876543220", {
    from: receiver_,
  });
  await usersInstance.createRoleRequest(4, {
    from: receiver_,
  });
  await usersInstance.approveOrRejectRoleRequest(1, true, {
    from: admin_,
  });

  // Driver-1
  await usersInstance.createUser("First Driver", "ttt", "+919876543230", {
    from: driver1_,
  });
  await dlInstance.publicMint(
    "First Driver",
    "KA03MA1234567",
    "QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4",
    {
      from: driver1_,
      value: web3.utils.toWei("0.01", "ether"),
    }
  );
  await usersInstance.createRoleRequest(3, {
    from: driver1_,
  });
  await usersInstance.approveOrRejectRoleRequest(2, false, {
    from: admin_,
  });

  // Driver-2
  await usersInstance.createUser("Second Driver", "ttm", "+919876543420", {
    from: driver2_,
  });
  await dlInstance.publicMint(
    "Second Driver",
    "KA03MA2345678",
    "QmYA2fn8cMbVWo4v95RwcwJVyQsNtnEwHerfWR8UNtEwoE",
    {
      from: driver2_,
      value: web3.utils.toWei("0.01", "ether"),
    }
  );
  await usersInstance.createRoleRequest(3, {
    from: driver2_,
  });
  await usersInstance.approveOrRejectRoleRequest(3, true, {
    from: admin_,
  });

  // Driver-3
  await usersInstance.createUser("Third Driver", "ttmz", "+919876143220", {
    from: driver3_,
  });
  await dlInstance.publicMint(
    "Third Driver",
    "KA03MA3456789",
    "QmV9tSDx9UiPeWExXEeH6aoDvmihvx6jD5eLb4jbTaKGps",
    {
      from: driver3_,
      value: web3.utils.toWei("0.01", "ether"),
    }
  );
  await usersInstance.createRoleRequest(3, {
    from: driver3_,
  });
  await usersInstance.approveOrRejectRoleRequest(4, true, {
    from: driver2_,
  });

  // Driver-4
  await usersInstance.createUser("Forth Driver", "ttmz", "+919876143220", {
    from: driver4_,
  });
  await dlInstance.publicMint(
    "Forth Driver",
    "KA03MA3456789",
    "QmV9tSDx9UiPeWExXEeH6aoDvmihvx6jD5eLb4jbTaKGps",
    {
      from: driver4_,
      value: web3.utils.toWei("0.01", "ether"),
    }
  );
  await usersInstance.createRoleRequest(3, {
    from: driver4_,
  });
  await usersInstance.approveOrRejectRoleRequest(5, true, {
    from: driver2_,
  });

  // Fetch SR list
  const data_ = await srInstance.getAllSRs();
  console.log("SR List: ", data_);

  // Create New SR
  await srInstance.createNewSR(
    [
      1,
      "Mobile Delivery",
      shipper_,
      receiver_,
      "ttmzyseb",
      "ttmzys",
      "ttmzyse",
      "ttmzy",
      50,
      5,
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).getTime(),
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).getTime(),
      14400000, // After 4 hours
      "0x0000000000000000000000000000000000000000",
      1,
      "",
    ],
    "+919976543220",
    {
      from: shipper_,
      value: web3.utils.toWei("5", "ether"),
    }
  );
};
