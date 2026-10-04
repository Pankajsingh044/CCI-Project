import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =====================================================
// AUTH PAGES
// =====================================================

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

// =====================================================
// MAIN PAGES
// =====================================================

import Home from "./pages/Home.jsx";
import Analytics from "./pages/Analytics.jsx";
import ReviewExplorer from "./pages/ReviewExplorer.jsx";
import EmojiExplorer from "./pages/EmojiExplorer.jsx";
import DatasetAnalysis from "./pages/DatasetAnalysis.jsx";
import ProductComparison from "./pages/ProductComparison.jsx";
import AnalysisHistory from "./pages/AnalysisHistory.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";

// =====================================================
// LAYOUT
// =====================================================

import Layout from "./components/Layout.jsx";

// =====================================================
// TEMPORARY PAGE COMPONENT
// =====================================================

function DashboardPage({ title }) {
  return (
    <div className="placeholder-page">
      <div className="page-eyebrow">
        CCI MODULE
      </div>

      <h1>{title}</h1>

      <p>
        This module is ready for implementation.
      </p>
    </div>
  );
}

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            AUTHENTICATION
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* =================================================
            HOME
        ================================================= */}

        <Route
          path="/home"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        {/* =================================================
            ANALYTICS
        ================================================= */}

        <Route
          path="/analytics"
          element={
            <Layout>
              <Analytics />
            </Layout>
          }
        />

        {/* =================================================
            REVIEW EXPLORER
        ================================================= */}

        <Route
          path="/review-explorer"
          element={
            <Layout>
              <ReviewExplorer />
            </Layout>
          }
        />

        {/* =================================================
            EMOJI EXPLORER
        ================================================= */}

        <Route
          path="/emoji-explorer"
          element={
            <Layout>
              <EmojiExplorer />
            </Layout>
          }
        />

        {/* =================================================
            DATASET ANALYSIS
        ================================================= */}

        <Route
          path="/dataset-analysis"
          element={
            <Layout>
              <DatasetAnalysis />
            </Layout>
          }
        />

        {/* =================================================
            PRODUCT COMPARISON
        ================================================= */}

        <Route
          path="/product-comparison"
          element={
            <Layout>
              <ProductComparison />
            </Layout>
          }
        />

        {/* =================================================
            ANALYSIS HISTORY
        ================================================= */}

        <Route
          path="/analysis-history"
          element={
            <Layout>
              <AnalysisHistory />
            </Layout>
          }
        />

        {/* =================================================
            PROFILE
        ================================================= */}

        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />

        {/* =================================================
            SETTINGS
        ================================================= */}

        <Route
          path="/settings"
          element={
            <Layout>
              <Settings />
            </Layout>
          }
        />

        {/* =================================================
            DEFAULT ROUTE
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =================================================
            UNKNOWN ROUTES
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

