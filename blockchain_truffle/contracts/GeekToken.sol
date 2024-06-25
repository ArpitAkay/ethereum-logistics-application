// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/Types.sol";
import "./libraries/Events.sol";
import "./libraries/Errors.sol";

/**
 * @title GeekToken: A Custom ERC20 Token for a Logistics platform with reward mechanisms.
 * @author Suresh Konakanchi
 * @notice This contract handles minting, pausing, and custom token reward functionalities.
 * @dev Extends ERC20 standard with additional features like burnable and pausable tokens.
 */
contract GeekToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
  // Max Supply 10 million (1 crore) tokens
  uint256 internal maxSupply = 10000000 * (10 ** decimals());
  // Address of the Service Request Contract that can interact with this token contract.
  address srContractAddr = address(0);

  /**
   * @dev Sets the token details and mints initial tokens to the deploying address.
   * @param initialOwner Address to be set as the initial owner, typically the deploying address.
   */
  constructor(
    address initialOwner
  ) ERC20("GeekToken", "GTK") Ownable(initialOwner) {
    // Mint 2.5 million (25 lakh = 25%) tokens to the owner
    _mint(msg.sender, 2500000 * 10 ** decimals());
  }

  /**
   * @dev Ensures that the caller is the designated Service Request Contract.
   * @param _addr Address of the caller to be validated.
   */
  modifier isServiceRequestContract(address _addr) {
    if (srContractAddr != _addr) {
      revert Errors.AccessDenied({
        from: _addr,
        message: "You are not allowed to call this method"
      });
    }
    _;
  }

  /**
   * @notice Updates the address of the Service Request Contract.
   * @param _addr The new address of the Service Request Contract.
   * @dev Only callable by the owner of the token contract.
   */
  function updateServiceRequestAddress(address _addr) external onlyOwner {
    srContractAddr = _addr;
  }

  /**
   * @notice Pauses all token transfers.
   * @dev Can only be called by the owner.
   */
  function pause() public onlyOwner {
    _pause();
  }

  /**
   * @notice Unpauses all token transfers.
   * @dev Can only be called by the owner.
   */
  function unpause() public onlyOwner {
    _unpause();
  }

  /**
   * @notice Mints new tokens up to the maxSupply limit.
   * @param to The address to which the minted tokens will be sent.
   * @param amount The amount of tokens to mint.
   * @dev Can only be called by the owner.
   */
  function mint(address to, uint256 amount) public onlyOwner {
    require(totalSupply() + amount <= maxSupply, "We sold out");
    _mint(to, amount);
  }

  /**
   * Override required by Solidity for functions that modify token balances.
   */
  function _update(
    address from,
    address to,
    uint256 value
  ) internal override(ERC20, ERC20Pausable) {
    super._update(from, to, value);
  }

  /**
   * @notice Calculates the reward in tokens based on the insured value and status of delivery acceptance.
   * @param cargoInsuredValue The value of the cargo insured, used to calculate rewards.
   * @param acceptance The delivery acceptance status, affecting the reward calculation.
   * @return _reward The amount of tokens to be rewarded.
   */
  function tokenReward(
    uint256 cargoInsuredValue,
    Types.Status acceptance
  ) internal view returns (uint256) {
    if (
      acceptance != Types.Status.CONDITIONALLY_ACCEPTED &&
      acceptance != Types.Status.UNCONDITIONALLY_ACCEPTED
    ) {
      return 0;
    }

    uint256 _reward = 0;
    uint256 _totalSupply = totalSupply();
    // Reward calculation logic based on total supply and acceptance status.
    if (
      _totalSupply >= ((maxSupply * 25) / 100) &&
      _totalSupply < ((maxSupply * 50) / 100)
    ) {
      if (acceptance == Types.Status.UNCONDITIONALLY_ACCEPTED)
        _reward = (2 * cargoInsuredValue * (10 ** decimals())) / 100;
      else _reward = (1 * cargoInsuredValue * (10 ** decimals())) / 100;
    } else if (
      _totalSupply >= ((maxSupply * 50) / 100) &&
      _totalSupply < ((maxSupply * 75) / 100)
    ) {
      if (acceptance == Types.Status.UNCONDITIONALLY_ACCEPTED)
        _reward = (1 * cargoInsuredValue * (10 ** decimals())) / 100;
      else _reward = (5 * cargoInsuredValue * (10 ** decimals())) / 1000;
    } else if (
      _totalSupply >= ((maxSupply * 75) / 100) &&
      _totalSupply < ((maxSupply * 95) / 100)
    ) {
      if (acceptance == Types.Status.UNCONDITIONALLY_ACCEPTED)
        _reward = (5 * cargoInsuredValue * (10 ** decimals())) / 1000;
      else _reward = (25 * cargoInsuredValue * (10 ** decimals())) / 10000;
    } else {
      _reward = 0;
    }

    return _reward;
  }

  /**
   * @notice Transfers reward tokens to a designated recipient upon service acceptance.
   * @param to The recipient address.
   * @param cargoInsurableValue The insurable value of the cargo, used for calculating rewards.
   * @param acceptance The acceptance status of the service, influencing reward amount.
   * @dev Can only be called by the designated Service Request Contract.
   */
  function transferTokens(
    address to,
    uint256 cargoInsurableValue,
    Types.Status acceptance
  ) external isServiceRequestContract(msg.sender) {
    uint256 tokensToReward = tokenReward(
      cargoInsurableValue / (10 ** 18), // Adjusting from wei to tokens.
      acceptance
    );

    address ownerAddr = owner();
    // Ensure sufficient balance and transfer tokens.
    if (tokensToReward > 0 && balanceOf(ownerAddr) >= tokensToReward) {
      _transfer(owner(), to, tokensToReward);
    }
    // Emitting an event after token transfer.
    emit Events.TransferedTokens(address(this), to, tokensToReward);
  }
}
