import { Tooltip as ReactTooltip } from "react-tooltip";
import { ITooltipProp } from "./type";

const Tooltip = (props: ITooltipProp) => {
  if (props.disabled) {
    return <>{props.children}</>;
  }
  return (
    <>
      <ReactTooltip
        id={props.id}
        place="bottom"
        positionStrategy="absolute"
        style={{
          paddingInline: 8,
          paddingBlock: 4,
          marginTop: 0,
          borderRadius: 5,
          backgroundColor: "#383e40",
          fontSize: 12,
        }}
        {...props}
        noArrow
      >
        {props.hintText}
      </ReactTooltip>
      <div
        data-tooltip-id={props.id}
        data-tooltip-content={props.hintText}
        className={props.className}
        onClick={props.onChildClick}
      >
        {props.children as any}
      </div>
    </>
  );
};

export default Tooltip;
