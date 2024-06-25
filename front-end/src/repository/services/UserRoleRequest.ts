import { ethers } from "ethers";
import Web3 from "web3";
import ContractABI from "../abi/UserRoleRequest.json";
import { USER_ROLE_REQUEST_ADDRESS } from "../config";
import { IUser, IRoleRequest } from "../interfaces";
import { EUserRole } from "../enum";

declare let window: any;
export class UserService {
  private static instance: UserService;
  private _userRoleRequestContract!: any;
  private _accountAddress: string | undefined;
  public static accountId: string = "";

  constructor() {
    this.ethEnabled();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
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
      UserService.accountId = accounts[0];
      this._userRoleRequestContract = this.getContract();
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
      USER_ROLE_REQUEST_ADDRESS
    );
  }

  async getAllRequests(): Promise<IRoleRequest[]> {
    try {
      await this.ethEnabled();
      const _roleReqList: IRoleRequest[] =
        await this._userRoleRequestContract.methods
          .getAllRoleRequests()
          .call({ from: this._accountAddress });
      return _roleReqList;
    } catch (error) {
      console.log(error);
      throw new Error("Error while fetching All Role Requests list");
    }
  }

  async getMyRequests(): Promise<IRoleRequest[]> {
    try {
      await this.ethEnabled();
      const _roleReqList: IRoleRequest[] =
        await this._userRoleRequestContract.methods
          .getMyRoleRequests()
          .call({ from: this._accountAddress });
      return _roleReqList;
    } catch (error) {
      console.log(error);
      throw new Error("Error while fetching Self Role Requests list");
    }
  }

  async getMyRegionRequests(): Promise<IRoleRequest[]> {
    try {
      await this.ethEnabled();
      const _roleReqList: IRoleRequest[] =
        await this._userRoleRequestContract.methods
          .getRoleRequestsInMyRegion()
          .call({ from: this._accountAddress });
      return _roleReqList;
    } catch (error) {
      console.log(error);
      throw new Error("Error while fetching Role Requests in my geo-location");
    }
  }

  async getUserGeoHash(userUID: string): Promise<string> {
    if (!ethers.isAddress(userUID)) throw new Error("Invalid User UID");
    try {
      await this.ethEnabled();
      const usergeoHash: string = await this._userRoleRequestContract.methods
        .getUserGeoHash(userUID)
        .call({ from: this._accountAddress });
      return usergeoHash;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to fetch User Geo Hash");
    }
  }

  async getUserDetails(userUID: string): Promise<IUser> {
    if (!ethers.isAddress(userUID)) throw new Error("Invalid User UID");
    try {
      await this.ethEnabled();
      const userInfo: IUser = await this._userRoleRequestContract.methods
        .getUserInfo(userUID)
        .call({ from: this._accountAddress });
      return userInfo;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to fetch User Details");
    }
  }

  async createUser(
    name: string,
    geoHash: string,
    phoneNumberWithISOCode: string
  ): Promise<void> {
    if (!name) throw new Error("Invalid User Name");
    if (!geoHash) throw new Error("Invalid User Geo Hash");
    if (!phoneNumberWithISOCode)
      throw new Error("Invalid Phone Number with ISO Code");
    try {
      await this.ethEnabled();
      await this._userRoleRequestContract.methods
        .createUser(name, geoHash, phoneNumberWithISOCode)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Creating new user failed!");
    }
  }

  async createNewRoleRequest(role: EUserRole): Promise<void> {
    try {
      await this.ethEnabled();
      await this._userRoleRequestContract.methods
        .createRoleRequest(role)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Creating new role request failed!");
    }
  }

  async takeActionOnRoleRequests(
    requestId: number,
    approved: boolean
  ): Promise<void> {
    if (requestId < 0) throw new Error("Invalid Request Id");
    try {
      await this.ethEnabled();
      await this._userRoleRequestContract.methods
        .approveOrRejectRoleRequest(requestId, approved)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Approve/Reject the role request");
    }
  }

  async updateUserDetails(
    name: string,
    geoHash: string,
    phoneNumberWithISOCode: string
  ): Promise<void> {
    if (!name) throw new Error("Invalid User Name");
    if (!geoHash) throw new Error("Invalid User Geo Hash");
    if (!phoneNumberWithISOCode)
      throw new Error("Invalid Phone Number with ISO Code");
    try {
      await this.ethEnabled();
      await this._userRoleRequestContract.methods
        .updateUserInfo(name, geoHash, phoneNumberWithISOCode)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to update the user details");
    }
  }
}
