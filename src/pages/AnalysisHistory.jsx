import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Trash2,
  X,
  History,
  Clock,
  Star,
  Smartphone,
  AlertCircle,
  FileText,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function AnalysisHistory() {
  const [history, setHistory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);

  // =====================================================
  // GET CURRENT USER EMAIL
  // =====================================================

  const getCurrentUserEmail = () => {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("cciCurrentUser") || "null"
      );

      return currentUser?.email || "";
    } catch (error) {
      console.error(
        "Error reading current user:",
        error
      );

      return "";
    }
  };

  // =====================================================
  // LOAD DATA FROM MONGODB
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userEmail = getCurrentUserEmail();

      const historyUrl = userEmail
        ? `${API_URL}/api/analysis-history?userEmail=${encodeURIComponent(
            userEmail
          )}`
        : `${API_URL}/api/analysis-history`;

      const reviewsUrl = userEmail
        ? `${API_URL}/api/reviews?userEmail=${encodeURIComponent(
            userEmail
          )}`
        : `${API_URL}/api/reviews`;

      const [historyResponse, reviewsResponse] =
        await Promise.all([
          fetch(historyUrl),
          fetch(reviewsUrl),
        ]);

      if (!historyResponse.ok) {
        throw new Error(
          "Failed to load analysis history"
        );
      }

      if (!reviewsResponse.ok) {
        throw new Error(
          "Failed to load reviews"
        );
      }

      const historyData =
        await historyResponse.json();

      const reviewsData =
        await reviewsResponse.json();

      setHistory(
        Array.isArray(historyData.history)
          ? historyData.history
          : []
      );

      setReviews(
        Array.isArray(reviewsData.reviews)
          ? reviewsData.reviews
          : []
      );
    } catch (error) {
      console.error(
        "Error loading MongoDB history:",
        error
      );

      setHistory([]);
      setReviews([]);
    }
  };

  // =====================================================
  // MERGE HISTORY + REVIEW DATA
  // =====================================================

  const mergedHistory = useMemo(() => {
    return history.map((historyItem) => {
      const matchingReview = reviews.find(
        (reviewItem) =>
          String(reviewItem.id) ===
          String(historyItem.reviewId)
      );

      return {
        ...historyItem,

        // Get review information from MongoDB reviews
        review:
          matchingReview?.review ||
          "",

        // Get actual NLP results from MongoDB reviews
        nlpResults:
          matchingReview?.nlpResults ||
          null,

        rating:
          matchingReview?.rating ??
          0,

        userEmail:
          historyItem.userEmail ||
          matchingReview?.userEmail ||
          "",

        date:
          historyItem.date ||
          matchingReview?.date ||
          "",

        brand:
          historyItem.brand ||
          matchingReview?.brand ||
          "",

        product:
          historyItem.product ||
          matchingReview?.product ||
          "",

        status:
          historyItem.status ||
          matchingReview?.status ||
          "NLP Pending",
      };
    });
  }, [history, reviews]);

  // =====================================================
  // UNIQUE BRANDS
  // =====================================================

  const brands = useMemo(() => {
    const uniqueBrands = [
      ...new Set(
        mergedHistory
          .map((item) => item.brand)
          .filter(
            (brand) =>
              brand &&
              String(brand).trim() !== ""
          )
      ),
    ];

    return uniqueBrands.sort();
  }, [mergedHistory]);

  // =====================================================
  // FILTER HISTORY
  // =====================================================

  const filteredHistory = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return mergedHistory.filter((item) => {
      const matchesBrand =
        brandFilter === "All" ||
        item.brand === brandFilter;

      const searchableText = [
        item.brand,
        item.product,
        item.review,
        item.rating,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchText === "" ||
        searchableText.includes(searchText);

      return (
        matchesBrand &&
        matchesSearch
      );
    });
  }, [
    mergedHistory,
    search,
    brandFilter,
  ]);

  // =====================================================
  // DELETE ONE HISTORY ITEM
  // =====================================================

  const deleteHistoryItem = async (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this analysis?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const userEmail =
        getCurrentUserEmail();

      const deleteUrl = userEmail
        ? `${API_URL}/api/analysis-history/${encodeURIComponent(
            id
          )}?userEmail=${encodeURIComponent(
            userEmail
          )}`
        : `${API_URL}/api/analysis-history/${encodeURIComponent(
            id
          )}`;

      const response = await fetch(
        deleteUrl,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to delete analysis"
        );
      }

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to delete analysis"
        );
      }

      // Remove history from React state
      setHistory((previousHistory) =>
        previousHistory.filter(
          (item) =>
            String(item.id) !==
            String(id)
        )
      );

      // Get deleted history item
      const deletedHistoryItem =
        history.find(
          (item) =>
            String(item.id) ===
            String(id)
        );

      // Remove linked review from React state
      if (
        deletedHistoryItem?.reviewId
      ) {
        setReviews((previousReviews) =>
          previousReviews.filter(
            (review) =>
              String(review.id) !==
              String(
                deletedHistoryItem.reviewId
              )
          )
        );
      }

      // Close modal if deleted item
      // was currently selected
      if (
        selectedItem &&
        String(selectedItem.id) ===
          String(id)
      ) {
        setSelectedItem(null);
      }

    } catch (error) {
      console.error(
        "Error deleting analysis:",
        error
      );

      window.alert(
        error.message ||
          "Failed to delete analysis. Please try again."
      );
    }
  };

  // =====================================================
  // CLEAR ALL HISTORY
  // =====================================================

  const clearAllHistory = async () => {
    const confirmClear =
      window.confirm(
        "Are you sure you want to clear all analysis history?"
      );

    if (!confirmClear) {
      return;
    }

    try {
      const userEmail =
        getCurrentUserEmail();

      const clearUrl = userEmail
        ? `${API_URL}/api/analysis-history?userEmail=${encodeURIComponent(
            userEmail
          )}`
        : `${API_URL}/api/analysis-history`;

      const response = await fetch(
        clearUrl,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to clear analysis history"
        );
      }

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to clear analysis history"
        );
      }

      // Clear React state only after
      // successful backend deletion
      setHistory([]);
      setReviews([]);
      setSelectedItem(null);

    } catch (error) {
      console.error(
        "Error clearing analysis history:",
        error
      );

      window.alert(
        error.message ||
          "Failed to clear analysis history. Please try again."
      );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (item) => {
    if (!item.date) {
      return "Date not available";
    }

    const date = new Date(item.date);

    if (Number.isNaN(date.getTime())) {
      return String(item.date);
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // RATING
  // =====================================================

  const getRating = (item) => {
    const rating = Number(item.rating);

    if (
      Number.isNaN(rating) ||
      rating === 0
    ) {
      return "Not Rated";
    }

    return `${rating}/5`;
  };

  // =====================================================
  // REVIEW TEXT
  // =====================================================

  const getReviewText = (item) => {
    return (
      item.review ||
      "No review text available"
    );
  };

  // =====================================================
  // PRODUCT
  // =====================================================

  const getProductName = (item) => {
    return (
      item.product ||
      "Product not specified"
    );
  };

  // =====================================================
  // MODEL RESULT HELPERS
  // =====================================================

  const getModelResult = (model) => {
    if (!model) {
      return null;
    }

    return model;
  };

  const getModelLabel = (model) => {
    if (!model) {
      return "Result unavailable";
    }

    return (
      model.label ||
      model.sentiment ||
      model.prediction ||
      model.result ||
      "Result unavailable"
    );
  };

  const getModelConfidence = (model) => {
    if (
      !model ||
      model.confidence === undefined ||
      model.confidence === null
    ) {
      return null;
    }

    const confidence = Number(
      model.confidence
    );

    if (Number.isNaN(confidence)) {
      return null;
    }

    const percentage =
      confidence <= 1
        ? confidence * 100
        : confidence;

    return `${percentage.toFixed(2)}%`;
  };

  return (
    <div className="page-container history-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-header">

        <div>

          <div className="page-title-row">
            <History size={28} />

            <h1>
              Analysis History
            </h1>
          </div>

          <p>
            View and manage your previously
            submitted review analyses.
          </p>

        </div>

        {history.length > 0 && (
          <button
            className="danger-button"
            onClick={clearAllHistory}
          >
            <Trash2 size={17} />
            Clear All
          </button>
        )}

      </div>


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="history-stats-grid">

        <div className="history-stat-card">

          <div className="history-stat-icon">
            <FileText size={21} />
          </div>

          <div>
            <span>
              Total Analyses
            </span>

            <strong>
              {mergedHistory.length}
            </strong>
          </div>

        </div>


        <div className="history-stat-card">

          <div className="history-stat-icon">
            <Smartphone size={21} />
          </div>

          <div>
            <span>
              Products
            </span>

            <strong>
              {
                new Set(
                  mergedHistory
                    .map(
                      (item) =>
                        item.product
                    )
                    .filter(Boolean)
                ).size
              }
            </strong>
          </div>

        </div>


        <div className="history-stat-card">

          <div className="history-stat-icon">
            <Star size={21} />
          </div>

          <div>
            <span>
              Rated Reviews
            </span>

            <strong>
              {
                mergedHistory.filter(
                  (item) =>
                    Number(item.rating) > 0
                ).length
              }
            </strong>
          </div>

        </div>


        <div className="history-stat-card">

          <div className="history-stat-icon">
            <Clock size={21} />
          </div>

          <div>
            <span>
              Status
            </span>

            <strong>
              {history.length > 0
                ? "Stored"
                : "Empty"}
            </strong>
          </div>

        </div>

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="history-filter-card">

        <div className="history-search-box">

          <Search size={19} />

          <input
            type="text"
            placeholder="Search brand, product, review..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              className="history-clear-search"
              onClick={() =>
                setSearch("")
              }
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}

        </div>


        <div className="history-filter-select">

          <label>
            Brand
          </label>

          <select
            value={brandFilter}
            onChange={(e) =>
              setBrandFilter(
                e.target.value
              )
            }
          >

            <option value="All">
              All Brands
            </option>

            {brands.map((brand) => (
              <option
                key={brand}
                value={brand}
              >
                {brand}
              </option>
            ))}

          </select>

        </div>

      </div>


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {mergedHistory.length === 0 ? (

        <div className="history-empty-state">

          <div className="history-empty-icon">
            <History size={42} />
          </div>

          <h2>
            No Analysis History
          </h2>

          <p>
            Your submitted reviews will
            appear here after you perform
            an analysis from Review Explorer.
          </p>

        </div>

      ) : filteredHistory.length === 0 ? (

        <div className="history-empty-state">

          <div className="history-empty-icon">
            <Search size={42} />
          </div>

          <h2>
            No Matching Results
          </h2>

          <p>
            Try changing your search text
            or brand filter.
          </p>

          <button
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setBrandFilter("All");
            }}
          >
            Reset Filters
          </button>

        </div>

      ) : (

        /* =================================================
           HISTORY TABLE
        ================================================= */

        <div className="history-table-card">

          <div className="history-table-header">

            <div>

              <h2>
                Previous Analyses
              </h2>

              <span>
                Showing{" "}
                {filteredHistory.length}{" "}
                of{" "}
                {mergedHistory.length}{" "}
                records
              </span>

            </div>

          </div>


          <div className="history-table-wrapper">

            <table className="history-table">

              <thead>

                <tr>

                  <th>
                    Date & Time
                  </th>

                  <th>
                    Brand
                  </th>

                  <th>
                    Product
                  </th>

                  <th>
                    Rating
                  </th>

                  <th>
                    Review
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredHistory.map(
                  (item) => (

                    <tr key={item.id}>

                      <td>

                        <div className="history-date">

                          <Clock size={15} />

                          <span>
                            {formatDate(item)}
                          </span>

                        </div>

                      </td>


                      <td>

                        <span className="history-brand">
                          {item.brand ||
                            "Not specified"}
                        </span>

                      </td>


                      <td>

                        <span className="history-product">
                          {getProductName(item)}
                        </span>

                      </td>


                      <td>

                        <div className="history-rating">

                          <Star size={15} />

                          <span>
                            {getRating(item)}
                          </span>

                        </div>

                      </td>


                      <td>

                        <div className="history-review">

                          {getReviewText(item).length >
                          90
                            ? `${getReviewText(
                                item
                              ).substring(
                                0,
                                90
                              )}...`
                            : getReviewText(item)}

                        </div>

                      </td>


                      <td>

                        <span className="history-status">

                          {item.status ||
                            "NLP Pending"}

                        </span>

                      </td>


                      <td>

                        <div className="history-actions">

                          <button
                            className="history-view-button"
                            onClick={() =>
                              setSelectedItem(
                                item
                              )
                            }
                          >
                            View
                          </button>


                          <button
                            className="history-delete-button"
                            onClick={() =>
                              deleteHistoryItem(
                                item.id
                              )
                            }
                            title="Delete analysis"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* =================================================
          DETAIL MODAL
      ================================================= */}

      {selectedItem && (

        <div
          className="history-modal-overlay"
          onClick={() =>
            setSelectedItem(null)
          }
        >

          <div
            className="history-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="history-modal-header">

              <div>

                <h2>
                  Analysis Details
                </h2>

                <p>
                  Review submission information
                </p>

              </div>


              <button
                className="history-modal-close"
                onClick={() =>
                  setSelectedItem(null)
                }
              >
                <X size={20} />
              </button>

            </div>


            {/* =================================================
                DETAIL INFORMATION
            ================================================= */}

            <div className="history-detail-grid">

              <div className="history-detail-item">

                <span>
                  Brand
                </span>

                <strong>
                  {selectedItem.brand ||
                    "Not specified"}
                </strong>

              </div>


              <div className="history-detail-item">

                <span>
                  Product
                </span>

                <strong>
                  {getProductName(
                    selectedItem
                  )}
                </strong>

              </div>


              <div className="history-detail-item">

                <span>
                  Rating
                </span>

                <strong>
                  ⭐{" "}
                  {getRating(
                    selectedItem
                  )}
                </strong>

              </div>


              <div className="history-detail-item">

                <span>
                  Status
                </span>

                <strong>
                  {selectedItem.status ||
                    "NLP Pending"}
                </strong>

              </div>


              <div className="history-detail-item full-width">

                <span>
                  Date & Time
                </span>

                <strong>
                  {formatDate(
                    selectedItem
                  )}
                </strong>

              </div>


              <div className="history-detail-item full-width">

                <span>
                  Review
                </span>

                <div className="history-full-review">

                  {getReviewText(
                    selectedItem
                  )}

                </div>

              </div>

            </div>


            {/* =================================================
                MODEL ANALYSIS RESULTS
            ================================================= */}

            <div className="history-model-section">

              <h3>
                Model Analysis Results
              </h3>


              {selectedItem.nlpResults ? (

                <div className="history-model-grid">

                  {/* MODEL 1 */}

                  <div className="history-model-card">

                    <strong>
                      Model 1
                    </strong>

                    <span>
                      Text Only
                    </span>

                    <small>
                      {getModelLabel(
                        getModelResult(
                          selectedItem
                            .nlpResults
                            ?.model_1
                        )
                      )}
                    </small>

                    {getModelConfidence(
                      getModelResult(
                        selectedItem
                          .nlpResults
                          ?.model_1
                      )
                    ) && (
                      <small>
                        Confidence:{" "}
                        {getModelConfidence(
                          getModelResult(
                            selectedItem
                              .nlpResults
                              ?.model_1
                          )
                        )}
                      </small>
                    )}

                  </div>


                  {/* MODEL 2 */}

                  <div className="history-model-card">

                    <strong>
                      Model 2
                    </strong>

                    <span>
                      Text + Emoji
                    </span>

                    <small>
                      {getModelLabel(
                        getModelResult(
                          selectedItem
                            .nlpResults
                            ?.model_2
                        )
                      )}
                    </small>

                    {getModelConfidence(
                      getModelResult(
                        selectedItem
                          .nlpResults
                          ?.model_2
                      )
                    ) && (
                      <small>
                        Confidence:{" "}
                        {getModelConfidence(
                          getModelResult(
                            selectedItem
                              .nlpResults
                              ?.model_2
                          )
                        )}
                      </small>
                    )}

                  </div>


                  {/* MODEL 3 */}

                  <div className="history-model-card">

                    <strong>
                      Model 3
                    </strong>

                    <span>
                      Text + Emoji + Context
                    </span>

                    <small>
                      {getModelLabel(
                        getModelResult(
                          selectedItem
                            .nlpResults
                            ?.model_3
                        )
                      )}
                    </small>

                    {getModelConfidence(
                      getModelResult(
                        selectedItem
                          .nlpResults
                          ?.model_3
                      )
                    ) && (
                      <small>
                        Confidence:{" "}
                        {getModelConfidence(
                          getModelResult(
                            selectedItem
                              .nlpResults
                              ?.model_3
                          )
                        )}
                      </small>
                    )}

                  </div>

                </div>

              ) : (

                <div className="history-pending-note">

                  <AlertCircle size={18} />

                  <span>
                    NLP analysis results are not
                    available for this analysis.
                  </span>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AnalysisHistory;