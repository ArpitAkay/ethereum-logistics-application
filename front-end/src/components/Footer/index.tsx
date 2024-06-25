import { CONSTANTS } from "../../constants";
import logo from "/assets/gaLogo.svg";

export const Footer = () => {
  return (
    <footer
      className="fixed flex flex-col sm:flex-row gap-2 items-center w-full bottom-0 bg-teal-900 text-white py-3 px-6 text-sm min-h-20 sm:min-h-0"
      style={{ height: CONSTANTS.FOOTER_HEIGHT }}
    >
      <div>
        © {new Date().getFullYear()} GeekyAnts. All rights reserved. This
        project uses trademarks under fair use for non-commercial, open-source
        purposes. If required, we will promptly remove them.
      </div>
      <div className="flex gap-2 items-center bottom-0 ml-0 sm:ml-auto">
        Made with love by
        <a href="https://geekyants.com" target="_blank" className="flex gap-2">
          <img src={logo} className="w-5 h-5" /> <span> GeekyAnts</span>
        </a>
      </div>
    </footer>
  );
};
