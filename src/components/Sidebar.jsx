import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  BarChart3,
  Search,
  Smile,
  Database,
  GitCompare,
  History,
  User,
  Settings,
  LogOut,
  Brain,
  X
} from "lucide-react";

const menuItems = [
  {
    name: "Home",
    path: "/home",
    icon: Home
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3
  },
  {
    name: "Review Explorer",
    path: "/review-explorer",
    icon: Search
  },
  {
    name: "Emoji Explorer",
    path: "/emoji-explorer",
    icon: Smile
  },
  {
    name: "Dataset Analysis",
    path: "/dataset-analysis",
    icon: Database
  },
  {
    name: "Product Comparison",
    path: "/product-comparison",
    icon: GitCompare
  },
  {
    name: "Analysis History",
    path: "/analysis-history",
    icon: History
  },
  {
    name: "Profile",
    path: "/profile",
    icon: User
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings
  }
];

function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("cciCurrentUser");
    navigate("/login");
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>

        {/* Logo */}
        <div className="sidebar-logo">

          <div className="sidebar-logo-icon">
            <Brain size={24} />
          </div>

          <div>
            <h2>CCI</h2>
            <span>Communication Intelligence</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>

        </div>

        {/* Navigation */}
        <div className="sidebar-section-title">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );

          })}

        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">

          <div className="sidebar-tagline">
            <Brain size={18} />

            <div>
              <strong>CCI Intelligence</strong>
              <p>Understanding Reviews Beyond Words.</p>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;