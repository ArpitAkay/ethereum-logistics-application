import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import router from "./router";
import { Provider } from "react-redux";
import store from "./store";

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      <ToastContainer autoClose={2500} position="bottom-right" hideProgressBar limit={3} />
    </Provider>
  );
}

export default App;
