import { toast } from "react-toastify";
import { ServiceRequestService } from "../repository/services/ServiceRequest";
import { TServiceRequest } from "../types/types";
import { showToast } from "./toast";

const srService = new ServiceRequestService();
const DISPUTE_DECALRATION_MIN_VOTE_COUNT = 1;
const triggeredDisputeDecalrationIds: number[] = [1];

const auctionWinnerFireIds: Record<number, number> = {};

const registerAuctionEndEvent = (fireAfter: number, srReqId: number) => {
  if (auctionWinnerFireIds[srReqId])
    clearTimeout(auctionWinnerFireIds[srReqId]);
  const timeoutId = setTimeout(() => {
    console.log("EVENT FIRED: Auction winner");
    srService.checkForAuctionWinner(srReqId);
    delete auctionWinnerFireIds[srReqId];
  }, fireAfter * 60 * 1000);
  console.log("Event registered: Auction winner");
  auctionWinnerFireIds[srReqId] = Number(timeoutId);
};

const checkForDisputesWinnerDeclaration = async (
  disputes: TServiceRequest[]
) => {
  for (const dispute of disputes) {
    if (triggeredDisputeDecalrationIds.includes(dispute.requestId)) continue;
    if (
      Number(dispute.totalDisputeVotes) >= DISPUTE_DECALRATION_MIN_VOTE_COUNT
    ) {
      try {
        triggeredDisputeDecalrationIds.push(dispute.requestId);
        const msg = `Auto-triggering dispute declaration for request ID - ${dispute.requestId}`;
        showToast(msg, { type: "info", position: "top-center" });
        //Wait for 4 secs and execute checkWinnerForDispute
        await new Promise((res) =>
          setTimeout(() => {
            toast.dismiss(msg);
            res("");
          }, 4000)
        );
        await srService.checkWinnerForDispute(dispute.requestId);
      } catch (err) {
        console.log("Error atcheckForDisputesWinnerDeclaration: ", err);
      }
    }
  }
};

export const srEvents = {
  registerAuctionEndEvent,
  checkForDisputesWinnerDeclaration,
};
