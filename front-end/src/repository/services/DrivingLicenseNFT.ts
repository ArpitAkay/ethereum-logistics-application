import { ethers } from "ethers";
import Web3 from "web3";
import ContractABI from "../abi/DrivingLicenseNFT.json";
import { DRIVING_LICENSE_NFT_ADDRESS } from "../config";
import { IDrivingLicenseInfo } from "../interfaces";

declare let window: any;

export class DrivingLicenseNFTService {
  private static instance: DrivingLicenseNFTService;
  private _dlNFTContract!: any;
  private _accountAddress: string | undefined;

  constructor() {
    this.ethEnabled();
  }

  public static getInstance(): DrivingLicenseNFTService {
    if (!DrivingLicenseNFTService.instance) {
      DrivingLicenseNFTService.instance = new DrivingLicenseNFTService();
    }
    return DrivingLicenseNFTService.instance;
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
      this._dlNFTContract = this.getContract();
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
      DRIVING_LICENSE_NFT_ADDRESS
    );
  }

  async validatetheNFTPresent(userUID: string): Promise<boolean> {
    if (!userUID) throw new Error("User UID is required");
    if (!ethers.isAddress(userUID)) throw new Error("Invalid User UID");
    try {
      await this.ethEnabled();
      const _isValid: boolean = await this._dlNFTContract.methods
        .validateNFT(userUID)
        .call();
      return _isValid;
    } catch (error) {
      console.log(error);
      throw new Error("Error while validating the NFTs present");
    }
  }

  // Get token IDs owned by the user
  async getTokenId(): Promise<number | null> {
    try {
      const provider = new ethers.BrowserProvider((window as any)?.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        DRIVING_LICENSE_NFT_ADDRESS,
        ContractABI["abi"],
        signer
      );
      const numberOfNfts = await contract.balanceOf(signer.getAddress());
      if (numberOfNfts > 0)
        return Number(
          await contract.tokenOfOwnerByIndex(signer.getAddress(), 0)
        );
      return null;
    } catch (error) {
      console.error("Error getting token IDs", error);
      return null;
    }
  }

  async getDLInfo(tokenId: number): Promise<IDrivingLicenseInfo> {
    if (tokenId < 0) throw new Error("Invalid Token Id");
    try {
      await this.ethEnabled();
      const _dlInfo: IDrivingLicenseInfo = await this._dlNFTContract.methods
        .getDriverLicenseInfoByTokenId(tokenId)
        .call({ from: this._accountAddress });
      return _dlInfo;
    } catch (error) {
      console.log(error);
      throw new Error("Error while fetching NFT details");
    }
  }

  async createNewDLNFT(
    name: string,
    dlNumber: string,
    ipfsHash: string
  ): Promise<void> {
    if (!name) throw new Error("Name is required");
    if (!dlNumber) throw new Error("DL Number is required");
    if (ipfsHash.length < 10) throw new Error("Inavlid IPFS Hash is provided");
    try {
      await this.ethEnabled();
      await this._dlNFTContract.methods
        .publicMint(name, dlNumber, ipfsHash)
        .send({
          value: Web3.utils.toWei("0.01", "ether"),
          from: this._accountAddress,
        });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to Create new Driving License NFT");
    }
  }

  async deleteNFT(tokenId: number): Promise<void> {
    // Non-revertable operation
    if (tokenId < 0) throw new Error("Invalid Token Id");
    try {
      await this.ethEnabled();
      await this._dlNFTContract.methods
        .burn(tokenId)
        .send({ from: this._accountAddress });
    } catch (error) {
      console.log(error);
      throw new Error("Failed to delete the NFT");
    }
  }
}
