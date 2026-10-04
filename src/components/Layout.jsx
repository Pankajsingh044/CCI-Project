import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

function Layout({ children }) {

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-layout">

      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="dashboard-main">

        <Header
          setMobileOpen={setMobileOpen}
        />

        <main className="dashboard-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default Layout;