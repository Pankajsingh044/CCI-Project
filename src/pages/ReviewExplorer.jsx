import { useState } from "react";
import {
  Search,
  Sparkles,
  MessageSquare,
  Smile,
  Brain,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from "lucide-react";

import { analyzeReviewWithNLP } from "../services/nlpService";

const API_URL = "https://cci-project.onrender.com";

const brands = [
  "Apple",
  "Samsung",
  "OnePlus",
  "Sony"
];

const products = {
  Apple: [
    "iPhone 15",
    "iPhone 15 Pro",
    "iPhone 16",
    "MacBook Air"
  ],
  Samsung: [
    "Galaxy S24",
    "Galaxy S24 Ultra",
    "Galaxy A55",
    "Galaxy Buds"
  ],
  OnePlus: [
    "OnePlus 12",
    "OnePlus 12R",
    "OnePlus Nord",
    "OnePlus Buds"
  ],
  Sony: [
    "Sony WH-1000XM5",
    "Sony WF-1000XM5",
    "Sony Xperia",
    "Sony LinkBuds"
  ]
};

function ReviewExplorer() {
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");

  const [manualBrand, setManualBrand] = useState("");
  const [manualProduct, setManualProduct] = useState("");

  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [analysisResults, setAnalysisResults] = useState(null);

  const isManualBrand = brand === "Manual";
  const isManualProduct = product === "Manual";

  const finalBrand = isManualBrand ? manualBrand : brand;
  const finalProduct = isManualProduct ? manualProduct : product;

  const handleBrandChange = (value) => {
    setBrand(value);
    setProduct("");
    setManualProduct("");
    setError("");
    setSubmitted(false);
    setAnalysisResults(null);
  };

  const handleAnalyze = async () => {
    setError("");
    setSubmitted(false);
    setAnalysisResults(null);

    if (!finalBrand.trim()) {
      setError("Please select or enter a brand.");
      return;
    }

    if (!finalProduct.trim()) {
      setError("Please select or enter a product.");
      return;
    }

    if (!review.trim()) {
      setError("Please enter a customer review.");
      return;
    }

    if (review.trim().length < 5) {
      setError("Please enter a meaningful review.");
      return;
    }

    setLoading(true);

    try {
      // =====================================================
      // STEP 1: REAL NLP ANALYSIS
      // =====================================================

      const nlpResponse = await analyzeReviewWithNLP({
        review: review.trim(),
        brand: finalBrand,
        product: finalProduct,
        rating: rating
      });

      // =====================================================
      // GET CURRENT LOGGED-IN USER
      // =====================================================

      const currentUser = JSON.parse(
        localStorage.getItem("cciCurrentUser") || "null"
      );

      const userEmail = currentUser?.email || "";

      // =====================================================
      // CREATE DATE
      // =====================================================

      const reviewDate = new Date().toLocaleString();

      // =====================================================
      // STEP 2: SAVE REVIEW TO MONGODB
      // =====================================================

      const reviewResponse = await fetch(
        `${API_URL}/api/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userEmail: userEmail,
            brand: finalBrand,
            product: finalProduct,
            review: review.trim(),
            rating: rating,
            date: reviewDate,
            nlpResults: nlpResponse.results,
            status: "NLP Completed"
          })
        }
      );

      const reviewData = await reviewResponse.json();

      if (!reviewResponse.ok) {
        throw new Error(
          reviewData.detail ||
          "Failed to save review to MongoDB."
        );
      }

      if (!reviewData.success || !reviewData.review) {
        throw new Error(
          "Review was analyzed but could not be saved."
        );
      }

      // MongoDB generated review ID
      const reviewId = reviewData.review.id;

      // =====================================================
      // STEP 3: SAVE ANALYSIS HISTORY TO MONGODB
      // =====================================================

      const historyResponse = await fetch(
        `${API_URL}/api/analysis-history`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userEmail: userEmail,
            reviewId: reviewId,
            brand: finalBrand,
            product: finalProduct,
            date: reviewDate,
            status: "NLP Completed"
          })
        }
      );

      const historyData = await historyResponse.json();

      if (!historyResponse.ok) {
        console.warn(
          "Review saved, but analysis history could not be saved:",
          historyData.detail
        );
      }

      // =====================================================
      // STEP 4: DISPLAY REAL NLP RESULTS
      // =====================================================

      setAnalysisResults(
        nlpResponse.results
      );

      setSubmitted(true);

    } catch (backendError) {

      console.error(
        "Review analysis/save failed:",
        backendError
      );

      setError(
        backendError.message ||
        "Unable to connect to the backend."
      );

    } finally {

      setLoading(false);

    }
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset = () => {
    setBrand("");
    setProduct("");
    setManualBrand("");
    setManualProduct("");
    setReview("");
    setRating(0);

    setError("");
    setSubmitted(false);
    setAnalysisResults(null);
    setLoading(false);
  };

  // ==========================================================
  // SENTIMENT LABEL CLASS
  // ==========================================================

  const getLabelClass = (label) => {

    if (label === "POSITIVE") {
      return "analysis-label positive";
    }

    if (label === "NEGATIVE") {
      return "analysis-label negative";
    }

    return "analysis-label neutral";
  };

  // ==========================================================
  // FORMAT CONFIDENCE SCORE
  // ==========================================================

  const formatScore = (score) => {

    if (typeof score !== "number") {
      return "-";
    }

    return `${(score * 100).toFixed(2)}%`;
  };

  return (
    <div className="review-explorer-page">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="review-page-header">

        <div>

          <div className="page-eyebrow">
            CCI ANALYSIS WORKSPACE
          </div>

          <h1>
            Review Explorer
          </h1>

          <p>
            Analyze customer reviews using text, emoji,
            and contextual signals.
          </p>

        </div>

        <div className="review-header-icon">
          <Search size={25} />
        </div>

      </div>


      {/* =====================================================
          REVIEW INPUT CARD
      ====================================================== */}

      <div className="review-input-card">

        <div className="section-title">

          <div className="section-title-icon">
            <MessageSquare size={19} />
          </div>

          <div>

            <h2>
              Review Information
            </h2>

            <p>
              Select the product and enter the customer review.
            </p>

          </div>

        </div>


        {/* =================================================
            BRAND + PRODUCT
        ================================================== */}

        <div className="review-form-grid">

          {/* BRAND */}

          <div className="review-field">

            <label>
              Brand
            </label>

            <select
              value={brand}
              onChange={(e) =>
                handleBrandChange(e.target.value)
              }
            >

              <option value="">
                Select brand
              </option>

              {brands.map((item) => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              ))}

              <option value="Manual">
                Other / Enter Manually
              </option>

            </select>

          </div>


          {/* PRODUCT */}

          <div className="review-field">

            <label>
              Product / Model
            </label>

            {!isManualBrand && !isManualProduct ? (

              <select
                value={product}
                onChange={(e) =>
                  setProduct(e.target.value)
                }
                disabled={!brand}
              >

                <option value="">
                  {brand
                    ? "Select product"
                    : "Select brand first"}
                </option>

                {brand &&
                  products[brand]?.map((item) => (

                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>

                  ))}

                {brand && (

                  <option value="Manual">
                    Other / Enter Manually
                  </option>

                )}

              </select>

            ) : (

              <input
                type="text"
                value={manualProduct}
                onChange={(e) =>
                  setManualProduct(e.target.value)
                }
                placeholder="Enter product/model name"
              />

            )}

          </div>

        </div>


        {/* =================================================
            MANUAL BRAND
        ================================================== */}

        {isManualBrand && (

          <div className="manual-field">

            <label>
              Enter Brand Name
            </label>

            <input
              type="text"
              value={manualBrand}
              onChange={(e) =>
                setManualBrand(e.target.value)
              }
              placeholder="Example: Xiaomi"
            />

          </div>

        )}


        {/* =================================================
            CUSTOMER REVIEW
        ================================================== */}

        <div className="review-field review-text-field">

          <div className="label-row">

            <label>
              Customer Review
            </label>

            <span>
              {review.length}/2000
            </span>

          </div>

          <textarea
            value={review}
            maxLength={2000}
            onChange={(e) =>
              setReview(e.target.value)
            }
            placeholder="Write or paste the customer review here..."
          />

        </div>


        {/* =================================================
            RATING
        ================================================== */}

        <div className="rating-section">

          <label>
            Rating
          </label>

          <div className="rating-row">

            {[1, 2, 3, 4, 5].map((star) => (

              <button
                key={star}
                type="button"
                className={
                  star <= rating
                    ? "star active"
                    : "star"
                }
                onClick={() =>
                  setRating(star)
                }
              >
                ★
              </button>

            ))}

            <span>

              {rating === 0
                ? "No rating selected"
                : `${rating} out of 5`}

            </span>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="review-error">

            <AlertCircle size={17} />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            SUCCESS
        ================================================== */}

        {submitted && (

          <div className="review-success">

            <CheckCircle2 size={17} />

            <span>
              Review analyzed and saved successfully.
            </span>

          </div>

        )}


        {/* =================================================
            BUTTONS
        ================================================== */}

        <div className="review-actions">

          <button
            className="review-reset-button"
            onClick={handleReset}
            disabled={loading}
          >

            <RotateCcw size={16} />

            Reset

          </button>


          <button
            className="review-analyze-button"
            onClick={handleAnalyze}
            disabled={loading}
          >

            <Sparkles size={17} />

            {loading
              ? "Analyzing Review..."
              : "Analyze Review"}

          </button>

        </div>

      </div>


      {/* =====================================================
          ANALYSIS SECTION
      ====================================================== */}

      <div className="analysis-section">

        <div className="analysis-section-header">

          <div>

            <div className="page-eyebrow">
              RESEARCH COMPARISON
            </div>

            <h2>
              Three-Level Analysis
            </h2>

            <p>
              Compare the role of text, emojis and context
              in review interpretation.
            </p>

          </div>

          <Brain size={25} />

        </div>


        <div className="analysis-model-grid">


          {/* =================================================
              MODEL 1
          ================================================== */}

          <div className="analysis-model-card">

            <div className="model-card-top">

              <div className="model-card-number">
                01
              </div>

              <span className="pending-badge">
                Real NLP
              </span>

            </div>

            <h3>
              Text Only
            </h3>

            <p className="model-description">
              Analysis using only the written review text.
            </p>


            {analysisResults?.model_1 ? (

              <div className="real-analysis-result">

                <div className="result-icon">
                  <Brain size={25} />
                </div>

                <strong>
                  Sentiment Result
                </strong>

                <div
                  className={getLabelClass(
                    analysisResults.model_1.label
                  )}
                >
                  {analysisResults.model_1.label}
                </div>

                <span>
                  Confidence:{" "}
                  {formatScore(
                    analysisResults.model_1.score
                  )}
                </span>

              </div>

            ) : (

              <div className="pending-analysis">

                <Brain size={25} />

                <strong>
                  NLP Analysis Pending
                </strong>

                <span>
                  Enter a review and click
                  Analyze Review to run the real NLP model.
                </span>

              </div>

            )}

          </div>


          {/* =================================================
              MODEL 2
          ================================================== */}

          <div className="analysis-model-card">

            <div className="model-card-top">

              <div className="model-card-number">
                02
              </div>

              <span className="pending-badge">
                Real NLP
              </span>

            </div>

            <h3>
              Text + Emoji
            </h3>

            <p className="model-description">
              Analysis using review text together with emojis.
            </p>


            {analysisResults?.model_2 ? (

              <div className="real-analysis-result">

                <div className="result-icon">
                  <Smile size={25} />
                </div>

                <strong>
                  Sentiment Result
                </strong>

                <div
                  className={getLabelClass(
                    analysisResults.model_2.label
                  )}
                >
                  {analysisResults.model_2.label}
                </div>

                <span>
                  Confidence:{" "}
                  {formatScore(
                    analysisResults.model_2.score
                  )}
                </span>


                {analysisResults.model_2.emojis?.length > 0 && (

                  <div className="emoji-result-list">

                    <strong>
                      Emojis Detected
                    </strong>

                    <div>
                      {analysisResults.model_2.emojis.join(" ")}
                    </div>

                  </div>

                )}


                {analysisResults.model_2.emoji_meanings?.length > 0 && (

                  <div className="emoji-result-list">

                    <strong>
                      Emoji Meaning
                    </strong>

                    <div>
                      {analysisResults.model_2.emoji_meanings.join(
                        ", "
                      )}
                    </div>

                  </div>

                )}

              </div>

            ) : (

              <div className="pending-analysis">

                <Smile size={25} />

                <strong>
                  NLP Analysis Pending
                </strong>

                <span>
                  Enter a review with emojis and run
                  the NLP analysis.
                </span>

              </div>

            )}

          </div>


          {/* =================================================
              MODEL 3
          ================================================== */}

          <div className="analysis-model-card">

            <div className="model-card-top">

              <div className="model-card-number">
                03
              </div>

              <span className="pending-badge">
                Real NLP
              </span>

            </div>

            <h3>
              Text + Emoji + Context
            </h3>

            <p className="model-description">
              Analysis using text, emoji and product context.
            </p>


            {analysisResults?.model_3 ? (

              <div className="real-analysis-result">

                <div className="result-icon">
                  <Sparkles size={25} />
                </div>

                <strong>
                  Contextual Sentiment Result
                </strong>

                <div
                  className={getLabelClass(
                    analysisResults.model_3.label
                  )}
                >
                  {analysisResults.model_3.label}
                </div>

                <span>
                  Confidence:{" "}
                  {formatScore(
                    analysisResults.model_3.score
                  )}
                </span>


                {analysisResults.model_3.emojis?.length > 0 && (

                  <div className="emoji-result-list">

                    <strong>
                      Emojis
                    </strong>

                    <div>
                      {analysisResults.model_3.emojis.join(" ")}
                    </div>

                  </div>

                )}


                {analysisResults.model_3.emoji_meanings?.length > 0 && (

                  <div className="emoji-result-list">

                    <strong>
                      Emoji Meaning
                    </strong>

                    <div>
                      {analysisResults.model_3.emoji_meanings.join(
                        ", "
                      )}
                    </div>

                  </div>

                )}


                <div className="context-result">

                  <strong>
                    Context
                  </strong>

                  <div>

                    <span>
                      Brand:{" "}
                      {analysisResults.model_3.context?.brand ||
                        "Not provided"}
                    </span>

                    <span>
                      Product:{" "}
                      {analysisResults.model_3.context?.product ||
                        "Not provided"}
                    </span>

                    <span>
                      Rating:{" "}
                      {analysisResults.model_3.context?.rating ||
                        "Not provided"}
                    </span>

                  </div>

                </div>

              </div>

            ) : (

              <div className="pending-analysis">

                <Sparkles size={25} />

                <strong>
                  NLP Analysis Pending
                </strong>

                <span>
                  Enter review information and run
                  the contextual NLP analysis.
                </span>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          OVERALL CONCLUSION
      ====================================================== */}

      <div className="overall-conclusion">

        <div className="conclusion-icon">
          <Brain size={23} />
        </div>

        <div>

          <div className="page-eyebrow">
            OVERALL CONCLUSION
          </div>

          <h2>
            {analysisResults
              ? "NLP Analysis Completed"
              : "Awaiting NLP Backend Analysis"}
          </h2>

          <p>

            {analysisResults
              ? "The three analysis approaches have been processed by the connected NLP backend. The results shown above are returned from the real sentiment analysis model."
              : "CCI will compare the three analytical approaches after the NLP engine is connected. No sentiment, emotion, sarcasm, or contextual result is generated by the frontend alone."}

          </p>

        </div>

      </div>

    </div>
  );
}

export default ReviewExplorer;