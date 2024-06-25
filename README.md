<p align="center">
  <img width="100%" alt="front-end-screenshot" src="...to be updated">
</p>

## Important Links

- [Demo link](...to be updated)
- [Contract Address](...to be updated)
- [Contract Creator](...to be updated)
- [Tx Hash of contract creation](...to be updated)

# Logistics Delivery Application

### Problem Statement

In many parts of the world, part-time jobs and freelancing are increasingly common across various sectors, including logistics and parcel delivery.

#### Current Scenario

Let's consider an example to illustrate the problem:

- **Person A** wants to transfer a parcel from **Location A** to **Location B**.
- Currently, Person A has to rely on established logistics companies with fixed service fees, offering no flexibility for negotiation or alternate fee options.
- Delivery partners working for these logistics companies are bound by strict commitments, restricting their ability to take breaks or leave at will.
- Delivery partners cannot set their own fees or choose orders based on convenience, such as picking orders closer to their home at the end of a shift.
- Additionally, logistics companies may store and sell customer data to third parties, increasing the risk of data breaches and personal information misuse.

#### Issues

- **Lack of Flexibility in Service Fees**: Shippers like Person A cannot negotiate or select different service fees.
- **Binding Commitments for Delivery Partners**: These commitments limit the flexibility of delivery partners in managing their work schedules.
- **Inability to Choose Orders**: Delivery partners lack the freedom to select orders based on their preferences or convenience.
- **Data Security Concerns**: Possibility of data breaches and misuse of personal information.

### Solution

We propose a blockchain-based solution with an auction system for service requests to address these issues.

#### How It Works

- **Service Request Creation**: The shipper (Person A) creates a service request to transfer a parcel to the recipient (Person B), specifying the service fee they are willing to pay.
- **Auction System**: Delivery partners can see the service request and participate in a Dutch auction, with bids hidden from each other.
- **Driverless NFT**: Delivery partners need a Driverless NFT, created from a government-issued ID, to participate.
- **Bidding Process**: Delivery partners place their bids and stake an insured cargo value equivalent to the item's value.
- **Selection and Allocation**: The delivery partner with the lowest bid wins and is assigned the service request.
- **Delivery and Payment**: Upon successful delivery, the delivery partner receives their bid amount, and any unspent portion of the service fee is refunded to the shipper.
- **Dispute Resolution**: Any disputes are resolved through a voting system involving DAO members.

#### Benefits

- **Flexibility in Service Fees**: Shippers can set their preferred service fees.
- **Autonomy for Delivery Partners**: They can bid for jobs based on convenience and preferred fees.
- **Transparency and Security**: Blockchain technology ensures secure and transparent transactions.
- **Data Privacy**: Reduces the risk of data breaches.
- **Verification and Trust**: Driverless NFTs ensure that only verified individuals can participate in the delivery process.
- **Dispute Resolution**: A fair and transparent system is in place for resolving disputes.
- **Additional Incentives**: Delivery partners earn tokens for successful deliveries, offering additional income opportunities.

## Implementation of Logistics Delivery Application

### Requirements

- **Metamask Wallet**: Users need a Metamask wallet to interact with the contract.
- **User Roles**: Roles include Admin, Shipper, Driver, and Receiver.
- **Driving License NFT**: Required to apply for the Driver role.
- **Blockchain Network**: We use the Sepolia network for our contracts.
- **User Interface**: We have created a webpage with React and Redux for user interactions.

### Features

- **Role Management**: Users can request and approve different roles.
- **Service Request Management**: Shippers can create and manage service requests.
- **Auction System**: Drivers can bid on service requests.
- **Dispute Resolution**: Disputes are handled through DAO voting.
- **Reward Mechanism**: Drivers receive tokens for completed deliveries.

### Assumptions

- We assume users provide accurate location data and timestamps.
- Service fees and cargo insurance values are in ETH.

## How it works

<p align="center">
  <img width="100%" alt="logistics-delivery-application" src="https://git.geekyants.com/arpitk/logistics-project/-/blob/main/assests/Logistics%20Delivery.jpg?raw=true">
</p>

## How the Users and Roles are managed

<p align="center">
  <img width="100%" alt="user-flow" src="https://git.geekyants.com/arpitk/logistics-project/-/blob/main/assests/Logistics%20Delivery.jpg?raw=true">
</p>

## How the Dispute Resolution works

<p align="center">
  <img width="100%" alt="dispute-flow" src="https://git.geekyants.com/arpitk/logistics-project/-/blob/main/assests/Logistics%20Delivery.jpg?raw=true">
</p>

## Let's start with Smart Contracts

[Do platform Setup!](SETUP.md)

## Solidity

<details open>
  <summary><font size="+0.85"> &nbsp;&nbsp;Objects </font></summary>

```c++
  enum Role {
    None,
    Admin,
    Shipper,
    Driver,
    Receiver
  }

  enum RequestStatus {
    Pending,
    Approved,
    Rejected
  }

  enum Status {
    DRAFT, // Created by Shipper
    READY_FOR_AUCTION, // Updated by Shipper
    DRIVER_ASSIGNED, // Updated by System
    READY_FOR_PICKUP, // Updated by Shipper
    PARCEL_PICKED_UP, // Updated by Driver
    IN_TRANSIT, // Updated by Driver
    DELIVERED, // Updated by Driver
    CONDITIONALLY_ACCEPTED, // Updated by Receiver
    UNCONDITIONALLY_ACCEPTED, // Updated by Receiver
    CANCELLED, // Updated by Shipper (Only in DRAFT status)
    DISPUTE, // Updated by Receiver
    DISPUTE_RESOLVED // Updated by System
  }

  enum WhomToVote {
    Driver,
    Receiver
  }

  enum Acceptance {
    CONDITIONAL,
    UNCONDITIONAL
  }

  struct RoleRequest {
    uint256 requestId;
    address applicantUID;
    Role requestedRole;
    RequestStatus requestStatus;
    address approverUID; // Person who approves or rejects the request
  }

  struct User {
    string name;
    address uid;
    string phoneNumberWithISO;
    string serviceGeoHash;
    uint ratingStarsInt;
    string ratingStarsString;
    Role[] role;
  }

  /**
   * @dev For finding out role request info and it's index for updation in User Role Request contract
   */
  struct RoleRequestWithIndexDto {
    RoleRequest roleRequest;
    uint index;
  }

  struct DrivingLicenseInfo {
    string name;
    string id;
    string image;
  }

  struct DriverInfo {
    address driverUID;
    uint256 serviceFee;
    uint256 cargoInsuranceValue;
    bool cargoValueRefunded;
    bool serviceFeeRefunded;
  }

  /**
   * @dev For Maintaining vote count for Driver & Receiver in case of dispute
   */
  struct VoteCount {
    uint256 driver;
    uint256 receiver;
    uint256 total;
  }

  struct SRInfo {
    uint256 requestId;
    string description;
    address shipperUID;
    address receiverUID;
    string originGeoHash; // Origin geo hash from where parcel has to be picked up
    string destGeoHash; // Destination geo hash from where parcel has to dropped
    string originApproxGeoHash; // Approx geo hash for origin
    string destApproxGeoHash; // Approx geo hash for destination
    uint256 cargoInsurableValue; // Product Value
    uint256 serviceFee; // Delivery charges that shipper is willing to pay
    uint256 requestedPickupTime; // Time at which parcel has to be picket up (In timestamp - seconds)
    uint256 requestedDeliveryTime; // Time at which parcel has to be dropped (In timestamp - seconds)
    uint256 auctionEndTime; // After how many minutes auction should end (Number - minutes)
    address driverUID; // System will update this after auction ends
    Status status;
    string disputeWinner; // empty or DRAW or DRIVER or RECEIVER
  }

  /**
   * @dev For finding out SR info and it's index for updation in Dispute Service Request contract
   */
  struct SRResult {
    Types.SRInfo sr;
    uint256 index;
  }
```

</details>
<details>
  <summary><font size="+0.85"> &nbsp;&nbsp;DrivingLicenseNFT Functions </font></summary>

| **Function Name**               | **Input Params**                                                             | **Return value**   | **Description**                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| publicMint()                    | string \_driverName,<br> string \_driverLicenseNumber,<br> string \_ipfsHash | -                  | Mints a new token to the sender and stores the driver's information. |
| validateNFT()                   | address \_addr                                                               | bool               | Validates if the address owns a valid NFT.                           |
| getDriverLicenseInfoByTokenId() | uint256 \_tokenId                                                            | DrivingLicenseInfo | Retrieves the driver's information by token ID.                      |
| burn()                          | uint256 \_tokenId                                                            | -                  | Burns the token.                                                     |

</details>
<details>
  <summary><font size="+0.85"> &nbsp;&nbsp;User Functions </font></summary>

| **Function Name**            | **Input Params**                                                                                                                       | **Return value** | **Description**                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| createUser()                 | string \_name,<br> string \_geoHash                                                                                                    | -                | Creates a new user.                                                                                                                               |
| createRoleRequest()          | Role \_requestedRole                                                                                                                   | -                | Creates a new role request.                                                                                                                       |
| approveOrRejectRoleRequest() | uint256 \_roleRequestId,<br> bool \_approve                                                                                            | -                | Approves or rejects a role request.                                                                                                               |
| getAllRoleRequests()         | -                                                                                                                                      | RoleRequest[]    | Retrieves all role requests.                                                                                                                      |
| getMyRoleRequests()          | -                                                                                                                                      | RoleRequest[]    | Retrieves role requests for the caller.                                                                                                           |
| getRoleRequestsInMyRegion()  | -                                                                                                                                      | RoleRequest[]    | Retrieves role requests in the caller's region.                                                                                                   |
| getUserGeoHash()             | address \_uid                                                                                                                          | string           | Retrieves serviceGeoHash for a user.                                                                                                              |
| isUserRegistered()           | address \_userAddr                                                                                                                     | -                | Checks if a user is registered.                                                                                                                   |
| createSRRoleCheck()          | address \_shipper,<br> address \_receiverUID,<br> string \_receiverName,<br> string \_receiverGeoHash,<br> string \_phoneNumberWithISO | -                | Checks if the shipper and receiver exist and assigns the Receiver role if not already assigned; also checks if the Shipper has the required role. |
| hasRoleShipper()             | address \_addr                                                                                                                         | -                | Checks if a user is a Shipper.                                                                                                                    |
| hasRoleDriver()              | address \_addr                                                                                                                         | -                | Checks if a user is a Driver.                                                                                                                     |
| hasRoleReceiver()            | address \_addr                                                                                                                         | -                | Checks if a user is a Receiver.                                                                                                                   |
| isAdmin()                    | address \_addr                                                                                                                         | -                | Checks if a user is an Admin.                                                                                                                     |
| deductStars()                | address \_addr                                                                                                                         | -                | Deducts stars from a Driver's rating.                                                                                                             |
| getUserInfo()                | address \_addr                                                                                                                         | "User" object    | Returns user details for the provided UID                                                                                                         |
| updateUserInfo()             | string \_name,<br> string \_geoHash,<br> string \_phoneNumberWithISO                                                                   | "User" object    | Update the basic user details & returns back the updated object                                                                                   |

</details>
<details>
<summary><font size="+0.85"> &nbsp;&nbsp;Dispute Functions </font></summary>

| **Function Name**              | **Input Params**                           | **Return value** | **Description**                                                      |
| ------------------------------ | ------------------------------------------ | ---------------- | -------------------------------------------------------------------- |
| vote()                         | uint256 \_srId,<br>WhomToVote \_whomToVote | -                | Allows a user to vote on a disputed service request                  |
| getAllDisputedSRInDriverArea() | -                                          | SRInfo[]         | Retrieves all disputed service requests in the driver's service area |

</details>
<details>
<summary><font size="+0.85"> &nbsp;&nbsp;Service Request Functions </font></summary>

| **Function Name**                | **Input Params**                                                                                                                             | **Return value** | **Description**                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| createNewSR()                    | SRInfo \_srInfo,<br> string \_receiverPhoneNoWithISO                                                                                         | -                | Creates a new service request and adds it to the state variable srInfos          |
| editDraftSR()                    | string \_requestId,<br>Status \_newStatus,<br>uint256 \_requestedPickupTime,<br>uint256 \_requestedDeliveryTime,<br>uint256 \_auctionEndTime | -                | Edits an existing draft service request                                          |
| cancelSR()                       | string \_requestId                                                                                                                           | -                | Cancels a service request if it is in draft mode                                 |
| dutchBid()                       | string \_requestId,<br>uint256 \_serviceFee                                                                                                  | -                | Places a dutch bid on a service request                                          |
| declareWinner()                  | string \_requestId                                                                                                                           | -                | Declares the winner of an auction for a service request                          |
| updateSRStatus()                 | string \_requestId,<br>Status \_newStatus                                                                                                    | -                | Updates the status of a service request                                          |
| getAuctionSRListinDriverRegion() | -                                                                                                                                            | SRInfo[]         | Retrieves all service requests in the driver's region that are ready for auction |
| getAllSRs()                      | -                                                                                                                                            | SRInfo[]         | Retrieves all service requests                                                   |
| decideWinnerForDispute()         | string \_requestId                                                                                                                           | -                | Decides the winner of a dispute for a service request                            |

</details>
<details>
<summary><font size="+0.85"> &nbsp;&nbsp;Events </font></summary>

| **Event Name**       | **Params**                                                              | **Description**                                                    |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| TransferedTokens     | address \_from,<br>address \_to,<br>uint256 \_tokens                    | Triggers when tokens are transferred                               |
| NewUserAdded         | string \_name,<br>address \_uid,<br>string \_serviceGeoHash             | Triggers when a new user is added                                  |
| NewRoleRequestAdded  | uint256 \_requestId,<br>address \_applicantUID,<br>Role \_requestedRole | Triggers when a new role request is added                          |
| NewSRInDisputeSystem | address \_from,<br>uint256 \_srId,<br>SRInfo \_srInfo                   | Triggers when a new service request is added to the dispute system |
| NewVoteAdded         | uint256 \_srId,<br>string message                                       | Triggers when a new vote is added to a disputed service request    |
| NewSRAdded           | SRInfo \_srInfo,<br>address \_creator,<br>string message                | Triggers when a new service request is added                       |
| SRUpdated            | SRInfo \_srInfo,<br>address \_creator,<br>string message                | Triggers when a service request is updated                         |
| SRCancelled          | string \_requestId,<br>address \_canceller,<br>string message           | Triggers when a service request is cancelled                       |
| NewBidEntry          | string \_requestId,<br>address \_bidder,<br>uint256 \_serviceFee        | Triggers when a new bid is placed on a service request             |
| AuctionResults       | string \_requestId,<br>address \_winner,<br>string message              | Triggers when the auction for a service request has a winner       |
| DisputedSRResult     | string \_requestId,<br>string message                                   | Triggers when a dispute resolution result is declared              |

</details>
<details>
<summary><font size="+0.85"> &nbsp;&nbsp;Errors </font></summary>

| **Error Name**           | **Params**                                           | **Description**                                                         |
| ------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| AccessDenied             | address from, string message                         | Triggers when access is denied                                          |
| NotAuthorized            | address uid, string message                          | Triggers when a user is not authorized to perform an action             |
| InvalidInput             | address uid, string message                          | Triggers when the input is invalid                                      |
| NotSufficientFunds       | address account, string message                      | Triggers when the account does not have sufficient funds                |
| OnlyDisputedSRCanBeAdded | address from, Types.SRInfo srInfo                    | Triggers when a service request is not in dispute                       |
| AlreadyVoted             | uint256 srId, string message                         | Triggers when a user has already                                        |
| VotingEndedAlready       | uint256 srId, string message                         | Triggers when voting has already ended                                  |
| SelfVoteNotAllowed       | uint256 srId, string message                         | Triggers when a user tries to vote for themselves                       |
| VotingInProgress         | address from, uint256 srId, string message           | Triggers when voting is in progress                                     |
| InvalidDLInput           | string name, string value, string message            | Triggers when the input for a driving license is invalid                |
| PublicMintError          | string name, string id, string image, string message | Triggers when there is an error in minting a public token               |
| InternalMintError        | address from, address to, string message             | Triggers when there is an internal error in minting a token             |
| DLInfoNotFound           | uint256 tokenId, string message                      | Triggers when the driving license information is not found              |
| OwnerUnauthorized        | uint256 tokenId, string message                      | Triggers when the owner is unauthorized to perform an action            |
| NFTNotFound              | address uid, string message                          | Triggers when an NFT is not found                                       |
| UserNotRegistered        | address uid, string message                          | Triggers when a user is not registered                                  |
| UserAlreadyExists        | address uid, string message                          | Triggers when a user already exists                                     |
| RequestAlreadyProcessed  | address uid, string message, uint256 requestId       | Triggers when a role request has already been processed                 |
| InvalidSRStatus          | Types.Status status, string message                  | Triggers when the status of a service request is invalid                |
| InvalidValue             | string value, string message                         | Triggers when the value is invalid                                      |
| InvalidGeoHash           | string geoHash, string message                       | Triggers when the geo hash is invalid                                   |
| InvalidProductValue      | uint256 value, string message                        | Triggers when the product value is invalid                              |
| InvalidAuctionTime       | uint256 timestamp, string message                    | Triggers when the auction time is invalid                               |
| SRDoesNotExists          | uint256 srId, string message                         | Triggers when a service request does not exist                          |
| SRCannotBeUpdated        | uint256 srId, string message                         | Triggers when a service request cannot be updated                       |
| SRAccessDenied           | uint256 srId, string message                         | Triggers when access is denied for a service request                    |
| SRCannotBeCancelled      | uint256 srId, string message                         | Triggers when a service request cannot be cancelled                     |
| AuctionNotStarted        | uint256 srId, string message                         | Triggers when the auction has not started for a service request         |
| AuctionEnded             | uint256 srId, string message                         | Triggers when the auction has ended for a service request               |
| SROutOfRegion            | uint256 srId, string message                         | Triggers when a service request is out of the driver's region           |
| AlreadyBidded            | address bidder, string message                       | Triggers when a user has already placed a bid                           |
| AuctionInProgress        | uint256 srId, string message                         | Triggers when the auction is in progress for a service request          |
| SRDisputeAlreadyResolved | uint256 srId, string message                         | Triggers when a dispute for a service request has already been resolved |

</details>
<details open>
<summary><font size="+0.85"> &nbsp;&nbsp;Versions </font></summary>

- Compiler: `solc: v0.8.24+commit.e11b9ed9`
- Truffle: `v5.11.5`
- Hardhat: `v2.22.4`
- Node: `v18.16.1 (or above)`

</details>

## Quick Start

- Navigate inside the project

  ```sh
  cd logistics-project/blockchain
  ```

- Install the dependencies

  ```sh
  npm install
  ```

- Update the Metamask Pass phrase in `hardhat.config.js` file at `hardhat.accounts.mnemonic`

- Start the hardhat Node

  ```sh
  npm start
  ```

- Open new Terminal at same path & Compile the contracts

  ```sh
  npm run compile
  ```

- Deploy to localhost/hardhat

  <i>\_Note depending on hardhat node port number, you need to change in hardhat config file</i>

  ```sh
  npm run deploy:reset
  ```

- Add Hardhat as a network in the Metamask by following [this link](https://docs.metamask.io/wallet/how-to/run-devnet/#connect-to-hardhat-network), You can Navigate to Step-5 in the guide directly.

## Team ✨ (...to be updated)

Meet the amazing team who developed this project.

- Suresh Konakachi
- Arpit Kumar
- Mohamed Farhan S
- Anuj Singh
- Pallab Singha

# How frontend works

... Add Screenshots with headings
