import { createBrowserRouter, Outlet } from "react-router";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Header from "./components/Header/Header";

const Layout = () => {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home/>,
      },
      {
        path: "/cadastrar",
        element: <SignUp />,
      },
    ]
  }
]);