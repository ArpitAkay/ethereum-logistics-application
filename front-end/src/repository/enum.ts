// Enums
export enum EUserRole {
  None,
  Admin,
  Shipper,
  Driver,
  Receiver,
}

export enum ERequestStatus {
  Pending,
  Approved,
  Rejected,
}

export enum EStatus {
  DRAFT,
  READY_FOR_AUCTION,
  DRIVER_ASSIGNED,
  READY_FOR_PICKUP,
  PARCEL_PICKED_UP,
  IN_TRANSIT,
  DELIVERED,
  CONDITIONALLY_ACCEPTED,
  UNCONDITIONALLY_ACCEPTED,
  CANCELLED,
  DISPUTE,
  DISPUTE_RESOLVED,
}

export enum EWhomToVote {
  Driver,
  Receiver,
}

export enum EAcceptance {
  CONDITIONAL,
  UNCONDITIONAL,
}

export enum EDisputeWinner {
  NONE = "",
  DRAW = "DRAW",
  DRIVER = "DRIVER",
  RECEIVER = "RECEIVER",
}
