import {
  Menu,
  Bell,
  Search,
  Database,
  MessageSquareText,
  BarChart3,
  Smile,
  X,
  Trash2
} from "lucide-react";

import { useEffect, useState } from "react";
import { getDataset } from "../services/datasetStorage";

// =====================================================
// API
// =====================================================

const ANALYTICS_API_URL =
  "http://127.0.0.1:8000/api/analytics";

const HISTORY_API_URL =
  "http://127.0.0.1:8000/api/analysis-history";

// =====================================================
// PROFILE IMAGE STORAGE KEY
// Must match Profile.jsx
// =====================================================

const getProfileImageKey = (user) => {
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return null;
  }

  return `cciProfileImage_${encodeURIComponent(email)}`;
};

// =====================================================
// NOTIFICATION STORAGE KEY
// =====================================================

const getNotificationStorageKey = (user) => {
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return "cciDeletedNotifications";
  }

  return `cciDeletedNotifications_${encodeURIComponent(
    email
  )}`;
};

// =====================================================
// LOAD DELETED NOTIFICATIONS
// =====================================================

const loadDeletedNotifications = (user) => {
  try {
    const key =
      getNotificationStorageKey(user);

    const saved =
      localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Unable to load deleted notifications:",
      error
    );

    return [];
  }
};

// =====================================================
// SAVE DELETED NOTIFICATIONS
// =====================================================

const saveDeletedNotifications = (
  user,
  notificationIds
) => {
  try {
    const key =
      getNotificationStorageKey(user);

    localStorage.setItem(
      key,
      JSON.stringify(notificationIds)
    );
  } catch (error) {
    console.error(
      "Unable to save deleted notifications:",
      error
    );
  }
};

// =====================================================
// HEADER
// =====================================================

function Header({ setMobileOpen }) {

  // ===================================================
  // CURRENT USER
  // ===================================================

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "cciCurrentUser"
        ) || "null"
      );
    } catch {
      return null;
    }
  });

  // ===================================================
  // PROFILE IMAGE
  // ===================================================

  const [profileImage, setProfileImage] =
    useState("");

  // ===================================================
  // NOTIFICATIONS
  // ===================================================

  const [notifications, setNotifications] =
    useState([]);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  // ===================================================
  // DELETED NOTIFICATIONS
  // ===================================================

  const [deletedNotificationIds, setDeletedNotificationIds] =
    useState(() =>
      loadDeletedNotifications(
        currentUser
      )
    );

  // ===================================================
  // LOAD PROFILE IMAGE
  // ===================================================

  useEffect(() => {

    const loadProfileImage = () => {

      try {

        const savedUser =
          JSON.parse(
            localStorage.getItem(
              "cciCurrentUser"
            ) || "null"
          );

        setCurrentUser(
          savedUser
        );

        const imageKey =
          getProfileImageKey(
            savedUser
          );

        if (imageKey) {

          const savedImage =
            localStorage.getItem(
              imageKey
            ) || "";

          setProfileImage(
            savedImage
          );

        } else {

          setProfileImage("");

        }

      } catch (error) {

        console.error(
          "Header profile image loading error:",
          error
        );

        setProfileImage("");

      }

    };

    loadProfileImage();

    window.addEventListener(
      "cciProfileUpdated",
      loadProfileImage
    );

    window.addEventListener(
      "storage",
      loadProfileImage
    );

    return () => {

      window.removeEventListener(
        "cciProfileUpdated",
        loadProfileImage
      );

      window.removeEventListener(
        "storage",
        loadProfileImage
      );

    };

  }, []);

  // ===================================================
  // UPDATE DELETED NOTIFICATIONS
  // WHEN USER CHANGES
  // ===================================================

  useEffect(() => {

    setDeletedNotificationIds(
      loadDeletedNotifications(
        currentUser
      )
    );

  }, [
    currentUser?.email
  ]);

  // ===================================================
  // LOAD NOTIFICATIONS
  // ===================================================

  useEffect(() => {

    const loadNotifications = async () => {

      const userEmail =
        currentUser?.email || "";

      if (!userEmail) {

        setNotifications([]);

        return;

      }

      setNotificationsLoading(
        true
      );

      try {

        const newNotifications = [];

        // =================================================
        // DATASET
        // =================================================

        try {

          const dataset =
            await getDataset();

          if (dataset) {

            const rowCount =
              dataset.rows?.length || 0;

            newNotifications.push({
              id: "dataset-uploaded",
              type: "dataset",
              icon: Database,
              title: "Dataset available",
              message:
                `${dataset.name || "Uploaded dataset"} · ${rowCount} records`,
              time: dataset.savedAt
                ? formatNotificationTime(
                    dataset.savedAt
                  )
                : "Available now"
            });

          }

        } catch (error) {

          console.error(
            "Notification dataset loading error:",
            error
          );

        }

        // =================================================
        // ANALYTICS
        // =================================================

        try {

          const encodedEmail =
            encodeURIComponent(
              userEmail
            );

          const analyticsResponse =
            await fetch(
              `${ANALYTICS_API_URL}?userEmail=${encodedEmail}`
            );

          if (
            analyticsResponse.ok
          ) {

            const analytics =
              await analyticsResponse.json();

            const totalReviews =
              analytics?.totalReviews || 0;

            const totalEmojiCount =
              analytics?.totalEmojiCount || 0;

            if (
              totalReviews > 0
            ) {

              newNotifications.push({
                id: "analytics-updated",
                type: "analytics",
                icon: BarChart3,
                title: "Analytics updated",
                message:
                  `${totalReviews} review${totalReviews === 1 ? "" : "s"} analyzed`,
                time: "Current"
              });

            }

            if (
              totalEmojiCount > 0
            ) {

              newNotifications.push({
                id: "emoji-insights",
                type: "emoji",
                icon: Smile,
                title:
                  "Emoji insights available",
                message:
                  `${totalEmojiCount} emoji${totalEmojiCount === 1 ? "" : "s"} detected`,
                time: "Current"
              });

            }

          }

        } catch (error) {

          console.error(
            "Notification analytics loading error:",
            error
          );

        }

        // =================================================
        // ANALYSIS HISTORY
        // =================================================

        try {

          const encodedEmail =
            encodeURIComponent(
              userEmail
            );

          const historyResponse =
            await fetch(
              `${HISTORY_API_URL}?userEmail=${encodedEmail}`
            );

          if (
            historyResponse.ok
          ) {

            const historyData =
              await historyResponse.json();

            let historyItems = [];

            if (
              Array.isArray(
                historyData
              )
            ) {

              historyItems =
                historyData;

            } else if (
              Array.isArray(
                historyData.history
              )
            ) {

              historyItems =
                historyData.history;

            } else if (
              Array.isArray(
                historyData.data
              )
            ) {

              historyItems =
                historyData.data;

            }

            if (
              historyItems.length > 0
            ) {

              const latest =
                historyItems[0];

              const product =
                latest?.product ||
                latest?.productName ||
                "Review";

              const latestDate =
                latest?.date ||
                latest?.createdAt ||
                latest?.analyzedAt;

              const historyId =
                latest?._id ||
                latest?.id ||
                "latest-analysis";

              newNotifications.push({
                id:
                  `analysis-${historyId}`,
                type: "analysis",
                icon:
                  MessageSquareText,
                title:
                  "Review analysis completed",
                message:
                  `${product} analysis is available in Analysis History`,
                time:
                  latestDate
                    ? formatNotificationTime(
                        latestDate
                      )
                    : "Recent"
              });

            }

          }

        } catch (error) {

          console.error(
            "Notification history loading error:",
            error
          );

        }

        // =================================================
        // REMOVE DELETED NOTIFICATIONS
        // =================================================

        const visibleNotifications =
          newNotifications.filter(
            (notification) =>
              !deletedNotificationIds.includes(
                notification.id
              )
          );

        setNotifications(
          visibleNotifications
        );

      } catch (error) {

        console.error(
          "Unable to load notifications:",
          error
        );

        setNotifications([]);

      } finally {

        setNotificationsLoading(
          false
        );

      }

    };

    loadNotifications();

    window.addEventListener(
      "cciDataUpdated",
      loadNotifications
    );

    window.addEventListener(
      "cciProfileUpdated",
      loadNotifications
    );

    return () => {

      window.removeEventListener(
        "cciDataUpdated",
        loadNotifications
      );

      window.removeEventListener(
        "cciProfileUpdated",
        loadNotifications
      );

    };

  }, [
    currentUser,
    deletedNotificationIds
  ]);

  // ===================================================
  // DELETE ONE NOTIFICATION
  // ===================================================

  const deleteNotification = (
    notificationId
  ) => {

    const updatedDeletedIds = [
      ...deletedNotificationIds,
      notificationId
    ];

    setDeletedNotificationIds(
      updatedDeletedIds
    );

    saveDeletedNotifications(
      currentUser,
      updatedDeletedIds
    );

    setNotifications(
      (previous) =>
        previous.filter(
          (notification) =>
            notification.id !==
            notificationId
        )
    );

  };

  // ===================================================
  // CLEAR ALL NOTIFICATIONS
  // ===================================================

  const clearAllNotifications = () => {

    const allIds =
      notifications.map(
        (notification) =>
          notification.id
      );

    const updatedDeletedIds = [
      ...new Set([
        ...deletedNotificationIds,
        ...allIds
      ])
    ];

    setDeletedNotificationIds(
      updatedDeletedIds
    );

    saveDeletedNotifications(
      currentUser,
      updatedDeletedIds
    );

    setNotifications([]);

  };

  // ===================================================
  // USER INFO
  // ===================================================

  const userName =
    currentUser?.name || "User";

  const firstLetter =
    userName
      .charAt(0)
      .toUpperCase();

  const notificationCount =
    notifications.length;

  // ===================================================
  // CLOSE NOTIFICATION OUTSIDE
  // ===================================================

  useEffect(() => {

    const handleOutsideClick = (
      event
    ) => {

      if (
        !event.target.closest(
          ".notification-wrapper"
        )
      ) {

        setNotificationOpen(
          false
        );

      }

    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, []);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <header className="dashboard-header">

      {/* =================================================
          LEFT
      ================================================= */}

      <div className="header-left">

        <button
          className="menu-button"
          onClick={() =>
            setMobileOpen(true)
          }
        >
          <Menu size={22} />
        </button>

        <div className="header-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search reviews, products..."
          />

        </div>

      </div>


      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="header-right">

        {/* =================================================
            NOTIFICATION
        ================================================= */}

        <div
          className="notification-wrapper"
          style={{
            position: "relative"
          }}
        >

          <button
            className="notification-button"
            onClick={() =>
              setNotificationOpen(
                (previous) =>
                  !previous
              )
            }
            aria-label="Notifications"
          >

            <Bell size={20} />

            {notificationCount > 0 && (
              <span className="notification-dot"></span>
            )}

          </button>


          {/* =================================================
              NOTIFICATION DROPDOWN
          ================================================= */}

          {notificationOpen && (

            <div
              className="notification-dropdown"
              style={{
                position: "absolute",
                top:
                  "calc(100% + 12px)",
                right: 0,
                width: "380px",
                maxWidth:
                  "calc(100vw - 32px)",
                background:
                  "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius:
                  "16px",
                boxShadow:
                  "0 18px 45px rgba(15, 23, 42, 0.16)",
                zIndex: 9999,
                overflow:
                  "hidden"
              }}
            >

              {/* =================================================
                  HEADER
              ================================================= */}

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  padding:
                    "16px 18px",
                  borderBottom:
                    "1px solid #e5e7eb"
                }}
              >

                <div>

                  <strong
                    style={{
                      display:
                        "block",
                      fontSize:
                        "16px",
                      color:
                        "#111827"
                    }}
                  >
                    Notifications
                  </strong>

                  <span
                    style={{
                      display:
                        "block",
                      marginTop:
                        "3px",
                      fontSize:
                        "12px",
                      color:
                        "#64748b"
                    }}
                  >
                    Recent CCI activity
                  </span>

                </div>

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "6px"
                  }}
                >

                  {notifications.length >
                    0 && (

                    <button
                      onClick={
                        clearAllNotifications
                      }
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          "5px",
                        border:
                          "none",
                        background:
                          "transparent",
                        cursor:
                          "pointer",
                        color:
                          "#dc2626",
                        fontSize:
                          "12px",
                        fontWeight:
                          "600",
                        padding:
                          "6px"
                      }}
                      title="Clear all notifications"
                    >
                      <Trash2
                        size={14}
                      />
                      Clear All
                    </button>

                  )}

                  <button
                    onClick={() =>
                      setNotificationOpen(
                        false
                      )
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      cursor:
                        "pointer",
                      color:
                        "#64748b",
                      padding:
                        "4px"
                    }}
                    aria-label="Close notifications"
                  >
                    <X size={18} />
                  </button>

                </div>

              </div>


              {/* =================================================
                  BODY
              ================================================= */}

              {notificationsLoading ? (

                <div
                  style={{
                    padding:
                      "28px 18px",
                    textAlign:
                      "center",
                    color:
                      "#64748b",
                    fontSize:
                      "13px"
                  }}
                >
                  Loading notifications...
                </div>

              ) : notifications.length === 0 ? (

                <div
                  style={{
                    padding:
                      "32px 18px",
                    textAlign:
                      "center"
                  }}
                >

                  <Bell
                    size={30}
                    style={{
                      color:
                        "#94a3b8",
                      marginBottom:
                        "10px"
                    }}
                  />

                  <strong
                    style={{
                      display:
                        "block",
                      color:
                        "#334155",
                      fontSize:
                        "14px"
                    }}
                  >
                    No new notifications
                  </strong>

                  <span
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      color:
                        "#94a3b8",
                      fontSize:
                        "12px"
                    }}
                  >
                    Your CCI activity will appear here.
                  </span>

                </div>

              ) : (

                <div
                  style={{
                    maxHeight:
                      "420px",
                    overflowY:
                      "auto"
                  }}
                >

                  {notifications.map(
                    (
                      notification
                    ) => {

                      const Icon =
                        notification.icon;

                      return (

                        <div
                          key={
                            notification.id
                          }
                          style={{
                            display:
                              "flex",
                            gap:
                              "12px",
                            padding:
                              "14px 18px",
                            borderBottom:
                              "1px solid #f1f5f9"
                          }}
                        >

                          {/* ICON */}

                          <div
                            style={{
                              width:
                                "38px",
                              height:
                                "38px",
                              minWidth:
                                "38px",
                              borderRadius:
                                "10px",
                              background:
                                "#eff6ff",
                              color:
                                "#2563eb",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center"
                            }}
                          >
                            <Icon
                              size={18}
                            />
                          </div>


                          {/* CONTENT */}

                          <div
                            style={{
                              minWidth:
                                0,
                              flex: 1
                            }}
                          >

                            <strong
                              style={{
                                display:
                                  "block",
                                color:
                                  "#1e293b",
                                fontSize:
                                  "13px"
                              }}
                            >
                              {
                                notification.title
                              }
                            </strong>

                            <span
                              style={{
                                display:
                                  "block",
                                marginTop:
                                  "3px",
                                color:
                                  "#64748b",
                                fontSize:
                                  "12px",
                                lineHeight:
                                  "1.4"
                              }}
                            >
                              {
                                notification.message
                              }
                            </span>

                            <small
                              style={{
                                display:
                                  "block",
                                marginTop:
                                  "5px",
                                color:
                                  "#94a3b8",
                                fontSize:
                                  "11px"
                              }}
                            >
                              {
                                notification.time
                              }
                            </small>

                          </div>


                          {/* DELETE */}

                          <button
                            onClick={() =>
                              deleteNotification(
                                notification.id
                              )
                            }
                            title="Delete notification"
                            aria-label="Delete notification"
                            style={{
                              width:
                                "30px",
                              height:
                                "30px",
                              minWidth:
                                "30px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              border:
                                "none",
                              borderRadius:
                                "8px",
                              background:
                                "transparent",
                              color:
                                "#94a3b8",
                              cursor:
                                "pointer"
                            }}
                            onMouseEnter={(
                              event
                            ) => {
                              event.currentTarget.style.background =
                                "#fef2f2";

                              event.currentTarget.style.color =
                                "#dc2626";
                            }}
                            onMouseLeave={(
                              event
                            ) => {
                              event.currentTarget.style.background =
                                "transparent";

                              event.currentTarget.style.color =
                                "#94a3b8";
                            }}
                          >

                            <Trash2
                              size={16}
                            />

                          </button>

                        </div>

                      );

                    }
                  )}

                </div>

              )}

            </div>

          )}

        </div>


        {/* =================================================
            USER
        ================================================= */}

        <div className="header-user">

          <div className="header-avatar">

            {profileImage ? (

              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width:
                    "100%",
                  height:
                    "100%",
                  objectFit:
                    "cover",
                  borderRadius:
                    "50%"
                }}
              />

            ) : (

              firstLetter

            )}

          </div>

          <div className="header-user-info">

            <strong>
              {userName}
            </strong>

            <span>
              CCI User
            </span>

          </div>

        </div>

      </div>

    </header>
  );
}

// =====================================================
// NOTIFICATION TIME
// =====================================================

function formatNotificationTime(
  value
) {

  if (!value) {
    return "Recent";
  }

  try {

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Recent";
    }

    const now =
      new Date();

    const difference =
      now.getTime() -
      date.getTime();

    const minutes =
      Math.floor(
        difference /
        (1000 * 60)
      );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `${hours} hr${
        hours === 1
          ? ""
          : "s"
      } ago`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days < 7) {
      return `${days} day${
        days === 1
          ? ""
          : "s"
      } ago`;
    }

    return date.toLocaleDateString();

  } catch {

    return "Recent";

  }
}

export default Header;