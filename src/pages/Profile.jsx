import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Camera,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

// =====================================================
// PROFILE IMAGE STORAGE KEY
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
// PROFILE COMPONENT
// =====================================================

function Profile() {
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [message, setMessage] = useState("");

  // ===================================================
  // LOAD USER + PROFILE IMAGE
  // ===================================================

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    try {
      const savedUser =
        localStorage.getItem("cciCurrentUser");

      if (!savedUser) {
        setCurrentUser(null);
        setProfileImage("");
        return;
      }

      const user = JSON.parse(savedUser);

      setCurrentUser(user);

      // IMPORTANT:
      // Profile image is stored separately from
      // cciCurrentUser, so logout does not delete it.

      const imageKey =
        getProfileImageKey(user);

      if (imageKey) {
        const savedImage =
          localStorage.getItem(imageKey);

        if (savedImage) {
          setProfileImage(savedImage);
        } else {
          setProfileImage("");
        }
      }
    } catch (error) {
      console.error(
        "Profile loading error:",
        error
      );

      setCurrentUser(null);
      setProfileImage("");
    }
  };

  // ===================================================
  // USER INITIAL
  // ===================================================

  const getUserInitial = () => {
    const name =
      currentUser?.name ||
      currentUser?.email ||
      "User";

    return name
      .charAt(0)
      .toUpperCase();
  };

  // ===================================================
  // OPEN FILE SELECTOR
  // ===================================================

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // ===================================================
  // UPLOAD / CHANGE IMAGE
  // ===================================================

  const handleImageUpload = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // Check image type
    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    const imageKey =
      getProfileImageKey(currentUser);

    if (!imageKey) {
      setMessage(
        "User account could not be identified."
      );

      event.target.value = "";
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const imageData =
        reader.result;

      try {
        // =================================================
        // SAVE PER USER
        // =================================================

        localStorage.setItem(
          imageKey,
          imageData
        );

        // Update preview
        setProfileImage(imageData);

        setMessage(
          "Profile picture saved successfully."
        );
      } catch (error) {
        console.error(
          "Profile image save error:",
          error
        );

        setMessage(
          "Unable to save the profile picture. Storage may be full."
        );
      }
    };

    reader.onerror = () => {
      setMessage(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);

    // Allow selecting same image again
    event.target.value = "";
  };

  // ===================================================
  // REMOVE IMAGE
  // ===================================================

  const handleRemoveImage = () => {
    const imageKey =
      getProfileImageKey(currentUser);

    if (!imageKey) {
      return;
    }

    try {
      localStorage.removeItem(
        imageKey
      );

      setProfileImage("");

      setMessage(
        "Profile picture removed."
      );
    } catch (error) {
      console.error(
        "Profile image remove error:",
        error
      );

      setMessage(
        "Unable to remove the profile picture."
      );
    }
  };

  // ===================================================
  // SAVE PROFILE INFORMATION
  // ===================================================

  const handleSaveProfile = () => {
    if (!currentUser) {
      return;
    }

    try {
      localStorage.setItem(
        "cciCurrentUser",
        JSON.stringify(currentUser)
      );

      setMessage(
        "Profile saved successfully."
      );
    } catch (error) {
      console.error(
        "Profile save error:",
        error
      );

      setMessage(
        "Unable to save profile."
      );
    }
  };

  // ===================================================
  // NAME CHANGE
  // ===================================================

  const handleNameChange = (event) => {
    setCurrentUser((previous) => ({
      ...previous,
      name: event.target.value
    }));
  };

  // ===================================================
  // NO USER
  // ===================================================

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-empty-card">

          <User size={42} />

          <h2>
            No user profile found
          </h2>

          <p>
            Please login to view your profile.
          </p>

        </div>
      </div>
    );
  }


  // ===================================================
  // PROFESSIONAL PROFILE UI
  // ===================================================

  const styles = {
    page: {
      minHeight: "100%",
      padding: "32px",
      background: "#0f172a",
      color: "#e2e8f0",
      boxSizing: "border-box"
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "28px",
      padding: "22px 24px",
      border: "1px solid #334155",
      borderRadius: "16px",
      background: "#111827",
      boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "16px"
    },
    headerIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1e3a8a",
      color: "#93c5fd",
      border: "1px solid #3b82f6"
    },
    title: {
      margin: 0,
      fontSize: "28px",
      lineHeight: 1.2,
      fontWeight: 750,
      color: "#f8fafc"
    },
    subtitle: {
      margin: "6px 0 0",
      fontSize: "14px",
      color: "#94a3b8"
    },
    headerBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "7px",
      padding: "8px 12px",
      borderRadius: "999px",
      background: "#0f2f24",
      border: "1px solid #166534",
      color: "#86efac",
      fontSize: "12px",
      fontWeight: 600
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
      gap: "22px",
      maxWidth: "1100px"
    },
    card: {
      background: "#111827",
      border: "1px solid #334155",
      borderRadius: "16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
    },
    photoCard: {
      padding: "28px",
      textAlign: "center"
    },
    photoWrapper: {
      position: "relative",
      width: "150px",
      height: "150px",
      margin: "0 auto 20px"
    },
    photo: {
      width: "150px",
      height: "150px",
      objectFit: "cover",
      borderRadius: "50%",
      border: "4px solid #334155",
      display: "block"
    },
    placeholder: {
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      border: "4px solid #334155",
      background: "#1d4ed8",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "52px",
      fontWeight: 750,
      boxSizing: "border-box"
    },
    camera: {
      position: "absolute",
      right: "0",
      bottom: "4px",
      width: "42px",
      height: "42px",
      borderRadius: "50%",
      border: "3px solid #111827",
      background: "#2563eb",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    },
    name: {
      margin: "0",
      fontSize: "20px",
      fontWeight: 700,
      color: "#f8fafc"
    },
    email: {
      margin: "6px 0 0",
      fontSize: "13px",
      color: "#94a3b8",
      wordBreak: "break-word"
    },
    actions: {
      display: "flex",
      gap: "10px",
      justifyContent: "center",
      marginTop: "22px"
    },
    upload: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "10px 15px",
      borderRadius: "9px",
      border: "1px solid #2563eb",
      background: "#2563eb",
      color: "#ffffff",
      fontSize: "13px",
      fontWeight: 650,
      cursor: "pointer"
    },
    remove: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      padding: "10px 14px",
      borderRadius: "9px",
      border: "1px solid #475569",
      background: "transparent",
      color: "#cbd5e1",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    note: {
      margin: "18px 0 0",
      color: "#64748b",
      fontSize: "11px",
      lineHeight: 1.5
    },
    details: {
      padding: "28px"
    },
    cardHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingBottom: "20px",
      marginBottom: "24px",
      borderBottom: "1px solid #334155"
    },
    cardHeaderTitle: {
      margin: 0,
      color: "#f8fafc",
      fontSize: "19px",
      fontWeight: 700
    },
    cardHeaderText: {
      margin: "6px 0 0",
      color: "#94a3b8",
      fontSize: "13px"
    },
    security: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#172554",
      color: "#60a5fa",
      border: "1px solid #1e40af"
    },
    formGroup: {
      marginBottom: "20px"
    },
    label: {
      display: "flex",
      alignItems: "center",
      gap: "7px",
      marginBottom: "8px",
      color: "#cbd5e1",
      fontSize: "13px",
      fontWeight: 650
    },
    labelIcon: {
      color: "#60a5fa"
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px 14px",
      border: "1px solid #334155",
      borderRadius: "9px",
      background: "#0f172a",
      color: "#f8fafc",
      outline: "none",
      fontSize: "14px"
    },
    inputDisabled: {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px 14px",
      border: "1px solid #334155",
      borderRadius: "9px",
      background: "#0b1220",
      color: "#94a3b8",
      outline: "none",
      fontSize: "14px",
      cursor: "not-allowed"
    },
    inputNote: {
      display: "block",
      marginTop: "6px",
      color: "#64748b",
      fontSize: "11px"
    },
    save: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "11px 19px",
      border: "1px solid #2563eb",
      borderRadius: "9px",
      background: "#2563eb",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 650,
      cursor: "pointer",
      marginTop: "4px"
    },
    message: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginTop: "16px",
      padding: "11px 13px",
      border: "1px solid #166534",
      borderRadius: "9px",
      background: "#0f2f24",
      color: "#86efac",
      fontSize: "13px"
    },
    empty: {
      maxWidth: "500px",
      margin: "80px auto",
      padding: "40px",
      textAlign: "center",
      background: "#111827",
      border: "1px solid #334155",
      borderRadius: "16px",
      color: "#94a3b8"
    }
  };

  if (!currentUser) {
    return (
      <div style={styles.page}>
        <div style={styles.empty}>
          <User size={42} color="#60a5fa" />
          <h2 style={{ color: "#f8fafc", margin: "16px 0 8px" }}>
            No user profile found
          </h2>
          <p style={{ margin: 0 }}>
            Please login to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* ================================================
          VISIBLE PAGE HEADER
          ================================================ */}

      <div style={styles.header}>

        <div style={styles.headerLeft}>

          <div style={styles.headerIcon}>
            <User size={25} />
          </div>

          <div>
            <h1 style={styles.title}>
              Profile
            </h1>

            <p style={styles.subtitle}>
              Manage your account information and profile picture
            </p>
          </div>

        </div>

        <div style={styles.headerBadge}>
          <ShieldCheck size={15} />
          Account Active
        </div>

      </div>

      {/* ================================================
          PROFILE CONTENT
          ================================================ */}

      <div style={styles.grid}>

        {/* PROFILE PHOTO CARD */}

        <div style={{ ...styles.card, ...styles.photoCard }}>

          <div style={styles.photoWrapper}>

            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                style={styles.photo}
              />
            ) : (
              <div style={styles.placeholder}>
                {getUserInitial()}
              </div>
            )}

            <button
              type="button"
              onClick={handleUploadClick}
              title="Change profile picture"
              style={styles.camera}
            >
              <Camera size={18} />
            </button>

          </div>

          <h2 style={styles.name}>
            {currentUser.name || "CCI User"}
          </h2>

          <p style={styles.email}>
            {currentUser.email}
          </p>

          <div style={styles.actions}>

            <button
              type="button"
              onClick={handleUploadClick}
              style={styles.upload}
            >
              <Upload size={17} />

              {profileImage
                ? "Change Picture"
                : "Upload Picture"}
            </button>

            {profileImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                style={styles.remove}
              >
                <Trash2 size={17} />
                Remove
              </button>
            )}

          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />

          <p style={styles.note}>
            JPG, PNG, WEBP and other image formats.
            Maximum size: 5 MB.
          </p>

        </div>

        {/* PERSONAL INFORMATION CARD */}

        <div style={{ ...styles.card, ...styles.details }}>

          <div style={styles.cardHeader}>

            <div>
              <h2 style={styles.cardHeaderTitle}>
                Personal Information
              </h2>

              <p style={styles.cardHeaderText}>
                Update your basic account information.
              </p>
            </div>

            <div style={styles.security}>
              <ShieldCheck size={21} />
            </div>

          </div>

          {/* FULL NAME */}

          <div style={styles.formGroup}>

            <label style={styles.label}>
              <User
                size={16}
                style={styles.labelIcon}
              />
              Full Name
            </label>

            <input
              type="text"
              value={currentUser.name || ""}
              onChange={handleNameChange}
              placeholder="Enter your name"
              style={styles.input}
            />

          </div>

          {/* EMAIL */}

          <div style={styles.formGroup}>

            <label style={styles.label}>
              <Mail
                size={16}
                style={styles.labelIcon}
              />
              Email Address
            </label>

            <input
              type="email"
              value={currentUser.email || ""}
              disabled
              style={styles.inputDisabled}
            />

            <span style={styles.inputNote}>
              Email address is linked to your CCI account.
            </span>

          </div>

          {/* SAVE */}

          <button
            type="button"
            onClick={handleSaveProfile}
            style={styles.save}
          >
            <Save size={18} />
            Save Profile
          </button>

          {/* MESSAGE */}

          {message && (
            <div style={styles.message}>
              <CheckCircle2 size={17} />
              <span>{message}</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Profile;
