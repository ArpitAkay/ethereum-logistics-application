import { format, startOfDay, addDays } from "date-fns";
import { CONSTANTS } from "../constants";
import { showToast } from "../services/toast";

export const getShortenAddress = (address: string) => {
  return address.substring(0, 7) + "..." + address.substring(address.length - 4);
};

// Utility function to convert BigInt to String
// NOT SURE ON THIS FUNCTION WORKING. NEED TO RECHECK AFTER IMPLEMENTATIONS
export const convertBigIntToString: any = (obj: any) => {
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertBigIntToString(value)])
    );
  } else if (typeof obj === "bigint") {
    return Number(obj);
  } else {
    return obj;
  }
};

export const weiToEther = (wei: number) => {
  const weiValue = BigInt(wei); // Ensure the value is a BigInt
  const etherValue = weiValue / BigInt("1000000000000000000"); // Divide by 10^18
  return Number(etherValue); // Convert the BigInt result to a string
};

export const getDateTimeString = (date: Date | string | number) => {
  try {
    if (date instanceof Date) {
      return format(date, "yyyy-MM-dd HH:mm");
    } else if (typeof date === "string" || typeof date === "number") {
      return format(new Date(date), "yyyy-MM-dd HH:mm");
    } else return "";
  } catch (e) {
    console.log("Error at getLocalISODateString, got value - ", date);
    return "";
  }
};

export const getCurrentAuctionTime = (initialAuctionTime: number) => {
  try {
    if (initialAuctionTime === 0) return 0;
    const at = new Date(initialAuctionTime);
    const now = new Date();
    const millis = ((at as any) - (now as any)) as number;
    const updateAuctionMins = millis / (1000 * 60);
    return Math.floor(updateAuctionMins);
  } catch (e) {
    console.log("Auction time exceeded limit");
    return 60; // default mins
  }
};

export const getTomorrowStartTime = () => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const tomorrowStart = startOfDay(tomorrow);
  return getDateTimeString(tomorrowStart);
};

export const copyTextToClipboard = async (text: string, displayMsg?: boolean) => {
  if (displayMsg) showToast(CONSTANTS.TEXT_COPIED, { type: "info" });
  await navigator.clipboard.writeText(text.trim());
  return true;
};
