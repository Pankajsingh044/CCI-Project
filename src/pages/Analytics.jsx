import { useEffect, useMemo, useState } from "react";

const ANALYTICS_API_URL = "http://127.0.0.1:8000/api/analytics";

import {
  BarChart3,
  Database,
  FileText,
  MessageSquare,
  Smile,
  Star,
  Sun,
  Moon,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";

import {
  evaluateUploadedDataset
} from "../services/nlpService";

import {
  getDataset
} from "../services/datasetStorage";

// =====================================================
// HELPERS
// =====================================================

function findColumn(columns, patterns) {
  if (!Array.isArray(columns)) return null;

  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: String(column)
      .toLowerCase()
      .replace(/[\s_-]+/g, "")
  }));

  for (const pattern of patterns) {
    const normalizedPattern = pattern
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

    const match = normalizedColumns.find((column) =>
      column.normalized.includes(normalizedPattern)
    );

    if (match) {
      return match.original;
    }
  }

  return null;
}

function findNestedValue(object, possibleKeys) {
  if (!object || typeof object !== "object") {
    return undefined;
  }

  for (const key of possibleKeys) {
    if (
      object[key] !== undefined &&
      object[key] !== null
    ) {
      return object[key];
    }
  }

  for (const value of Object.values(object)) {
    if (value && typeof value === "object") {
      const result = findNestedValue(
        value,
        possibleKeys
      );

      if (
        result !== undefined &&
        result !== null
      ) {
        return result;
      }
    }
  }

  return undefined;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

function Analytics() {
  const [dataset, setDataset] = useState(null);

  const [datasetLoaded, setDatasetLoaded] =
    useState(false);

  const [loadingDataset, setLoadingDataset] =
    useState(true);

  const [evaluationResults, setEvaluationResults] =
    useState(null);

  const [evaluationLoading, setEvaluationLoading] =
    useState(false);

  const [evaluationError, setEvaluationError] =
    useState("");

  const [lightTheme, setLightTheme] =
    useState(false);


  const [liveAnalytics, setLiveAnalytics] = useState(null);

  const [liveAnalyticsLoading, setLiveAnalyticsLoading] =
    useState(true);

  const [liveAnalyticsError, setLiveAnalyticsError] =
    useState("");

  // ===================================================
  // LOAD LIVE MONGODB ANALYTICS
  // ===================================================

  const loadLiveAnalytics = async () => {
    try {
      setLiveAnalyticsLoading(true);
      setLiveAnalyticsError("");

      const currentUser = JSON.parse(
        localStorage.getItem("cciCurrentUser") || "null"
      );

      const userEmail = String(
        currentUser?.email || ""
      ).trim().toLowerCase();

      if (!userEmail) {
        setLiveAnalytics(null);
        setLiveAnalyticsError(
          "Please login to view live MongoDB analytics."
        );
        return;
      }

      const response = await fetch(
        `${ANALYTICS_API_URL}?userEmail=${encodeURIComponent(userEmail)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          "Failed to load live analytics."
        );
      }

      setLiveAnalytics(
        data?.analytics || data
      );
    } catch (error) {
      console.error(
        "Live MongoDB analytics loading error:",
        error
      );

      setLiveAnalytics(null);
      setLiveAnalyticsError(
        error?.message ||
        "Unable to load live MongoDB analytics."
      );
    } finally {
      setLiveAnalyticsLoading(false);
    }
  };

  // ===================================================
  // LOAD DATASET
  // ===================================================

  const loadDataset = async () => {
    try {
      setLoadingDataset(true);

      const storedDataset =
        await getDataset();

      if (storedDataset) {
        setDataset(storedDataset);
        setDatasetLoaded(true);
      } else {
        setDataset(null);
        setDatasetLoaded(false);
      }
    } catch (error) {
      console.error(
        "Analytics dataset loading error:",
        error
      );

      setDataset(null);
      setDatasetLoaded(false);
    } finally {
      setLoadingDataset(false);
    }
  };

  // ===================================================
  // LOAD SAVED EVALUATION
  // ===================================================

  const loadSavedEvaluation = () => {
    try {
      const savedEvaluation =
        localStorage.getItem(
          "cciDatasetEvaluation"
        );

      if (savedEvaluation) {
        setEvaluationResults(
          JSON.parse(savedEvaluation)
        );
      }
    } catch (error) {
      console.error(
        "Evaluation loading error:",
        error
      );
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadDataset();
    loadSavedEvaluation();
    loadLiveAnalytics();
  }, []);

  // ===================================================
  // DETECT COLUMNS
  // ===================================================

  const reviewColumn = useMemo(() => {
    return findColumn(
      dataset?.columns || [],
      [
        "reviewtext",
        "review_text",
        "review",
        "text",
        "content",
        "comment"
      ]
    );
  }, [dataset]);

  const ratingColumn = useMemo(() => {
    return findColumn(
      dataset?.columns || [],
      [
        "rating",
        "stars",
        "score",
        "reviewrating"
      ]
    );
  }, [dataset]);

  const brandColumn = useMemo(() => {
    return findColumn(
      dataset?.columns || [],
      [
        "brand",
        "manufacturer"
      ]
    );
  }, [dataset]);

  const productColumn = useMemo(() => {
    return findColumn(
      dataset?.columns || [],
      [
        "product",
        "productname",
        "producttitle",
        "model"
      ]
    );
  }, [dataset]);

  const verifiedColumn = useMemo(() => {
    return findColumn(
      dataset?.columns || [],
      [
        "verifiedpurchase",
        "verified",
        "purchaseverified"
      ]
    );
  }, [dataset]);

  const helpfulColumn = useMemo(() => {
    return findColumn(
      dataset?.columns || [],
      [
        "helpfulvote",
        "helpfulvotes",
        "helpful"
      ]
    );
  }, [dataset]);

  const labelColumn = useMemo(() => {
    return findColumn(
      dataset?.columns || [],
      [
        "sentiment",
        "label",
        "target",
        "class"
      ]
    );
  }, [dataset]);

  // ===================================================
  // DATA
  // ===================================================

  const rows =
    Array.isArray(dataset?.rows)
      ? dataset.rows
      : [];

  // ===================================================
  // RATING CHART
  // ===================================================

  const ratingChartData = useMemo(() => {
    if (
      liveAnalytics?.ratingDistribution &&
      typeof liveAnalytics.ratingDistribution === "object"
    ) {
      return Object.entries(
        liveAnalytics.ratingDistribution
      )
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([rating, count]) => ({
          rating: `${rating} ★`,
          count: Number(count) || 0
        }));
    }

    if (!dataset) return [];

    if (
      dataset.ratingDistribution &&
      typeof dataset.ratingDistribution === "object"
    ) {
      return Object.entries(
        dataset.ratingDistribution
      ).map(([rating, count]) => ({
        rating: `${rating} ★`,
        count: Number(count) || 0
      }));
    }

    if (!ratingColumn) return [];

    const counts = {};

    rows.forEach((row) => {
      const rating = Number(row?.[ratingColumn]);

      if (!Number.isNaN(rating)) {
        counts[rating] =
          (counts[rating] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort(
        ([a], [b]) => Number(a) - Number(b)
      )
      .map(([rating, count]) => ({
        rating: `${rating} ★`,
        count
      }));
  }, [
    liveAnalytics,
    dataset,
    ratingColumn,
    rows
  ]);

  // ===================================================
  // EMOJI CHART
  // ===================================================

  const emojiChartData = useMemo(() => {
    if (
      liveAnalytics?.topEmojis &&
      Array.isArray(liveAnalytics.topEmojis)
    ) {
      return liveAnalytics.topEmojis.map((item) => ({
        emoji: String(
          item?.emoji || item?.name || ""
        ),
        count: Number(
          item?.count ??
          item?.frequency ??
          item?.value ??
          0
        ) || 0
      }));
    }

    if (
      dataset?.topEmojis &&
      Array.isArray(dataset.topEmojis)
    ) {
      return dataset.topEmojis.map((item) => {
        if (
          typeof item === "object" &&
          item !== null
        ) {
          return {
            emoji:
              item.emoji ||
              item.name ||
              "",
            count:
              Number(
                item.count ||
                item.frequency ||
                item.value
              ) || 0
          };
        }

        return {
          emoji: String(item),
          count: 0
        };
      });
    }

    return [];
  }, [liveAnalytics, dataset]);

  // ===================================================
  // SENTIMENT DISTRIBUTION
  // ===================================================

  const sentimentDistribution = useMemo(() => {
    const source =
      liveAnalytics?.sentimentDistribution || {};

    return Object.entries(source)
      .map(([sentiment, count]) => ({
        sentiment,
        count: Number(count) || 0
      }))
      .filter((item) => item.count > 0);
  }, [liveAnalytics]);

  // ===================================================
  // BRAND DISTRIBUTION
  // ===================================================

  const brandDistribution = useMemo(() => {
    if (
      liveAnalytics?.brandDistribution &&
      Array.isArray(liveAnalytics.brandDistribution)
    ) {
      return liveAnalytics.brandDistribution.map(
        (item) => ({
          brand: String(item?.brand || ""),
          count: Number(item?.count) || 0
        })
      );
    }

    if (!brandColumn) return [];

    const counts = {};

    rows.forEach((row) => {
      const brand = String(
        row?.[brandColumn] ?? ""
      ).trim();

      if (brand) {
        counts[brand] =
          (counts[brand] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand, count]) => ({
        brand,
        count
      }));
  }, [
    liveAnalytics,
    rows,
    brandColumn
  ]);

  // ===================================================
  // PRODUCT DISTRIBUTION
  // ===================================================

  const productDistribution = useMemo(() => {
    if (
      liveAnalytics?.productDistribution &&
      Array.isArray(liveAnalytics.productDistribution)
    ) {
      return liveAnalytics.productDistribution.map(
        (item) => ({
          product: String(item?.product || ""),
          count: Number(item?.count) || 0
        })
      );
    }

    if (!productColumn) return [];

    const counts = {};

    rows.forEach((row) => {
      const product = String(
        row?.[productColumn] ?? ""
      ).trim();

      if (product) {
        counts[product] =
          (counts[product] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([product, count]) => ({
        product,
        count
      }));
  }, [
    liveAnalytics,
    rows,
    productColumn
  ]);

  // ===================================================
  // MODEL CHART
  // ===================================================

  const modelChartData = useMemo(() => {
    if (!evaluationResults) return [];

    const models =
      evaluationResults.models ||
      evaluationResults.results ||
      evaluationResults;

    const model1 =
      models?.model_1 ||
      models?.model1;

    const model2 =
      models?.model_2 ||
      models?.model2;

    const model3 =
      models?.model_3 ||
      models?.model3;

    const getAccuracy = (model) => {
      if (!model) return 0;

      const value =
        model?.accuracy ??
        model?.accuracy_score ??
        model?.metrics?.accuracy ??
        model?.metrics?.accuracy_score ??
        0;

      const numeric =
        Number(value);

      if (Number.isNaN(numeric)) {
        return 0;
      }

      return numeric <= 1
        ? numeric * 100
        : numeric;
    };

    return [
      {
        model: "Model 1",
        accuracy: getAccuracy(model1)
      },
      {
        model: "Model 2",
        accuracy: getAccuracy(model2)
      },
      {
        model: "Model 3",
        accuracy: getAccuracy(model3)
      }
    ];
  }, [evaluationResults]);

  // ===================================================
  // KPI VALUES
  // ===================================================

  const totalReviews = Number(
    liveAnalytics?.totalReviews ??
    dataset?.totalRows ??
    dataset?.rowCount ??
    rows.length
  ) || 0;

  const averageRating = Number(
    liveAnalytics?.averageRating ??
    dataset?.averageRating ??
    0
  ) || 0;

  const emojiReviews = Number(
    liveAnalytics?.emojiReviewCount ??
    dataset?.emojiReviewCount ??
    0
  ) || 0;

  const totalEmojis = Number(
    liveAnalytics?.totalEmojiCount ??
    dataset?.totalEmojiCount ??
    0
  ) || 0;

  const duplicateCount = Number(
    liveAnalytics?.duplicateCount ??
    dataset?.duplicateCount ??
    0
  ) || 0;

  const missingValues = Number(
    liveAnalytics?.missingValues ??
    dataset?.missingValues ??
    0
  ) || 0;

  const averageReviewLength = Number(
    liveAnalytics?.averageReviewLength ??
    dataset?.averageReviewLength ??
    0
  ) || 0;

  // ===================================================
  // EVALUATE DATASET
  // ===================================================

  const handleEvaluateDataset = async () => {
    if (!dataset || rows.length === 0) {
      setEvaluationError(
        "Please upload a dataset first."
      );
      return;
    }

    if (!reviewColumn) {
      setEvaluationError(
        "Review text column could not be detected."
      );
      return;
    }

    try {
      setEvaluationLoading(true);
      setEvaluationError("");

      const response =
        await evaluateUploadedDataset({
          rows,
          columns:
            dataset.columns || [],
          reviewColumn,
          ratingColumn,
          labelColumn,
          brandColumn,
          productColumn,
          verifiedColumn,
          helpfulColumn
        });

      const result =
        response?.results || response;

      setEvaluationResults(result);

      localStorage.setItem(
        "cciDatasetEvaluation",
        JSON.stringify(result)
      );
    } catch (error) {
      console.error(
        "Dataset evaluation error:",
        error
      );

      setEvaluationError(
        error?.message ||
        "Dataset NLP evaluation failed."
      );
    } finally {
      setEvaluationLoading(false);
    }
  };

  // ===================================================
  // MODEL HELPERS
  // ===================================================

  const getModel = (key) => {
    if (!evaluationResults) return null;

    return (
      evaluationResults?.models?.[key] ||
      evaluationResults?.results?.[key] ||
      evaluationResults?.[key] ||
      null
    );
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    await Promise.all([
      loadDataset(),
      loadLiveAnalytics()
    ]);

    loadSavedEvaluation();
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className={
        lightTheme
          ? "analytics-page analytics-light"
          : "analytics-page analytics-dark"
      }
    >

      {/* HEADER */}

      <div className="analytics-header">

        <div className="analytics-header-left">

          <div className="analytics-title-icon">
            <BarChart3 size={25} />
          </div>

          <div>

            <h1 className="analytics-main-title">
              Analytics Dashboard
            </h1>

            <p className="analytics-subtitle">
              Dataset insights, review patterns and NLP
              model evaluation
            </p>

          </div>

        </div>

        <div className="analytics-header-actions">

          <button
            className="analytics-action-button"
            onClick={handleRefresh}
            title="Refresh analytics"
          >
            <RefreshCw size={17} />
            <span>Refresh</span>
          </button>

          <button
            className="analytics-theme-button"
            onClick={() =>
              setLightTheme(
                (previous) => !previous
              )
            }
            title={
              lightTheme
                ? "Switch to dark theme"
                : "Switch to light theme"
            }
          >
            {lightTheme ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}

            <span>
              {lightTheme
                ? "Dark"
                : "Light"}
            </span>
          </button>

        </div>

      </div>

      {/* LIVE MONGODB STATUS */}

      <div className={
        `analytics-status-card ${
          liveAnalyticsError
            ? "warning"
            : liveAnalyticsLoading
            ? ""
            : "success"
        }`
      }>

        {liveAnalyticsLoading ? (
          <RefreshCw
            size={20}
            className="analytics-spin"
          />
        ) : liveAnalyticsError ? (
          <AlertCircle size={20} />
        ) : (
          <CheckCircle2 size={20} />
        )}

        <div>
          <strong>
            {liveAnalyticsLoading
              ? "Loading live MongoDB analytics..."
              : liveAnalyticsError
              ? "Live MongoDB analytics unavailable"
              : "Live MongoDB analytics connected"}
          </strong>

          <p>
            {liveAnalyticsLoading
              ? "Reading analyzed reviews from MongoDB."
              : liveAnalyticsError
              ? liveAnalyticsError
              : `${totalReviews.toLocaleString()} analyzed review records are available for this account.`}
          </p>
        </div>

      </div>

      {/* DATASET STATUS */}

      {loadingDataset ? (
        <div className="analytics-status-card">

          <RefreshCw
            size={20}
            className="analytics-spin"
          />

          <div>
            <strong>
              Loading dataset...
            </strong>

            <p>
              Reading the current dataset from
              browser storage.
            </p>
          </div>

        </div>
      ) : datasetLoaded ? (
        <div className="analytics-status-card success">

          <CheckCircle2 size={20} />

          <div>
            <strong>
              Dataset loaded successfully
            </strong>

            <p>
              {totalReviews.toLocaleString()} review
              records are available for analytics.
            </p>
          </div>

        </div>
      ) : (
        <div className="analytics-status-card warning">

          <AlertCircle size={20} />

          <div>
            <strong>
              No dataset available
            </strong>

            <p>
              Upload a dataset from Dataset Analysis
              to view analytics.
            </p>
          </div>

        </div>
      )}

      {/* KPI CARDS */}

      <section className="analytics-kpi-grid">

        <StatCard
          icon={<Database size={21} />}
          title="Total Reviews"
          value={totalReviews.toLocaleString()}
          color="blue"
        />

        <StatCard
          icon={<Star size={21} />}
          title="Average Rating"
          value={
            averageRating
              ? `${averageRating.toFixed(2)} / 5`
              : "—"
          }
          color="yellow"
        />

        <StatCard
          icon={<Smile size={21} />}
          title="Emoji Reviews"
          value={emojiReviews.toLocaleString()}
          color="pink"
        />

        <StatCard
          icon={<MessageSquare size={21} />}
          title="Total Emojis"
          value={totalEmojis.toLocaleString()}
          color="purple"
        />

      </section>

      {/* DATASET QUALITY */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <h2>
              Dataset Quality
            </h2>

            <p>
              Basic quality indicators from the uploaded
              dataset
            </p>

          </div>

        </div>

        <div className="quality-grid">

          <SummaryItem
            label="Rows"
            value={totalReviews.toLocaleString()}
          />

          <SummaryItem
            label="Columns"
            value={
              dataset?.columns?.length ||
              0
            }
          />

          <SummaryItem
            label="Missing Values"
            value={missingValues.toLocaleString()}
          />

          <SummaryItem
            label="Duplicates"
            value={duplicateCount.toLocaleString()}
          />

          <SummaryItem
            label="Avg Review Length"
            value={`${Math.round(
              averageReviewLength
            )} characters`}
          />

          <SummaryItem
            label="Emoji Reviews"
            value={emojiReviews.toLocaleString()}
          />

        </div>

      </section>

      {/* CHART GRID */}

      <section className="analytics-chart-grid">

        {/* RATING */}

        <div className="analytics-chart-card">

          <ChartHeader
            icon={<Star size={19} />}
            title="Rating Distribution"
            subtitle="Distribution of review ratings"
          />

          {ratingChartData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={310}
            >
              <BarChart
                data={ratingChartData}
                margin={{
                  top: 15,
                  right: 10,
                  left: 0,
                  bottom: 5
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.15}
                />

                <XAxis
                  dataKey="rating"
                  tick={{
                    fontSize: 12
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                >

                  {ratingChartData.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill="#3b82f6"
                      />
                    )
                  )}

                </Bar>

              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              text="No rating data available"
            />
          )}

        </div>

        {/* EMOJI */}

        <div className="analytics-chart-card">

          <ChartHeader
            icon={<Smile size={19} />}
            title="Emoji Usage"
            subtitle="Most frequently detected emojis"
          />

          {emojiChartData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={310}
            >
              <BarChart
                data={emojiChartData.slice(0, 10)}
                margin={{
                  top: 15,
                  right: 10,
                  left: 0,
                  bottom: 5
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.15}
                />

                <XAxis
                  dataKey="emoji"
                  tick={{
                    fontSize: 20
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                >

                  {emojiChartData
                    .slice(0, 10)
                    .map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill="#ec4899"
                        />
                      )
                    )}

                </Bar>

              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              text="No emoji data available"
            />
          )}

        </div>

        {/* SENTIMENT */}

        <div className="analytics-chart-card">

          <ChartHeader
            icon={<MessageSquare size={19} />}
            title="Sentiment Distribution"
            subtitle="Sentiment detected from saved NLP results"
          />

          {sentimentDistribution.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={310}
            >
              <BarChart
                data={sentimentDistribution}
                margin={{
                  top: 15,
                  right: 10,
                  left: 0,
                  bottom: 5
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.15}
                />

                <XAxis
                  dataKey="sentiment"
                  tick={{
                    fontSize: 12
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                >

                  {sentimentDistribution.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill={
                          index === 0
                            ? "#10b981"
                            : index === 1
                            ? "#ef4444"
                            : "#f59e0b"
                        }
                      />
                    )
                  )}

                </Bar>

              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              text="No NLP sentiment data available"
            />
          )}

        </div>

        {/* BRAND */}

        <div className="analytics-chart-card">

          <ChartHeader
            icon={<Database size={19} />}
            title="Brand Distribution"
            subtitle="Review volume by brand"
          />

          {brandDistribution.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={310}
            >
              <BarChart
                data={brandDistribution}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 20,
                  left: 20,
                  bottom: 5
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.15}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                />

                <YAxis
                  type="category"
                  dataKey="brand"
                  width={90}
                  tick={{
                    fontSize: 12
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                >

                  {brandDistribution.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill="#8b5cf6"
                      />
                    )
                  )}

                </Bar>

              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              text="Brand column not available"
            />
          )}

        </div>

        {/* PRODUCT */}

        <div className="analytics-chart-card">

          <ChartHeader
            icon={<FileText size={19} />}
            title="Product Distribution"
            subtitle="Review volume by product"
          />

          {productDistribution.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={310}
            >
              <BarChart
                data={productDistribution}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 20,
                  left: 20,
                  bottom: 5
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.15}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                />

                <YAxis
                  type="category"
                  dataKey="product"
                  width={120}
                  tick={{
                    fontSize: 11
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                >

                  {productDistribution.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill="#10b981"
                      />
                    )
                  )}

                </Bar>

              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              text="Product column not available"
            />
          )}

        </div>

      </section>

      {/* NLP MODEL EVALUATION */}

      <section className="analytics-section nlp-section">

        <div className="analytics-section-header">

          <div>

            <h2>
              NLP Model Evaluation
            </h2>

            <p>
              Compare Text Only, Text + Emoji and
              Text + Emoji + Context models
            </p>

          </div>

          <button
            className="evaluate-button"
            onClick={handleEvaluateDataset}
            disabled={
              evaluationLoading ||
              !datasetLoaded
            }
          >

            {evaluationLoading ? (
              <>
                <RefreshCw
                  size={17}
                  className="analytics-spin"
                />

                Evaluating...
              </>
            ) : (
              <>
                <BarChart3 size={17} />

                Run Evaluation
              </>
            )}

          </button>

        </div>

        {evaluationError && (
          <div className="analytics-error">

            <AlertCircle size={18} />

            <span>
              {evaluationError}
            </span>

          </div>
        )}

        {evaluationResults ? (
          <>

            {/* MODEL ACCURACY CHART */}

            <div className="analytics-model-chart-card">

              <ChartHeader
                icon={<BarChart3 size={19} />}
                title="Model Accuracy Comparison"
                subtitle="Evaluation accuracy across the three CCI models"
              />

              {modelChartData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={320}
                >
                  <BarChart
                    data={modelChartData}
                    margin={{
                      top: 20,
                      right: 15,
                      left: 5,
                      bottom: 10
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.15}
                    />

                    <XAxis
                      dataKey="model"
                    />

                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) =>
                        `${value}%`
                      }
                    />

                    <Tooltip
                      formatter={(value) =>
                        `${Number(value).toFixed(2)}%`
                      }
                    />

                    <Bar
                      dataKey="accuracy"
                      radius={[7, 7, 0, 0]}
                    >

                      <Cell fill="#2563eb" />
                      <Cell fill="#db2777" />
                      <Cell fill="#059669" />

                    </Bar>

                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart
                  text="Model accuracy data unavailable"
                />
              )}

            </div>

            {/* MODEL METRICS */}

            <div className="model-metrics-grid">

              <ModelMetrics
                title="Model 1"
                subtitle="Text Only"
                model={getModel("model_1")}
                color="blue"
              />

              <ModelMetrics
                title="Model 2"
                subtitle="Text + Emoji"
                model={getModel("model_2")}
                color="pink"
              />

              <ModelMetrics
                title="Model 3"
                subtitle="Text + Emoji + Context"
                model={getModel("model_3")}
                color="green"
              />

            </div>

            {/* EVALUATION SUMMARY */}

            <div className="evaluation-info-grid">

              <SummaryItem
                label="Evaluation Reviews"
                value={
                  findNestedValue(
                    evaluationResults,
                    [
                      "evaluation_reviews",
                      "evaluationReviews",
                      "evaluation_count",
                      "evaluationCount",
                      "sample_size",
                      "sampleSize"
                    ]
                  ) ??
                  (() => {
                    const model =
                      evaluationResults?.models?.model_1 ||
                      evaluationResults?.results?.model_1 ||
                      evaluationResults?.model_1 ||
                      evaluationResults?.models?.model1 ||
                      evaluationResults?.results?.model1 ||
                      evaluationResults?.model1;

                    if (!model) return "—";

                    const matrix =
                      model?.confusion_matrix ||
                      model?.confusionMatrix ||
                      model?.confusion ||
                      {};

                    const tn = Number(
                      model?.TN ??
                      model?.tn ??
                      model?.true_negative ??
                      model?.trueNegative ??
                      matrix?.TN ??
                      matrix?.tn ??
                      matrix?.true_negative ??
                      matrix?.trueNegative ??
                      matrix?.[0]?.[0] ??
                      0
                    );

                    const fp = Number(
                      model?.FP ??
                      model?.fp ??
                      model?.false_positive ??
                      model?.falsePositive ??
                      matrix?.FP ??
                      matrix?.fp ??
                      matrix?.false_positive ??
                      matrix?.falsePositive ??
                      matrix?.[0]?.[1] ??
                      0
                    );

                    const fn = Number(
                      model?.FN ??
                      model?.fn ??
                      model?.false_negative ??
                      model?.falseNegative ??
                      matrix?.FN ??
                      matrix?.fn ??
                      matrix?.false_negative ??
                      matrix?.falseNegative ??
                      matrix?.[1]?.[0] ??
                      0
                    );

                    const tp = Number(
                      model?.TP ??
                      model?.tp ??
                      model?.true_positive ??
                      model?.truePositive ??
                      matrix?.TP ??
                      matrix?.tp ??
                      matrix?.true_positive ??
                      matrix?.truePositive ??
                      matrix?.[1]?.[1] ??
                      0
                    );

                    const total = tn + fp + fn + tp;

                    return total > 0
                      ? total.toLocaleString()
                      : "—";
                  })()
                }
              />

              <SummaryItem
                label="Eligible Reviews"
                value={
                  findNestedValue(
                    evaluationResults,
                    [
                      "eligible_reviews_before_sampling",
                      "eligibleReviewsBeforeSampling",
                      "eligible_reviews",
                      "eligibleReviews"
                    ]
                  ) ??
                  (() => {
                    if (!Array.isArray(rows)) return "—";

                    if (ratingColumn) {
                      const eligibleCount =
                        rows.filter((row) => {
                          const rating = Number(
                            row?.[ratingColumn]
                          );

                          return (
                            !Number.isNaN(rating) &&
                            rating !== 3
                          );
                        }).length;

                      return eligibleCount > 0
                        ? eligibleCount.toLocaleString()
                        : "—";
                    }

                    return rows.length > 0
                      ? rows.length.toLocaleString()
                      : "—";
                  })()
                }
              />

              <SummaryItem
                label="Emoji Reviews"
                value={
                  findNestedValue(
                    evaluationResults,
                    [
                      "emoji_reviews",
                      "emojiReviews",
                      "emoji_review_count",
                      "emojiReviewCount",
                      "emoji_reviews_count",
                      "emojiReviewsCount",
                      "reviews_with_emoji",
                      "reviewsWithEmoji",
                      "emoji_review_total",
                      "emojiReviewTotal"
                    ]
                  ) ??
                  (dataset?.emojiReviewCount ??
                    (() => {
                      if (!reviewColumn || !Array.isArray(rows)) {
                        return "—";
                      }

                      const emojiRegex =
                        /[\u{1F300}-\u{1FAFF}\u2600-\u{27BF}]/u;

                      const count = rows.filter((row) => {
                        const text = String(
                          row?.[reviewColumn] ?? ""
                        );

                        return emojiRegex.test(text);
                      }).length;

                      return count > 0
                        ? count.toLocaleString()
                        : "—";
                    })())
                }
              />

              <SummaryItem
                label="Sampling"
                value={
                  (() => {
                    const sampling =
                      findNestedValue(
                        evaluationResults,
                        [
                          "sampling_method",
                          "samplingMethod"
                        ]
                      );

                    const evaluationCount =
                      findNestedValue(
                        evaluationResults,
                        [
                          "evaluation_reviews",
                          "evaluationReviews",
                          "evaluation_count",
                          "evaluationCount",
                          "sample_size",
                          "sampleSize"
                        ]
                      );

                    if (sampling) {
                      const text = String(sampling);

                      if (
                        /random sample/i.test(text) &&
                        evaluationCount
                      ) {
                        return `Random sample of ${Number(
                          evaluationCount
                        ).toLocaleString()} eligible reviews`;
                      }

                      return text;
                    }

                    return evaluationCount
                      ? `Random sample of ${Number(
                          evaluationCount
                        ).toLocaleString()} eligible reviews`
                      : "Dataset evaluation";
                  })()
                }
              />

            </div>

          </>
        ) : (
          <div className="evaluation-empty">

            <BarChart3 size={35} />

            <h3>
              No NLP evaluation available
            </h3>

            <p>
              Run the evaluation to calculate
              performance metrics for Model 1,
              Model 2 and Model 3.
            </p>

          </div>
        )}

      </section>

      {/* DATASET SUMMARY */}

      <section className="analytics-section">

        <div className="analytics-section-header">

          <div>

            <h2>
              Dataset Summary
            </h2>

            <p>
              Detected dataset structure and analysis
              information
            </p>

          </div>

        </div>

        <div className="dataset-summary-grid">

          <SummaryItem
            label="Review Column"
            value={
              reviewColumn ||
              "Not detected"
            }
          />

          <SummaryItem
            label="Rating Column"
            value={
              ratingColumn ||
              "Not detected"
            }
          />

          <SummaryItem
            label="Brand Column"
            value={
              brandColumn ||
              "Not detected"
            }
          />

          <SummaryItem
            label="Product Column"
            value={
              productColumn ||
              "Not detected"
            }
          />

          <SummaryItem
            label="Verified Purchase"
            value={
              verifiedColumn ||
              "Not detected"
            }
          />

          <SummaryItem
            label="Helpful Votes"
            value={
              helpfulColumn ||
              "Not detected"
            }
          />

        </div>

        <div className="dataset-summary-footer">

          <div className="summary-footer-icon">
            <Database size={20} />
          </div>

          <div>

            <strong>
              Current Dataset
            </strong>

            <p>
              {dataset?.fileName ||
              dataset?.name ||
              "Uploaded CCI Dataset"}
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  title,
  value,
  color
}) {
  return (
    <div
      className={`analytics-stat-card stat-${color}`}
    >

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

// =====================================================
// CHART HEADER
// =====================================================

function ChartHeader({
  icon,
  title,
  subtitle
}) {
  return (
    <div className="chart-header">

      <div className="chart-header-icon">
        {icon}
      </div>

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {subtitle}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// EMPTY CHART
// =====================================================

function EmptyChart({ text }) {
  return (
    <div className="empty-chart">

      <BarChart3 size={32} />

      <span>
        {text}
      </span>

    </div>
  );
}

// =====================================================
// SUMMARY ITEM
// =====================================================

function SummaryItem({
  label,
  value
}) {
  return (
    <div className="summary-item">

      <span>
        {label}
      </span>

      <strong
        title={String(value)}
        style={{
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          lineHeight: 1.35
        }}
      >
        {value}
      </strong>

    </div>
  );
}

// =====================================================
// MODEL METRICS
// =====================================================

function ModelMetrics({
  title,
  subtitle,
  model,
  color
}) {
  if (!model) {
    return (
      <div
        className={`model-card model-${color}`}
      >

        <div className="model-card-header">

          <div>
            <h3>
              {title}
            </h3>

            <p>
              {subtitle}
            </p>
          </div>

        </div>

        <div className="model-not-available">
          Model results unavailable.
        </div>

      </div>
    );
  }

  // ---------------------------------------------------
  // READ METRIC
  // ---------------------------------------------------

  const getMetric = (...keys) => {
    for (const key of keys) {

      const value =
        model?.[key] ??
        model?.metrics?.[key];

      if (
        value !== undefined &&
        value !== null
      ) {

        const numeric =
          Number(value);

        if (!Number.isNaN(numeric)) {

          const percentage =
            numeric <= 1
              ? numeric * 100
              : numeric;

          return `${percentage.toFixed(2)}%`;
        }

        return String(value);
      }
    }

    return "—";
  };

  return (
    <div
      className={`model-card model-${color}`}
    >

      <div className="model-card-header">

        <div>

          <h3>
            {title}
          </h3>

          <p>
            {subtitle}
          </p>

        </div>

        <div className="model-status">

          <CheckCircle2 size={16} />

          Evaluated

        </div>

      </div>

      <div className="model-metric-grid">

        <MetricBox
          label="Accuracy"
          value={getMetric(
            "accuracy",
            "accuracy_score",
            "accuracyScore"
          )}
        />

        <MetricBox
          label="Precision"
          value={getMetric(
            "precision",
            "precision_score",
            "precisionScore"
          )}
        />

        <MetricBox
          label="Recall"
          value={getMetric(
            "recall",
            "recall_score",
            "recallScore",
            "sensitivity"
          )}
        />

        <MetricBox
          label="F1 Score"
          value={getMetric(
            "f1",
            "f1_score",
            "f1Score",
            "f1score"
          )}
        />

      </div>

      <ConfusionMatrix
        model={model}
      />

    </div>
  );
}

// =====================================================
// METRIC BOX
// =====================================================

function MetricBox({
  label,
  value
}) {
  return (
    <div className="metric-box">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

// =====================================================
// CONFUSION MATRIX
// =====================================================

function ConfusionMatrix({
  model
}) {
  const matrix =
    model?.confusion_matrix ||
    model?.confusionMatrix ||
    model?.confusion ||
    null;

  const tn =
    model?.TN ??
    model?.tn ??
    model?.true_negative ??
    model?.trueNegative ??
    matrix?.TN ??
    matrix?.tn ??
    matrix?.true_negative ??
    matrix?.trueNegative ??
    matrix?.[0]?.[0] ??
    "—";

  const fp =
    model?.FP ??
    model?.fp ??
    model?.false_positive ??
    model?.falsePositive ??
    matrix?.FP ??
    matrix?.fp ??
    matrix?.false_positive ??
    matrix?.falsePositive ??
    matrix?.[0]?.[1] ??
    "—";

  const fn =
    model?.FN ??
    model?.fn ??
    model?.false_negative ??
    model?.falseNegative ??
    matrix?.FN ??
    matrix?.fn ??
    matrix?.false_negative ??
    matrix?.falseNegative ??
    matrix?.[1]?.[0] ??
    "—";

  const tp =
    model?.TP ??
    model?.tp ??
    model?.true_positive ??
    model?.truePositive ??
    matrix?.TP ??
    matrix?.tp ??
    matrix?.true_positive ??
    matrix?.truePositive ??
    matrix?.[1]?.[1] ??
    "—";

  return (
    <div className="confusion-section">

      <div className="confusion-title">
        Confusion Matrix
      </div>

      <div className="confusion-grid">

        <div className="confusion-cell">
          <span>TN</span>
          <strong>{tn}</strong>
        </div>

        <div className="confusion-cell">
          <span>FP</span>
          <strong>{fp}</strong>
        </div>

        <div className="confusion-cell">
          <span>FN</span>
          <strong>{fn}</strong>
        </div>

        <div className="confusion-cell">
          <span>TP</span>
          <strong>{tp}</strong>
        </div>

      </div>

    </div>
  );
}

export default Analytics;