const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Libraries", (m) => {
  const owner = m.getAccount(0);

  const types = m.library("Types", [], {
    from: owner,
    id: "Lib_Types",
  });
  const events = m.library("Events", [], {
    from: owner,
    id: "Lib_Events",
  });
  const errors = m.library("Errors", [], {
    from: owner,
    id: "Lib_Errors",
  });
  const helpers = m.library("Helpers", [], {
    from: owner,
    id: "Lib_Helpers",
  });
  const computations = m.library("Computation", [], {
    from: owner,
    id: "Lib_Computation",
  });
  const validations = m.library("Validation", [], {
    from: owner,
    id: "Lib_Validation",
  });
  const refunds = m.library("Refund", [], {
    from: owner,
    id: "Lib_Refund",
  });

  return { types, events, errors, helpers, computations, validations, refunds };
});
