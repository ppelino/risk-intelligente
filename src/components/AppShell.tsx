import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell() {
  return (
    <div className="di-layout">
      <Sidebar />
      <main className="di-main">
        <Outlet />
      </main>
    </div>
  );
}
