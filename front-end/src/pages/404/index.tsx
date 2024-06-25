import { Link } from "react-router-dom";
import notFoundImage from "/assets/404.png";

const PageNotFound = () => {
  return (
    <div className="flex justify-center items-center h-full bg-white min-h-screen font-sans">
      <div className="h-full">
        <div className="max-w-2xl text-center space-y-8">
          <img src={notFoundImage} alt="Lost Astronaut Illustration" className="w-full" />
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-400"
          >
            Take Me Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
