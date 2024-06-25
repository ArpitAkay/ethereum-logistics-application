import { useEffect, useState } from "react";
import { CONSTANTS } from "../../constants";
import { Footer } from "../Footer";
import Header from "../Header";

export const ContentWrapper = (props: { children: any; className?: string }) => {
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);

  const updateScreenHeight = () => {
    setScreenHeight(window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("resize", updateScreenHeight);
    return () => window.removeEventListener("resize", updateScreenHeight);
  }, []);
  return (
    <>
      <Header />
      <div
        className={`${props.className}`}
        style={{
          height: screenHeight - CONSTANTS.HEADER_HEIGHT - CONSTANTS.FOOTER_HEIGHT,
          marginTop: CONSTANTS.HEADER_HEIGHT,
          overflow: "scroll",
          paddingBottom: 2 * CONSTANTS.FOOTER_HEIGHT,
        }}
      >
        {props.children}
      </div>
      <Footer />
    </>
  );
};
