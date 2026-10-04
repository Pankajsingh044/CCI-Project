import {
  MessageSquareText,
  BarChart3,
  Smile,
  Database,
  ArrowRight,
  Upload,
  Activity
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import { getDataset } from "../services/datasetStorage";

// =====================================================
// API URLS
// =====================================================

const ANALYTICS_API_URL =
  "http://127.0.0.1:8000/api/analytics";

const HISTORY_API_URL =
  "http://127.0.0.1:8000/api/analysis-history";

// =====================================================
// HOME
// =====================================================

function Home() {

  const navigate = useNavigate();

  // =====================================================
  // CURRENT USER
  // =====================================================

  const currentUser = JSON.parse(
    localStorage.getItem("cciCurrentUser") || "null"
  );

  const userName =
    currentUser?.name || "User";

  const userEmail =
    currentUser?.email || "";

  // =====================================================
  // LIVE DATA
  // =====================================================

  const [analytics, setAnalytics] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [dataset, setDataset] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =====================================================
  // LOAD HOME DATA
  // =====================================================

  useEffect(() => {

    const loadHomeData = async () => {

      setLoading(true);

      try {

        // -------------------------------------------------
        // LOAD DATASET FROM INDEXEDDB
        // -------------------------------------------------

        const savedDataset =
          await getDataset();

        setDataset(
          savedDataset || null
        );

        // -------------------------------------------------
        // LOAD MONGODB DATA
        // -------------------------------------------------

        if (!userEmail) {

          setAnalytics(null);
          setHistory([]);

          return;
        }

        const encodedEmail =
          encodeURIComponent(userEmail);

        // -------------------------------------------------
        // ANALYTICS
        // -------------------------------------------------

        const analyticsResponse =
          await fetch(
            `${ANALYTICS_API_URL}?userEmail=${encodedEmail}`
          );

        if (!analyticsResponse.ok) {
          throw new Error(
            "Unable to load analytics."
          );
        }

        const analyticsData =
          await analyticsResponse.json();

        setAnalytics(
          analyticsData
        );

        // -------------------------------------------------
        // ANALYSIS HISTORY
        // -------------------------------------------------

        const historyResponse =
          await fetch(
            `${HISTORY_API_URL}?userEmail=${encodedEmail}`
          );

        if (!historyResponse.ok) {
          throw new Error(
            "Unable to load analysis history."
          );
        }

        const historyData =
          await historyResponse.json();

        // -------------------------------------------------
        // SUPPORT ARRAY OR WRAPPED RESPONSE
        // -------------------------------------------------

        let historyItems = [];

        if (Array.isArray(historyData)) {

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

        setHistory(
          historyItems
        );

      } catch (error) {

        console.error(
          "Unable to load Home data:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

    loadHomeData();

  }, [userEmail]);

  // =====================================================
  // LIVE VALUES
  // =====================================================

  const totalReviews =
    analytics?.totalReviews ?? 0;

  const totalAnalyses =
    history.length;

  const totalEmojiCount =
    analytics?.totalEmojiCount ?? 0;

  const hasDataset =
    !!dataset;

  const datasetRows =
    dataset?.rows?.length || 0;

  // =====================================================
  // RECENT HISTORY
  // =====================================================

  const recentHistory =
    history.slice(0, 5);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="home-page">

      {/* Welcome */}

      <section className="welcome-section">

        <div>

          <p className="page-eyebrow">
            CONTEXTUAL COMMUNICATION INTELLIGENCE
          </p>

          <h1>
            Welcome back, {userName} 👋
          </h1>

          <p className="welcome-description">
            Analyze customer reviews beyond words using text,
            emojis and contextual signals.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate("/review-explorer")
          }
        >
          <MessageSquareText size={18} />
          Analyze a Review
        </button>

      </section>


      {/* Statistics */}

      <section className="stats-grid">

        {/* TOTAL REVIEWS */}

        <div className="stat-card">

          <div className="stat-icon blue">
            <MessageSquareText size={22} />
          </div>

          <div>

            <span>
              Total Reviews
            </span>

            <strong>
              {loading
                ? "—"
                : totalReviews}
            </strong>

            <small>
              Reviews analyzed
            </small>

          </div>

        </div>


        {/* ANALYSES */}

        <div className="stat-card">

          <div className="stat-icon purple">
            <BarChart3 size={22} />
          </div>

          <div>

            <span>
              Analyses
            </span>

            <strong>
              {loading
                ? "—"
                : totalAnalyses}
            </strong>

            <small>
              Analysis sessions
            </small>

          </div>

        </div>


        {/* EMOJI INSIGHTS */}

        <div className="stat-card">

          <div className="stat-icon orange">
            <Smile size={22} />
          </div>

          <div>

            <span>
              Emoji Insights
            </span>

            <strong>
              {loading
                ? "—"
                : totalEmojiCount}
            </strong>

            <small>
              Emojis detected
            </small>

          </div>

        </div>


        {/* DATASETS */}

        <div className="stat-card">

          <div className="stat-icon green">
            <Database size={22} />
          </div>

          <div>

            <span>
              Datasets
            </span>

            <strong>
              {loading
                ? "—"
                : hasDataset
                ? "1"
                : "0"}
            </strong>

            <small>
              {hasDataset
                ? `${datasetRows} records loaded`
                : "Upload a dataset"}
            </small>

          </div>

        </div>

      </section>


      {/* Main grid */}

      <section className="dashboard-grid">

        {/* Quick Analysis */}

        <div className="dashboard-card quick-analysis">

          <div className="card-header">

            <div>

              <h2>
                Start Review Analysis
              </h2>

              <p>
                Compare how text, emoji and context
                influence review interpretation.
              </p>

            </div>

            <Activity size={24} />

          </div>


          <div className="analysis-models">

            <div className="model-item">

              <div className="model-number">
                01
              </div>

              <div>

                <strong>
                  Text Only
                </strong>

                <p>
                  Analyze the written review.
                </p>

              </div>

            </div>


            <div className="model-item">

              <div className="model-number">
                02
              </div>

              <div>

                <strong>
                  Text + Emoji
                </strong>

                <p>
                  Include emoji information.
                </p>

              </div>

            </div>


            <div className="model-item">

              <div className="model-number">
                03
              </div>

              <div>

                <strong>
                  Text + Emoji + Context
                </strong>

                <p>
                  Include contextual signals.
                </p>

              </div>

            </div>

          </div>


          <button
            className="secondary-button"
            onClick={() =>
              navigate("/review-explorer")
            }
          >
            Start Analysis
            <ArrowRight size={17} />
          </button>

        </div>


        {/* Quick Actions */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <h2>
                Quick Actions
              </h2>

              <p>
                Access common CCI tools.
              </p>

            </div>

          </div>


          <div className="quick-actions">

            <button
              onClick={() =>
                navigate("/dataset-analysis")
              }
            >

              <Upload size={19} />

              <div>

                <strong>
                  Upload Dataset
                </strong>

                <span>
                  CSV, XLSX or JSON
                </span>

              </div>

              <ArrowRight size={16} />

            </button>


            <button
              onClick={() =>
                navigate("/analytics")
              }
            >

              <BarChart3 size={19} />

              <div>

                <strong>
                  View Analytics
                </strong>

                <span>
                  Explore review metrics
                </span>

              </div>

              <ArrowRight size={16} />

            </button>


            <button
              onClick={() =>
                navigate("/emoji-explorer")
              }
            >

              <Smile size={19} />

              <div>

                <strong>
                  Explore Emojis
                </strong>

                <span>
                  Study emoji usage
                </span>

              </div>

              <ArrowRight size={16} />

            </button>


            <button
              onClick={() =>
                navigate("/product-comparison")
              }
            >

              <Database size={19} />

              <div>

                <strong>
                  Compare Products
                </strong>

                <span>
                  View descriptive metrics
                </span>

              </div>

              <ArrowRight size={16} />

            </button>

          </div>

        </div>

      </section>


      {/* Bottom information */}

      <section className="dashboard-grid bottom-grid">

        {/* Recent Analysis */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <h2>
                Recent Analysis
              </h2>

              <p>
                Your latest review analysis sessions.
              </p>

            </div>

            <button
              className="text-button"
              onClick={() =>
                navigate("/analysis-history")
              }
            >
              View All
            </button>

          </div>


          {loading ? (

            <div className="empty-state">

              <MessageSquareText size={32} />

              <h3>
                Loading analysis...
              </h3>

              <p>
                Fetching your latest analysis sessions.
              </p>

            </div>

          ) : recentHistory.length === 0 ? (

            <div className="empty-state">

              <MessageSquareText size={32} />

              <h3>
                No analysis yet
              </h3>

              <p>
                Submit your first review to begin
                contextual analysis.
              </p>

              <button
                className="secondary-button"
                onClick={() =>
                  navigate("/review-explorer")
                }
              >
                Analyze First Review
              </button>

            </div>

          ) : (

            <div className="recent-list">

              {recentHistory.map(
                (item, index) => (

                  <div
                    className="recent-item"
                    key={
                      item._id ||
                      item.id ||
                      index
                    }
                  >

                    <div className="recent-icon">
                      <MessageSquareText size={18} />
                    </div>

                    <div>

                      <strong>
                        {item.product ||
                          item.productName ||
                          "Review Analysis"}
                      </strong>

                      <span>
                        {item.date ||
                          item.createdAt ||
                          item.analyzedAt ||
                          "Recent analysis"}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>


        {/* CCI Information */}

        <div className="dashboard-card information-card">

          <div className="info-icon">
            <Activity size={25} />
          </div>

          <h2>
            How CCI Works
          </h2>

          <p>
            CCI studies customer reviews using three
            analytical perspectives.
          </p>

          <div className="info-points">

            <div>

              <span>
                01
              </span>

              <p>

                <strong>
                  Text
                </strong>

                <br />

                Understand the written review.

              </p>

            </div>


            <div>

              <span>
                02
              </span>

              <p>

                <strong>
                  Emoji
                </strong>

                <br />

                Capture additional emotional signals.

              </p>

            </div>


            <div>

              <span>
                03
              </span>

              <p>

                <strong>
                  Context
                </strong>

                <br />

                Consider surrounding communication context.

              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;