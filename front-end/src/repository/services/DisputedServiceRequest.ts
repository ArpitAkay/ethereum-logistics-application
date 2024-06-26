import Web3 from "web3";
import ContractABI from "../abi/DisputedServiceRequest.json";
import { DISPUTED_SERVICE_REQUEST_ADDRESS } from "../config";
import { ISRInfo } from "../interfaces";
import { EWhomToVote } from "../enum";

declare let window: any;

export class DisputeSRService {
  private static instance: DisputeSRService;
  private _disputeSRContract!: any;
  private _accountAddress: string | undefined;

  constructor() {
    this.ethEnabled();
  }

  public static getInstance(): DisputeSRService {
    if (!DisputeSRService.instance) {
      DisputeSRService.instance = new DisputeSRService();
    }
    return DisputeSRService.instance;
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
        params: [{ chainId: `0xaa36a7` }],
      });
      this._accountAddress = accounts[0];
      this._disputeSRContract = this.getContract();
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
      DISPUTED_SERVICE_REQUEST_ADDRESS
    );
  }

  async getDisputesSRInDriverRegion(): Promise<ISRInfo[]> {
    try {
      await this.ethEnabled();
      const _srList: ISRInfo[] = await this._disputeSRContract.methods
        .getAllDisputedSRInDriverArea()
        .call({ from: this._accountAddress });
      return _srList;
    } catch (error) {
      console.log(error, "error");
      throw new Error("Error while fetching dispute SR list in Driver Region");
    }
  }

  async voteOnDispute(srId: number, voteTo: EWhomToVote): Promise<void> {
    if (typeof srId !== "number") throw new Error("SR Id is required");
    try {
      await this.ethEnabled();
      await this._disputeSRContract.methods
        .vote(srId, voteTo)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error, "error");
      throw new Error("Error while tryign to Vote on a disputed SR");
    }
  }
}
