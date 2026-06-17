import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="al-root">
      <Sidebar />

      <main className="al-main">
        <Outlet />
      </main>
    </div>
  );
}