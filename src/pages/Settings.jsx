import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  Database,
  Trash2,
  ShieldCheck,
  Palette,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

function Settings() {
  const [settings, setSettings] = useState({
    theme: "system",
    notifications: true,
    saveHistory: true,
  });

  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const storedSettings = JSON.parse(
        localStorage.getItem("cciSettings")
      );

      if (storedSettings) {
        setSettings((prev) => ({
          ...prev,
          ...storedSettings,
        }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSaved(false);
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      root.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light"
      );
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(
        "cciSettings",
        JSON.stringify(settings)
      );

      applyTheme(settings.theme);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Unable to save settings.");
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      theme: "system",
      notifications: true,
      saveHistory: true,
    };

    setSettings(defaultSettings);

    localStorage.setItem(
      "cciSettings",
      JSON.stringify(defaultSettings)
    );

    applyTheme("system");

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const clearAnalysisData = () => {
    try {
      localStorage.removeItem("cciReviews");
      localStorage.removeItem("cciAnalysisHistory");
      localStorage.removeItem("cciDatasetAnalysis");

      setShowClearConfirm(false);

      alert("CCI analysis data has been cleared.");

      window.location.reload();
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Unable to clear analysis data.");
    }
  };

  return (
    <div className="settings-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-title-row">

        <div>
          <div className="page-eyebrow">
            CCI CONFIGURATION
          </div>

          <h1 className="page-title">
            Settings
          </h1>

          <p className="page-subtitle">
            Manage your CCI preferences, appearance and local
            application data.
          </p>
        </div>

        <div className="settings-header-actions">

          {saved && (
            <div className="settings-saved-message">
              <CheckCircle2 size={16} />
              Settings saved
            </div>
          )}

          <button
            className="primary-button"
            onClick={saveSettings}
          >
            <Save size={17} />
            Save Settings
          </button>

        </div>

      </div>


      {/* =================================================
          SETTINGS LAYOUT
      ================================================= */}

      <div className="settings-layout">

        {/* =================================================
            APPEARANCE
        ================================================= */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Palette size={19} />
            </div>

            <div>
              <h2>Appearance</h2>

              <p>
                Choose how CCI looks on your device.
              </p>
            </div>

          </div>


          <div className="settings-section-content">

            <div className="settings-row">

              <div className="settings-row-info">

                <strong>
                  Theme
                </strong>

                <span>
                  Select your preferred application theme.
                </span>

              </div>

            </div>


            <div className="theme-options">

              {/* LIGHT */}

              <button
                className={`theme-option ${
                  settings.theme === "light"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateSetting("theme", "light")
                }
              >

                <div className="theme-option-icon">
                  <Sun size={20} />
                </div>

                <div>
                  <strong>Light</strong>

                  <span>
                    Bright interface
                  </span>
                </div>

                {settings.theme === "light" && (
                  <CheckCircle2
                    size={17}
                    className="theme-check"
                  />
                )}

              </button>


              {/* DARK */}

              <button
                className={`theme-option ${
                  settings.theme === "dark"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateSetting("theme", "dark")
                }
              >

                <div className="theme-option-icon">
                  <Moon size={20} />
                </div>

                <div>
                  <strong>Dark</strong>

                  <span>
                    Dark interface
                  </span>
                </div>

                {settings.theme === "dark" && (
                  <CheckCircle2
                    size={17}
                    className="theme-check"
                  />
                )}

              </button>


              {/* SYSTEM */}

              <button
                className={`theme-option ${
                  settings.theme === "system"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateSetting("theme", "system")
                }
              >

                <div className="theme-option-icon">
                  <Monitor size={20} />
                </div>

                <div>
                  <strong>System</strong>

                  <span>
                    Follow device settings
                  </span>
                </div>

                {settings.theme === "system" && (
                  <CheckCircle2
                    size={17}
                    className="theme-check"
                  />
                )}

              </button>

            </div>

          </div>

        </section>


        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Bell size={19} />
            </div>

            <div>
              <h2>Notifications</h2>

              <p>
                Control application notification preferences.
              </p>
            </div>

          </div>


          <div className="settings-section-content">

            <div className="settings-toggle-row">

              <div className="settings-toggle-info">

                <div className="settings-toggle-title">

                  {settings.notifications ? (
                    <Bell size={17} />
                  ) : (
                    <BellOff size={17} />
                  )}

                  <strong>
                    Application notifications
                  </strong>

                </div>

                <span>
                  Allow CCI to display notification messages
                  for important application events.
                </span>

              </div>


              <button
                type="button"
                className={`settings-switch ${
                  settings.notifications
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "notifications",
                    !settings.notifications
                  )
                }
                aria-label="Toggle notifications"
              >

                <span></span>

              </button>

            </div>


            <div className="settings-info-box">

              <Info size={17} />

              <p>
                Notification preferences are currently stored
                locally in your browser.
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            ANALYSIS & DATA
        ================================================= */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Database size={19} />
            </div>

            <div>
              <h2>Analysis & Data</h2>

              <p>
                Manage how CCI stores analysis information.
              </p>
            </div>

          </div>


          <div className="settings-section-content">

            {/* SAVE HISTORY */}

            <div className="settings-toggle-row">

              <div className="settings-toggle-info">

                <div className="settings-toggle-title">

                  <Database size={17} />

                  <strong>
                    Save analysis history
                  </strong>

                </div>

                <span>
                  Keep submitted reviews and analysis history
                  available inside CCI.
                </span>

              </div>


              <button
                type="button"
                className={`settings-switch ${
                  settings.saveHistory
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "saveHistory",
                    !settings.saveHistory
                  )
                }
                aria-label="Toggle analysis history"
              >

                <span></span>

              </button>

            </div>


            {/* LOCAL STORAGE */}

            <div className="settings-data-status">

              <div className="settings-data-status-icon">
                <ShieldCheck size={19} />
              </div>

              <div>

                <strong>
                  Local browser storage
                </strong>

                <span>
                  CCI currently stores frontend data using
                  browser LocalStorage.
                </span>

              </div>

            </div>


            {/* CLEAR DATA */}

            <div className="settings-danger-area">

              <div>

                <div className="settings-danger-title">

                  <Trash2 size={17} />

                  <strong>
                    Clear CCI analysis data
                  </strong>

                </div>

                <p>
                  Remove saved reviews, analysis history and
                  dataset analysis from this browser.
                </p>

              </div>

              <button
                className="danger-button"
                onClick={() =>
                  setShowClearConfirm(true)
                }
              >
                <Trash2 size={16} />
                Clear Data
              </button>

            </div>

          </div>

        </section>


        {/* =================================================
            ABOUT SETTINGS
        ================================================= */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <SettingsIcon size={19} />
            </div>

            <div>
              <h2>Application Preferences</h2>

              <p>
                General information about your CCI setup.
              </p>
            </div>

          </div>


          <div className="settings-preference-list">

            <div className="settings-preference-item">

              <span>
                Application
              </span>

              <strong>
                Contextual Communication Intelligence
              </strong>

            </div>


            <div className="settings-preference-item">

              <span>
                Version
              </span>

              <strong>
                CCI Frontend v1.0
              </strong>

            </div>


            <div className="settings-preference-item">

              <span>
                Storage
              </span>

              <strong>
                Browser LocalStorage
              </strong>

            </div>


            <div className="settings-preference-item">

              <span>
                NLP Engine
              </span>

              <strong className="settings-pending-text">
                Backend Required
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            RESET
        ================================================= */}

        <div className="settings-reset-area">

          <div>

            <h3>
              Reset preferences
            </h3>

            <p>
              Restore appearance, notification and analysis
              preferences to their default values.
            </p>

          </div>

          <button
            className="secondary-button"
            onClick={resetSettings}
          >
            <RotateCcw size={16} />
            Reset Preferences
          </button>

        </div>

      </div>


      {/* =================================================
          CLEAR DATA MODAL
      ================================================= */}

      {showClearConfirm && (

        <div className="settings-modal-overlay">

          <div className="settings-modal">

            <div className="settings-modal-icon">
              <AlertTriangle size={24} />
            </div>

            <h2>
              Clear analysis data?
            </h2>

            <p>
              This will remove your saved reviews, analysis
              history and dataset analysis from this browser.
              Your login account and profile will not be removed.
            </p>

            <div className="settings-modal-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setShowClearConfirm(false)
                }
              >
                Cancel
              </button>

              <button
                className="danger-button"
                onClick={clearAnalysisData}
              >
                <Trash2 size={16} />
                Clear Data
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Settings;