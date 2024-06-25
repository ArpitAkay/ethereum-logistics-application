import { ITooltip } from "react-tooltip";

export interface ITooltipProp extends ITooltip {
  hintText: string;
  disabled?: boolean;
  onChildClick?: () => void;
}
