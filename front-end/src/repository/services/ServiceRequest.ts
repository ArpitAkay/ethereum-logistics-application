import Web3 from "web3";
import ContractABI from "../abi/ServiceRequest.json";
import { SERVICE_REQUEST_ADDRESS } from "../config";
import { ISRInfo } from "../interfaces";
import { EStatus } from "../enum";

declare let window: any;

export class ServiceRequestService {
  private static instance: ServiceRequestService;
  private _serviceRequestContract!: any;
  private _accountAddress: string | undefined;

  constructor() {
    this.ethEnabled();
  }

  public static getInstance(): ServiceRequestService {
    if (!ServiceRequestService.instance) {
      ServiceRequestService.instance = new ServiceRequestService();
    }
    return ServiceRequestService.instance;
  }

  checkedWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return false;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x539` }],
      });
      this._accountAddress = accounts[0];
      this._serviceRequestContract = this.getContract();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  async ethEnabled() {
    return await this.checkedWallet();
  }

  getContract() {
    const provider = new Web3(window.ethereum);
    return new provider.eth.Contract(
      ContractABI["abi"],
      SERVICE_REQUEST_ADDRESS
    );
  }

  // Only ADMIN can call this method
  async getSRList(): Promise<ISRInfo[]> {
    try {
      await this.ethEnabled();
      const _srList: ISRInfo[] = await this._serviceRequestContract.methods
        .getAllSRs()
        .call({ from: this._accountAddress });
      return _srList;
    } catch (error) {
      console.log(error, "error");
      throw new Error("Error while fetching sr list");
    }
  }

  async getMySRList(): Promise<ISRInfo[]> {
    try {
      await this.ethEnabled();
      const _srList: ISRInfo[] = await this._serviceRequestContract.methods
        .getMySRs()
        .call({ from: this._accountAddress });
      return _srList;
    } catch (error) {
      console.log(error, "error");
      throw new Error("Error while fetching sr list");
    }
  }

  async getAuctionsInDriverRegion(): Promise<ISRInfo[]> {
    try {
      await this.ethEnabled();
      const _srList: ISRInfo[] = await this._serviceRequestContract.methods
        .getAuctionSRListinDriverRegion()
        .call({ from: this._accountAddress });
      return _srList;
    } catch (error) {
      console.log(error, "error");
      throw new Error("Error while fetching sr list in driver service region");
    }
  }

  async checkForAuctionWinner(requestId: number): Promise<void> {
    if (requestId < 0) throw new Error("Invalid Request Id");
    try {
      await this.ethEnabled();
      await this._serviceRequestContract.methods
        .declareWinner(requestId)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Declare winner reverted");
    }
  }

  async updateStatus(requestId: number, updatedStatus: EStatus): Promise<void> {
    if (requestId < 0) throw new Error("Invalid Request Id");
    try {
      await this.ethEnabled();
      await this._serviceRequestContract.methods
        .updateSRStatus(requestId, updatedStatus)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to update SR status");
    }
  }

  async addBidEntry(
    requestId: number,
    serviceFee: number,
    stakeValue: number
  ): Promise<void> {
    if (requestId < 0) throw new Error("Invalid Request Id");
    try {
      await this.ethEnabled();
      await this._serviceRequestContract.methods
        .dutchBid(requestId, serviceFee)
        .send({
          value: Web3.utils.toWei(stakeValue.toString(), "ether"),
          from: this._accountAddress,
        });
    } catch (error) {
      console.log(error);
      throw new Error("Adding entry to Duction Auction failed");
    }
  }

  async cancelServiceRequest(requestId: number): Promise<void> {
    if (requestId < 0) throw new Error("Invalid Request Id");
    try {
      await this.ethEnabled();
      await this._serviceRequestContract.methods
        .cancelSR(requestId)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to cancel/delete the SR!");
    }
  }

  async addNewServiceRequest(
    srData: ISRInfo,
    _receiverPhoneNoWithISO: string
  ): Promise<void> {
    if (!_receiverPhoneNoWithISO)
      throw new Error("Receiver phone number with ISO code is required");
    try {
      await this.ethEnabled();
      if (this._accountAddress) srData.shipperUID = this._accountAddress;
      await this._serviceRequestContract.methods
        .createNewSR(srData, _receiverPhoneNoWithISO)
        .send({
          from: this._accountAddress,
          value: Web3.utils.toWei(srData.serviceFee.toString(), "ether"),
        });
    } catch (error) {
      console.log("Failed to create new SR!", error);
      throw new Error("Failed to create SR!");
    }
  }

  async editServiceRequest(
    requestId: number,
    status: EStatus,
    pickupTimeEpoch: number,
    deliveryTimeEpoch: number,
    auctionEndTimeInMinutes: number
  ): Promise<void> {
    if (requestId < 0) throw new Error("Invalid Request Id");
    if (pickupTimeEpoch === 0) throw new Error("Invalid Pickup Time");
    if (deliveryTimeEpoch === 0) throw new Error("Invalid Delivery Time");
    if (auctionEndTimeInMinutes === 0)
      throw new Error("Invalid Auction End Time");
    try {
      await this.ethEnabled();
      await this._serviceRequestContract.methods
        .editDraftSR(
          requestId,
          status,
          pickupTimeEpoch,
          deliveryTimeEpoch,
          auctionEndTimeInMinutes
        )
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to update the SR");
    }
  }

  async checkWinnerForDispute(disputeId: number): Promise<void> {
    if (disputeId < 0) throw new Error("Invalid Dispute Id");
    try {
      await this.ethEnabled();
      await this._serviceRequestContract.methods
        .decideWinnerForDispute(disputeId)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to check winner for dispute");
    }
  }
}
