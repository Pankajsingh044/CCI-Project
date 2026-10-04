import { useEffect, useState } from "react";

import {
  Upload,
  FileSpreadsheet,
  Database,
  Columns3,
  AlertCircle,
  Star,
  Smile,
  FileText,
  Copy,
  Trash2,
  CheckCircle2,
  Brain,
  Play,
  Target,
  BarChart3,
  RefreshCw,
} from "lucide-react";

import Papa from "papaparse";
import * as XLSX from "xlsx";

import { evaluateUploadedDataset } from "../services/nlpService";

import {
  saveDataset,
  getDataset,
  deleteDataset,
} from "../services/datasetStorage";


// =====================================================
// FIND COLUMN
// =====================================================

function findColumn(columns, names) {
  for (const name of names) {
    const exact = columns.find(
      (column) =>
        String(column).toLowerCase().trim() ===
        name.toLowerCase().trim()
    );

    if (exact) {
      return exact;
    }
  }

  for (const name of names) {
    const partial = columns.find(
      (column) =>
        String(column)
          .toLowerCase()
          .includes(name.toLowerCase())
    );

    if (partial) {
      return partial;
    }
  }

  return null;
}


// =====================================================
// FIND REVIEW COLUMN
// =====================================================

function findReviewColumn(rows, columns) {
  if (!rows.length || !columns.length) {
    return null;
  }

  const blockedColumns = [
    "id",
    "review_id",
    "reviewid",
    "user_id",
    "userid",
    "customer_id",
    "customerid",
    "product_id",
    "productid",
    "rating",
    "ratings",
    "stars",
    "score",
    "brand",
    "manufacturer",
    "product",
    "product_name",
    "productname",
    "category",
    "date",
    "review_date",
    "verified",
    "verified_purchase",
    "helpful_votes",
    "vote",
  ];

  const preferredNames = [
    "review_text",
    "reviewtext",
    "review_body",
    "reviewbody",
    "review_content",
    "reviewcontent",
    "review",
    "review_title",
    "comment",
    "comments",
    "text",
    "content",
    "body",
    "description",
    "feedback",
  ];

  for (const name of preferredNames) {
    const match = columns.find(
      (column) =>
        String(column).toLowerCase().trim() ===
        name.toLowerCase().trim()
    );

    if (match) {
      return match;
    }
  }

  const candidates = columns
    .filter(
      (column) =>
        !blockedColumns.includes(
          String(column).toLowerCase().trim()
        )
    )
    .map((column) => {
      const values = rows
        .map((row) => row[column])
        .filter(
          (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        )
        .slice(0, 500);

      if (!values.length) {
        return {
          column,
          score: 0,
        };
      }

      const textValues = values.map((value) =>
        String(value)
      );

      const averageLength =
        textValues.reduce(
          (sum, value) =>
            sum + value.length,
          0
        ) / textValues.length;

      const longTextRatio =
        textValues.filter(
          (value) => value.length > 30
        ).length / textValues.length;

      let score = 0;

      if (averageLength > 20) {
        score += 2;
      }

      if (averageLength > 50) {
        score += 2;
      }

      if (longTextRatio > 0.3) {
        score += 2;
      }

      const lowerName =
        String(column).toLowerCase();

      if (
        lowerName.includes("review") ||
        lowerName.includes("comment") ||
        lowerName.includes("text") ||
        lowerName.includes("content") ||
        lowerName.includes("feedback")
      ) {
        score += 5;
      }

      return {
        column,
        score,
      };
    });

  candidates.sort(
    (a, b) => b.score - a.score
  );

  return candidates.length &&
    candidates[0].score > 0
    ? candidates[0].column
    : null;
}


// =====================================================
// EMOJI DETECTION
// =====================================================

function extractEmojis(text) {
  if (!text) {
    return [];
  }

  const emojiRegex =
    /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F]/gu;

  return String(text).match(
    emojiRegex
  ) || [];
}


// =====================================================
// MAIN COMPONENT
// =====================================================

function DatasetAnalysis() {
  const [dataset, setDataset] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [evaluationLoading, setEvaluationLoading] =
    useState(false);

  const [evaluationError, setEvaluationError] =
    useState("");

  const [evaluationResults, setEvaluationResults] =
    useState(null);


  // =====================================================
  // LOAD SAVED DATASET FROM INDEXEDDB
  // =====================================================

  useEffect(() => {
    const loadSavedDataset = async () => {
      try {
        const savedDataset =
          await getDataset();

        if (savedDataset) {
          setDataset(savedDataset);

          console.log(
            "CCI dataset loaded from IndexedDB:",
            savedDataset.name,
            savedDataset.rows?.length || 0,
            "rows"
          );
        }
      } catch (err) {
        console.error(
          "IndexedDB dataset loading error:",
          err
        );
      }
    };

    loadSavedDataset();
  }, []);


  // =====================================================
  // PROCESS DATA
  // =====================================================

  const analyzeData = (
    rows,
    columns,
    file
  ) => {
    if (!rows.length) {
      setError(
        "The uploaded file does not contain any records."
      );
      return;
    }

    const reviewColumn =
      findReviewColumn(
        rows,
        columns
      );

    const ratingColumn =
      findColumn(
        columns,
        [
          "rating",
          "ratings",
          "stars",
          "score",
        ]
      );

    const brandColumn =
      findColumn(
        columns,
        [
          "brand",
          "manufacturer",
        ]
      );

    const productColumn =
      findColumn(
        columns,
        [
          "product",
          "product_name",
          "productname",
          "model",
        ]
      );


    // =====================================================
    // MISSING VALUES
    // =====================================================

    const missingValues = {};

    columns.forEach(
      (column) => {
        missingValues[column] =
          rows.filter(
            (row) =>
              row[column] === undefined ||
              row[column] === null ||
              String(
                row[column]
              ).trim() === ""
          ).length;
      }
    );


    // =====================================================
    // DUPLICATES
    // =====================================================

    const rowStrings =
      rows.map(
        (row) =>
          JSON.stringify(row)
      );

    const uniqueRows =
      new Set(rowStrings);

    const duplicateCount =
      rows.length -
      uniqueRows.size;


    // =====================================================
    // RATING ANALYSIS
    // =====================================================

    let averageRating = 0;

    const ratingDistribution = {};

    if (
      ratingColumn &&
      ratingColumn !== "Not detected"
    ) {
      const ratings =
        rows
          .map(
            (row) =>
              Number(
                row[ratingColumn]
              )
          )
          .filter(
            (value) =>
              !Number.isNaN(value)
          );

      if (ratings.length) {
        averageRating =
          ratings.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / ratings.length;

        ratings.forEach(
          (rating) => {
            const key =
              String(rating);

            ratingDistribution[key] =
              (ratingDistribution[key] || 0) +
              1;
          }
        );
      }
    }


    // =====================================================
    // EMOJI ANALYSIS
    // =====================================================

    let emojiReviewCount = 0;

    let totalEmojiCount = 0;

    const emojiCounts = {};

    if (reviewColumn) {
      rows.forEach(
        (row) => {
          const text =
            String(
              row[reviewColumn] || ""
            );

          const emojis =
            extractEmojis(text);

          if (emojis.length > 0) {
            emojiReviewCount++;
          }

          totalEmojiCount +=
            emojis.length;

          emojis.forEach(
            (emoji) => {
              emojiCounts[emoji] =
                (emojiCounts[emoji] || 0) +
                1;
            }
          );
        }
      );
    }


    const topEmojis =
      Object.entries(
        emojiCounts
      )
        .sort(
          ([, a], [, b]) =>
            b - a
        )
        .slice(0, 10)
        .map(
          ([emoji, count]) => ({
            emoji,
            count,
          })
        );


    // =====================================================
    // REVIEW LENGTH
    // =====================================================

    let averageReviewLength = 0;

    if (reviewColumn) {
      const lengths =
        rows.map(
          (row) =>
            String(
              row[reviewColumn] || ""
            ).length
        );

      if (lengths.length) {
        averageReviewLength =
          Math.round(
            lengths.reduce(
              (sum, value) =>
                sum + value,
              0
            ) / lengths.length
          );
      }
    }


    // =====================================================
    // FINAL DATASET OBJECT
    // =====================================================

    const datasetResult = {
      name: file.name,

      size: (
        file.size / 1024
      ).toFixed(2),

      type:
        file.name
          .toLowerCase()
          .endsWith(".json")
          ? "JSON"
          : file.name
              .toLowerCase()
              .endsWith(".csv")
          ? "CSV"
          : "Excel",

      rows,

      columns,

      recordCount:
        rows.length,

      columnCount:
        columns.length,

      missingValues,

      duplicateCount,

      reviewColumn:
        reviewColumn ||
        "Not detected",

      ratingColumn:
        ratingColumn ||
        "Not detected",

      brandColumn:
        brandColumn ||
        "Not detected",

      productColumn:
        productColumn ||
        "Not detected",

      averageRating:
        Number(
          averageRating.toFixed(2)
        ),

      ratingDistribution,

      emojiReviewCount,

      totalEmojiCount,

      topEmojis,

      averageReviewLength,
    };


    // =====================================================
    // SAVE TO REACT STATE
    // =====================================================

    setDataset(
      datasetResult
    );


    // =====================================================
    // SAVE TO INDEXEDDB
    // =====================================================

    saveDataset(
      datasetResult
    )
      .then(() => {
        console.log(
          "CCI dataset saved successfully in IndexedDB."
        );
      })
      .catch((storageError) => {
        console.error(
          "IndexedDB save error:",
          storageError
        );

        setError(
          "Dataset could not be saved in browser storage."
        );
      });


    // Reset previous evaluation
    setEvaluationResults(null);
    setEvaluationError("");
  };


  // =====================================================
  // FILE UPLOAD
  // =====================================================

  const handleFileUpload = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setLoading(true);

    setError("");

    setDataset(null);

    setEvaluationResults(null);

    setEvaluationError("");

    const fileName =
      file.name.toLowerCase();


    // =====================================================
    // CSV
    // =====================================================

    if (
      fileName.endsWith(".csv")
    ) {
      Papa.parse(
        file,
        {
          header: true,
          skipEmptyLines: true,

          complete: (
            results
          ) => {
            try {
              const rows =
                results.data || [];

              const columns =
                results.meta?.fields ||
                (
                  rows.length
                    ? Object.keys(
                        rows[0]
                      )
                    : []
                );

              analyzeData(
                rows,
                columns,
                file
              );

            } catch (err) {
              console.error(err);

              setError(
                "Unable to analyze CSV file."
              );
            }

            setLoading(false);
          },

          error: () => {
            setError(
              "Unable to read CSV file."
            );

            setLoading(false);
          },
        }
      );

      return;
    }


    // =====================================================
    // EXCEL
    // =====================================================

    if (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls")
    ) {
      const reader =
        new FileReader();

      reader.onload = (
        event
      ) => {
        try {
          const data =
            new Uint8Array(
              event.target.result
            );

          const workbook =
            XLSX.read(
              data,
              {
                type: "array",
              }
            );

          const firstSheet =
            workbook.Sheets[
              workbook.SheetNames[0]
            ];

          const rows =
            XLSX.utils.sheet_to_json(
              firstSheet,
              {
                defval: "",
              }
            );

          const columns =
            rows.length
              ? Object.keys(
                  rows[0]
                )
              : [];

          analyzeData(
            rows,
            columns,
            file
          );

        } catch (err) {
          console.error(err);

          setError(
            "Unable to analyze Excel file."
          );
        }

        setLoading(false);
      };

      reader.onerror = () => {
        setError(
          "Unable to read Excel file."
        );

        setLoading(false);
      };

      reader.readAsArrayBuffer(
        file
      );

      return;
    }


    // =====================================================
    // JSON
    // =====================================================

    if (
      fileName.endsWith(".json")
    ) {
      const reader =
        new FileReader();

      reader.onload = (
        event
      ) => {
        try {
          const parsed =
            JSON.parse(
              event.target.result
            );

          let rows = [];

          if (
            Array.isArray(parsed)
          ) {
            rows = parsed;
          } else if (
            Array.isArray(parsed.data)
          ) {
            rows = parsed.data;
          } else if (
            Array.isArray(parsed.reviews)
          ) {
            rows = parsed.reviews;
          } else {
            throw new Error(
              "Unsupported JSON format"
            );
          }

          const columns =
            rows.length
              ? Object.keys(
                  rows[0]
                )
              : [];

          analyzeData(
            rows,
            columns,
            file
          );

        } catch (err) {
          console.error(err);

          setError(
            "Invalid or unsupported JSON file."
          );
        }

        setLoading(false);
      };

      reader.onerror = () => {
        setError(
          "Unable to read JSON file."
        );

        setLoading(false);
      };

      reader.readAsText(
        file
      );

      return;
    }


    // =====================================================
    // INVALID FILE
    // =====================================================

    setError(
      "Please upload CSV, XLS, XLSX or JSON file."
    );

    setLoading(false);
  };


  // =====================================================
  // NLP DATASET EVALUATION
  // =====================================================

  const handleEvaluateDataset =
    async () => {
      if (!dataset) {
        return;
      }

      setEvaluationLoading(true);

      setEvaluationError("");

      setEvaluationResults(null);

      try {
        const result =
          await evaluateUploadedDataset({
            rows: dataset.rows,

            columns:
              dataset.columns,

            reviewColumn:
              dataset.reviewColumn !==
              "Not detected"
                ? dataset.reviewColumn
                : null,

            ratingColumn:
              dataset.ratingColumn !==
              "Not detected"
                ? dataset.ratingColumn
                : null,

            labelColumn:
              null,

            brandColumn:
              dataset.brandColumn !==
              "Not detected"
                ? dataset.brandColumn
                : null,

            productColumn:
              dataset.productColumn !==
              "Not detected"
                ? dataset.productColumn
                : null,

            verifiedColumn:
              findColumn(
                dataset.columns,
                [
                  "verified_purchase",
                  "verified purchase",
                  "verified",
                  "is_verified",
                ]
              ),

            helpfulColumn:
              findColumn(
                dataset.columns,
                [
                  "helpful_votes",
                  "helpful votes",
                  "helpful_vote",
                  "helpful",
                  "votes",
                ]
              ),
          });

        setEvaluationResults(
          result.results
        );

        // Save small evaluation result
        // in LocalStorage
        try {
          localStorage.setItem(
            "cciDatasetEvaluation",
            JSON.stringify({
              datasetName:
                dataset.name,

              results:
                result.results,

              savedAt:
                new Date().toISOString(),
            })
          );
        } catch (storageError) {
          console.error(
            "Evaluation storage error:",
            storageError
          );
        }

      } catch (err) {
        console.error(
          "Dataset NLP Evaluation Error:",
          err
        );

        setEvaluationError(
          err.message ||
          "Unable to evaluate the uploaded dataset."
        );

      } finally {
        setEvaluationLoading(false);
      }
    };


  // =====================================================
  // CLEAR DATASET
  // =====================================================

  const clearDataset =
    async () => {
      const confirmed =
        window.confirm(
          "Are you sure you want to remove the uploaded dataset?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteDataset();

        localStorage.removeItem(
          "cciDatasetEvaluation"
        );

        setDataset(null);

        setEvaluationResults(null);

        setEvaluationError("");

        setError("");

        console.log(
          "CCI dataset removed from IndexedDB."
        );

      } catch (err) {
        console.error(
          "Unable to delete dataset:",
          err
        );

        setError(
          "Unable to clear the dataset."
        );
      }
    };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="dataset-page">

      {/* HEADER */}

      <div className="dataset-page-header">

        <div>

          <div className="page-eyebrow">
            CCI DATA ANALYSIS
          </div>

          <h1>
            Dataset Analysis
          </h1>

          <p>
            Upload your review dataset to
            inspect structure, ratings,
            emojis and review statistics.
          </p>

        </div>

      </div>


      {/* AMAZON REVIEWS DATASET INFORMATION */}

      <div
        className="dataset-card"
        style={{
          marginBottom: "24px",
        }}
      >
        <div className="dataset-card-header">
          <div>
            <h2>Amazon Reviews Dataset</h2>
            <p>
              Real-world product reviews that can be used by CCI
              for review intelligence and NLP research.
            </p>
          </div>

          <Database size={22} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          {[
            ["📝", "Review Text", "Analyze review content and length."],
            ["⭐", "Ratings", "Study rating distributions and patterns."],
            ["📱", "Products", "Compare product-level review data."],
            ["😊", "Emojis", "Detect and analyze emoji usage."],
            ["✅", "Verified Purchase", "Analyze verified purchase information."],
            ["👍", "Helpful Votes", "Study helpfulness-related review data."],
            ["🧠", "Sentiment", "Support sentiment and NLP analysis."],
            ["📊", "Model Evaluation", "Evaluate CCI NLP model performance."],
          ].map(([icon, title, description]) => (
            <div
              key={title}
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid var(--border-color, #e5e7eb)",
                background:
                  "var(--card-secondary-bg, rgba(127, 127, 127, 0.04))",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  marginBottom: "7px",
                }}
              >
                {icon}
              </div>

              <strong
                style={{
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                {title}
              </strong>

              <span
                style={{
                  display: "block",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  opacity: 0.75,
                }}
              >
                {description}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "12px 14px",
            borderRadius: "10px",
            background:
              "var(--notice-bg, rgba(59, 130, 246, 0.08))",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          <strong>Research use:</strong> The dataset can provide
          information for rating analysis, product/review patterns,
          emoji insights and comparative evaluation of Text Only,
          Text + Emoji and Text + Emoji + Context models.
        </div>
      </div>


      {/* AMAZON DATASET PREVIEW */}

      <div
        className="dataset-card"
        style={{
          marginBottom: "24px",
        }}
      >
        <div className="dataset-card-header">
          <div>
            <h2>Amazon Dataset Preview</h2>
            <p>
              Preview of the real Amazon Electronics review dataset
              structure used for CCI analysis and NLP evaluation.
            </p>
          </div>

          <FileSpreadsheet size={22} />
        </div>

        <div
          className="dataset-table-wrapper"
          style={{ marginTop: "18px" }}
        >
          <table className="dataset-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Information</th>
              </tr>
            </thead>

            <tbody>
              {[
                ["review_id", "Unique review identifier"],
                ["rating", "Product rating from 1 to 5"],
                ["review_title", "Title of the customer review"],
                ["review_text", "Full customer review text"],
                ["product_id", "Product identifier"],
                ["verified_purchase", "Whether the purchase was verified"],
                ["helpful_vote", "Number of helpful votes"],
              ].map(([column, information]) => (
                <tr key={column}>
                  <td>
                    <strong>{column}</strong>
                  </td>
                  <td>{information}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <div className="dataset-stat-card">
            <Database size={20} />
            <div>
              <span>Real Records</span>
              <strong>4,998</strong>
            </div>
          </div>

          <div className="dataset-stat-card">
            <Columns3 size={20} />
            <div>
              <span>Columns</span>
              <strong>7</strong>
            </div>
          </div>

          <div className="dataset-stat-card">
            <Star size={20} />
            <div>
              <span>Rating Field</span>
              <strong>1–5</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "12px 14px",
            borderRadius: "10px",
            background:
              "var(--notice-bg, rgba(59, 130, 246, 0.08))",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          <strong>How CCI uses this data:</strong> Review text,
          ratings, verified purchases and helpful votes can support
          dataset analysis, emoji analysis and real NLP model
          evaluation.
        </div>
      </div>


      {/* UPLOAD CARD */}

      <div className="dataset-upload-card">

        <div className="dataset-upload-icon">
          <Upload size={28} />
        </div>

        <h2>
          Upload Review Dataset
        </h2>

        <p>
          Supported formats: CSV, Excel
          and JSON
        </p>

        <label className="dataset-upload-button">

          <Upload size={18} />

          {loading
            ? "Analyzing..."
            : "Choose Dataset"}

          <input
            type="file"
            accept=".csv,.xls,.xlsx,.json"
            onChange={
              handleFileUpload
            }
            hidden
          />

        </label>

        <div className="dataset-upload-note">

          <FileSpreadsheet
            size={16}
          />

          Real dataset statistics only.
          NLP evaluation requires a
          rating or sentiment/label
          column.

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div className="dataset-error">

          <AlertCircle size={20} />

          <span>
            {error}
          </span>

        </div>
      )}


      {/* DATASET RESULTS */}

      {dataset && (
        <div className="dataset-results">

          {/* FILE INFORMATION */}

          <div className="dataset-file-card">

            <div className="dataset-file-left">

              <div className="dataset-file-icon">

                <FileSpreadsheet
                  size={24}
                />

              </div>

              <div>

                <h3>
                  {dataset.name}
                </h3>

                <p>
                  {dataset.type} •{" "}
                  {dataset.size} KB
                </p>

              </div>

            </div>

            <button
              className="dataset-clear-button"
              onClick={
                clearDataset
              }
            >

              <Trash2 size={17} />

              Clear Dataset

            </button>

          </div>


          {/* STAT CARDS */}

          <div className="dataset-stat-grid">

            <div className="dataset-stat-card">

              <Database size={22} />

              <div>

                <span>
                  Records
                </span>

                <strong>
                  {dataset.recordCount}
                </strong>

              </div>

            </div>


            <div className="dataset-stat-card">

              <Columns3 size={22} />

              <div>

                <span>
                  Columns
                </span>

                <strong>
                  {dataset.columnCount}
                </strong>

              </div>

            </div>


            <div className="dataset-stat-card">

              <Copy size={22} />

              <div>

                <span>
                  Duplicates
                </span>

                <strong>
                  {dataset.duplicateCount}
                </strong>

              </div>

            </div>


            <div className="dataset-stat-card">

              <FileText size={22} />

              <div>

                <span>
                  Avg Review Length
                </span>

                <strong>
                  {dataset.averageReviewLength}
                </strong>

              </div>

            </div>

          </div>


          {/* DETECTED COLUMNS */}

          <div className="dataset-card">

            <div className="dataset-card-header">

              <div>

                <h2>
                  Detected Columns
                </h2>

                <p>
                  Important fields detected
                  automatically from your dataset.
                </p>

              </div>

              <Columns3 size={22} />

            </div>


            <div className="detected-columns-grid">

              <div>

                <span>
                  Review Column
                </span>

                <strong>
                  {dataset.reviewColumn}
                </strong>

              </div>

              <div>

                <span>
                  Rating Column
                </span>

                <strong>
                  {dataset.ratingColumn}
                </strong>

              </div>

              <div>

                <span>
                  Brand Column
                </span>

                <strong>
                  {dataset.brandColumn}
                </strong>

              </div>

              <div>

                <span>
                  Product Column
                </span>

                <strong>
                  {dataset.productColumn}
                </strong>

              </div>

            </div>

          </div>


          {/* NLP EVALUATION */}

          <div className="dataset-card">

            <div className="dataset-card-header">

              <div>

                <h2>
                  NLP Model Evaluation
                </h2>

                <p>
                  Run the three CCI NLP models
                  on your uploaded dataset.
                </p>

              </div>

              <Brain size={22} />

            </div>


            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >

              <div>

                <strong>
                  Ground Truth Required
                </strong>

                <p
                  style={{
                    marginTop: "6px",
                  }}
                >
                  Ratings 1–2 are treated as
                  negative, 4–5 as positive,
                  and 3-star reviews are excluded
                  from Precision, Recall and F1.
                </p>

              </div>


              <button
                type="button"
                className="dataset-upload-button"
                onClick={
                  handleEvaluateDataset
                }
                disabled={
                  evaluationLoading
                }
              >

                {evaluationLoading ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="spin"
                    />

                    Evaluating...
                  </>
                ) : (
                  <>
                    <Play size={18} />

                    Evaluate NLP Models
                  </>
                )}

              </button>

            </div>


            {evaluationError && (
              <div
                className="dataset-error"
                style={{
                  marginTop: "18px",
                }}
              >

                <AlertCircle size={20} />

                <span>
                  {evaluationError}
                </span>

              </div>
            )}

          </div>


          {/* NLP RESULTS */}

          {evaluationResults && (

            <div className="dataset-card">

              <div className="dataset-card-header">

                <div>

                  <h2>
                    Real NLP Evaluation Results
                  </h2>

                  <p>
                    Metrics calculated from your
                    uploaded dataset.
                  </p>

                </div>

                <CheckCircle2 size={22} />

              </div>


              {/* DATASET INFORMATION */}

              <div className="dataset-stat-grid">

                <div className="dataset-stat-card">

                  <Database size={22} />

                  <div>

                    <span>
                      Uploaded Rows
                    </span>

                    <strong>
                      {evaluationResults
                        .dataset
                        ?.total_uploaded_rows ?? 0}
                    </strong>

                  </div>

                </div>


                <div className="dataset-stat-card">

                  <Target size={22} />

                  <div>

                    <span>
                      Evaluation Reviews
                    </span>

                    <strong>
                      {evaluationResults
                        .dataset
                        ?.evaluation_reviews ?? 0}
                    </strong>

                  </div>

                </div>


                <div className="dataset-stat-card">

                  <Smile size={22} />

                  <div>

                    <span>
                      Reviews With Emoji
                    </span>

                    <strong>
                      {evaluationResults
                        .emoji_statistics
                        ?.reviews_with_emojis ?? 0}
                    </strong>

                  </div>

                </div>


                <div className="dataset-stat-card">

                  <Smile size={22} />

                  <div>

                    <span>
                      Total Emojis
                    </span>

                    <strong>
                      {evaluationResults
                        .emoji_statistics
                        ?.total_detected_emojis ?? 0}
                    </strong>

                  </div>

                </div>

              </div>


              {/* MODEL RESULTS */}

              <div className="dataset-two-column">

                {[
                  [
                    "model_1",
                    "Model 1 — Text Only",
                  ],
                  [
                    "model_2",
                    "Model 2 — Text + Emoji",
                  ],
                  [
                    "model_3",
                    "Model 3 — Text + Emoji + Context",
                  ],
                ].map(
                  ([modelKey, modelName]) => {

                    const model =
                      evaluationResults
                        .models?.[
                          modelKey
                        ];

                    if (!model) {
                      return null;
                    }

                    return (
                      <div
                        className="dataset-card"
                        key={modelKey}
                      >

                        <div className="dataset-card-header">

                          <div>

                            <h2>
                              {modelName}
                            </h2>

                            <p>
                              {
                                model.total_reviews
                              }{" "}
                              evaluation reviews
                            </p>

                          </div>

                          <BarChart3 size={22} />

                        </div>


                        <div className="dataset-stat-grid">

                          <div className="dataset-stat-card">

                            <Target size={20} />

                            <div>

                              <span>
                                Accuracy
                              </span>

                              <strong>
                                {model.accuracy}%
                              </strong>

                            </div>

                          </div>


                          <div className="dataset-stat-card">

                            <Target size={20} />

                            <div>

                              <span>
                                Precision
                              </span>

                              <strong>
                                {model.precision}%
                              </strong>

                            </div>

                          </div>


                          <div className="dataset-stat-card">

                            <Target size={20} />

                            <div>

                              <span>
                                Recall
                              </span>

                              <strong>
                                {model.recall}%
                              </strong>

                            </div>

                          </div>


                          <div className="dataset-stat-card">

                            <Target size={20} />

                            <div>

                              <span>
                                F1 Score
                              </span>

                              <strong>
                                {model.f1_score}%
                              </strong>

                            </div>

                          </div>

                        </div>


                        {/* CONFUSION MATRIX */}

                        <div
                          style={{
                            marginTop: "20px",
                          }}
                        >

                          <h3>
                            Confusion Matrix
                          </h3>


                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(2, minmax(0, 1fr))",
                              gap: "10px",
                              marginTop: "12px",
                            }}
                          >

                            <div className="dataset-stat-card">

                              <div>

                                <span>
                                  True Negative
                                </span>

                                <strong>
                                  {
                                    model
                                      .confusion_matrix
                                      ?.true_negative ??
                                    0
                                  }
                                </strong>

                              </div>

                            </div>


                            <div className="dataset-stat-card">

                              <div>

                                <span>
                                  False Positive
                                </span>

                                <strong>
                                  {
                                    model
                                      .confusion_matrix
                                      ?.false_positive ??
                                    0
                                  }
                                </strong>

                              </div>

                            </div>


                            <div className="dataset-stat-card">

                              <div>

                                <span>
                                  False Negative
                                </span>

                                <strong>
                                  {
                                    model
                                      .confusion_matrix
                                      ?.false_negative ??
                                    0
                                  }
                                </strong>

                              </div>

                            </div>


                            <div className="dataset-stat-card">

                              <div>

                                <span>
                                  True Positive
                                </span>

                                <strong>
                                  {
                                    model
                                      .confusion_matrix
                                      ?.true_positive ??
                                    0
                                  }
                                </strong>

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>


              {/* EVALUATION NOTICE */}

              <div className="dataset-nlp-notice">

                <CheckCircle2
                  size={22}
                />

                <div>

                  <h3>
                    NLP evaluation completed
                  </h3>

                  <p>
                    Precision, Recall and F1
                    were calculated against the
                    dataset ground truth. For
                    rating-based evaluation,
                    1–2 stars are negative,
                    4–5 stars are positive,
                    and 3-star reviews are excluded.
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* RATING + EMOJI */}

          <div className="dataset-two-column">


            {/* RATING */}

            <div className="dataset-card">

              <div className="dataset-card-header">

                <div>

                  <h2>
                    Rating Insights
                  </h2>

                  <p>
                    Basic rating statistics
                    from the dataset.
                  </p>

                </div>

                <Star size={22} />

              </div>


              <div className="dataset-insight-main">

                <strong>
                  {dataset.averageRating}
                </strong>

                <span>
                  Average Rating
                </span>

              </div>


              <div className="rating-distribution-list">

                {Object.entries(
                  dataset.ratingDistribution
                )
                  .sort(
                    ([a], [b]) =>
                      Number(a) -
                      Number(b)
                  )
                  .map(
                    ([rating, count]) => (

                      <div
                        className="rating-row"
                        key={rating}
                      >

                        <span>
                          {rating} Star
                        </span>

                        <strong>
                          {count}
                        </strong>

                      </div>

                    )
                  )}

              </div>

            </div>


            {/* EMOJI */}

            <div className="dataset-card">

              <div className="dataset-card-header">

                <div>

                  <h2>
                    Emoji Insights
                  </h2>

                  <p>
                    Emoji usage detected
                    in review text.
                  </p>

                </div>

                <Smile size={22} />

              </div>


              <div className="emoji-stat-grid">

                <div>

                  <strong>
                    {dataset.emojiReviewCount}
                  </strong>

                  <span>
                    Reviews With Emoji
                  </span>

                </div>


                <div>

                  <strong>
                    {dataset.totalEmojiCount}
                  </strong>

                  <span>
                    Total Emojis
                  </span>

                </div>

              </div>


              <div className="top-emoji-list">

                {dataset.topEmojis.length > 0 ? (

                  dataset.topEmojis.map(
                    (item) => (

                      <div
                        className="top-emoji-item"
                        key={item.emoji}
                      >

                        <span>
                          {item.emoji}
                        </span>

                        <strong>
                          {item.count}
                        </strong>

                      </div>

                    )
                  )

                ) : (

                  <div className="chart-empty">
                    No emojis detected.
                  </div>

                )}

              </div>

            </div>

          </div>


          {/* DATASET PREVIEW */}

          <div className="dataset-card">

            <div className="dataset-card-header">

              <div>

                <h2>
                  Dataset Preview
                </h2>

                <p>
                  First 10 records from
                  your uploaded dataset.
                </p>

              </div>

              <Database size={22} />

            </div>


            <div className="dataset-table-wrapper">

              <table className="dataset-table">

                <thead>

                  <tr>

                    {dataset.columns.map(
                      (column) => (
                        <th key={column}>
                          {column}
                        </th>
                      )
                    )}

                  </tr>

                </thead>


                <tbody>

                  {dataset.rows
                    .slice(0, 10)
                    .map(
                      (
                        row,
                        index
                      ) => (

                        <tr
                          key={index}
                        >

                          {dataset.columns.map(
                            (
                              column
                            ) => (

                              <td
                                key={column}
                              >

                                {String(
                                  row[column] ??
                                  ""
                                ).slice(
                                  0,
                                  100
                                )}

                              </td>

                            )
                          )}

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            </div>

          </div>


          {/* FINAL NOTICE */}

          <div className="dataset-nlp-notice">

            <CheckCircle2
              size={22}
            />

            <div>

              <h3>
                Dataset analysis completed
              </h3>

              <p>
                Structural statistics,
                ratings, review length and
                emoji usage are available.
                Use the NLP Model Evaluation
                section above to calculate
                real Accuracy, Precision,
                Recall and F1 Score.
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


export default DatasetAnalysis;