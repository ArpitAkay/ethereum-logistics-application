import { IUser } from "../../repository/interfaces";

export const getAuctionStatus = (auctionEndTimeInMins: number, auctionWinner?: IUser) => {
  const status = { label: "", className: "", auctionEnded: false };
  if (auctionWinner) {
    status.label = `Auction winner is '${auctionWinner?.name || auctionWinner?.uid}'`;
    status.className = "text-teal-600";
    status.auctionEnded = true;
  } else if (auctionEndTimeInMins > 0) {
    status.label = `Auction will end in ${auctionEndTimeInMins} minutes`;
    status.className = "text-orange-600";
  } else {
    status.label = `Auction has ended!`;
    status.className = "text-red-600";
    status.auctionEnded = true;
  }
  return status;
};
