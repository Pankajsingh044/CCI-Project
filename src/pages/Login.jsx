import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Brain,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://cci-project.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid email or password."
        );
      }

      if (!data.success || !data.user) {
        throw new Error(
          "Login failed. Please try again."
        );
      }

      // Save logged-in user
      localStorage.setItem(
        "cciCurrentUser",
        JSON.stringify(data.user)
      );

      // Go to Home
      navigate("/home");

    } catch (error) {
      console.error("Login Error:", error);

      setError(
        error.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Left Section */}
        <div className="auth-info">

          <div className="brand-logo">
            <Brain size={30} />
          </div>

          <h1>CCI</h1>

          <h2>
            Contextual Communication Intelligence
          </h2>

          <p>
            Understanding Reviews Beyond Words.
          </p>

          <div className="auth-feature">
            <span>✓</span>
            <p>Text-based review analysis</p>
          </div>

          <div className="auth-feature">
            <span>✓</span>
            <p>Emoji-aware analysis</p>
          </div>

          <div className="auth-feature">
            <span>✓</span>
            <p>Contextual communication research</p>
          </div>

        </div>

        {/* Login Form */}
        <div className="auth-card">

          <div className="auth-header">
            <h2>Welcome Back</h2>

            <p>
              Sign in to continue to CCI
            </p>
          </div>

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="form-group">

              <label>Email</label>

              <div className="input-wrapper">

                <Mail size={19} />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={loading}
                />

              </div>

            </div>

            {/* Password */}
            <div className="form-group">

              <label>Password</label>

              <div className="input-wrapper">

                <Lock size={19} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

          </form>

          {/* Footer */}
          <div className="auth-footer">

            <p>
              Don't have an account?{" "}

              <Link to="/signup">
                Create Account
              </Link>
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;