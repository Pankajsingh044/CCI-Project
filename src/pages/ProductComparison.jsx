import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  GitCompare,
  Info,
  Package,
  RefreshCw,
  Smile,
  Star,
} from "lucide-react";

import { getDataset } from "../services/datasetStorage";


// =====================================================
// HELPER FUNCTIONS
// =====================================================

function findColumn(columns, names) {
  if (!Array.isArray(columns)) return null;

  // Exact match first
  for (const name of names) {
    const found = columns.find(
      (column) =>
        String(column).toLowerCase().trim() ===
        String(name).toLowerCase().trim()
    );

    if (found) return found;
  }

  // Partial match second
  for (const name of names) {
    const found = columns.find((column) =>
      String(column)
        .toLowerCase()
        .trim()
        .includes(String(name).toLowerCase().trim())
    );

    if (found) return found;
  }

  return null;
}


function cleanValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}


function uniqueValues(rows, column) {
  if (!Array.isArray(rows) || !column) {
    return [];
  }

  return [
    ...new Set(
      rows
        .map((row) => cleanValue(row?.[column]))
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));
}


function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(
    String(value ?? "").replace(/[^0-9.-]/g, "")
  );

  return Number.isFinite(parsed) ? parsed : null;
}


function isVerified(value) {
  const normalized = cleanValue(value).toLowerCase();

  return [
    "true",
    "yes",
    "y",
    "1",
    "verified",
    "verified purchase",
    "verified_purchase",
  ].includes(normalized);
}


function extractEmojis(text) {
  if (!text) {
    return [];
  }

  const emojiRegex =
    /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F]/gu;

  return String(text).match(emojiRegex) || [];
}


function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}


function formatRating(value) {
  if (!value) {
    return "—";
  }

  return Number(value).toFixed(2);
}


// =====================================================
// CALCULATE PRODUCT METRICS
// =====================================================

function calculateProductMetrics(
  rows,
  columns,
  selection,
  detected
) {
  const {
    brandColumn,
    productColumn,
    reviewColumn,
    ratingColumn,
    verifiedColumn,
    helpfulColumn,
  } = detected;

  if (!selection.product || !productColumn) {
    return null;
  }

  const filteredRows = rows.filter((row) => {
    const productMatches =
      cleanValue(row?.[productColumn]) === selection.product;

    const brandMatches =
      !brandColumn ||
      selection.brand === "__ALL__" ||
      cleanValue(row?.[brandColumn]) === selection.brand;

    return productMatches && brandMatches;
  });


  const ratings = ratingColumn
    ? filteredRows
        .map((row) => toNumber(row?.[ratingColumn]))
        .filter((value) => value !== null)
    : [];


  const lengths = reviewColumn
    ? filteredRows.map((row) =>
        cleanValue(row?.[reviewColumn]).length
      )
    : [];


  const emojiReviewCount = reviewColumn
    ? filteredRows.filter(
        (row) =>
          extractEmojis(row?.[reviewColumn]).length > 0
      ).length
    : 0;


  const totalEmojiCount = reviewColumn
    ? filteredRows.reduce(
        (sum, row) =>
          sum +
          extractEmojis(row?.[reviewColumn]).length,
        0
      )
    : 0;


  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };


  ratings.forEach((rating) => {
    const rounded = Math.round(rating);

    if (rounded >= 1 && rounded <= 5) {
      ratingDistribution[rounded] += 1;
    }
  });


  const verifiedCount = verifiedColumn
    ? filteredRows.filter((row) =>
        isVerified(row?.[verifiedColumn])
      ).length
    : null;


  const helpfulVotes = helpfulColumn
    ? filteredRows.reduce(
        (sum, row) =>
          sum + (toNumber(row?.[helpfulColumn]) || 0),
        0
      )
    : null;


  return {
    count: filteredRows.length,

    averageRating: ratings.length
      ? ratings.reduce(
          (sum, value) => sum + value,
          0
        ) / ratings.length
      : 0,

    ratingsAvailable: ratings.length,

    ratingDistribution,

    emojiReviewCount,

    totalEmojiCount,

    emojiUsageRate: filteredRows.length
      ? (emojiReviewCount / filteredRows.length) * 100
      : 0,

    averageReviewLength: lengths.length
      ? lengths.reduce(
          (sum, value) => sum + value,
          0
        ) / lengths.length
      : 0,

    verifiedCount,

    verifiedRate:
      verifiedColumn && filteredRows.length
        ? (verifiedCount / filteredRows.length) * 100
        : null,

    helpfulVotes,

    hasVerifiedColumn: Boolean(verifiedColumn),

    hasHelpfulColumn: Boolean(helpfulColumn),
  };
}


// =====================================================
// MAIN PRODUCT COMPARISON
// =====================================================

function ProductComparison() {

  const [dataset, setDataset] = useState(null);

  const [error, setError] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [brandA, setBrandA] = useState("__ALL__");

  const [brandB, setBrandB] = useState("__ALL__");

  const [productA, setProductA] = useState("");

  const [productB, setProductB] = useState("");


  // ===================================================
  // LOAD DATASET FROM INDEXEDDB
  // ===================================================

  useEffect(() => {

    const loadDataset = async () => {

      try {

        setError("");

        const parsed = await getDataset();

        if (!parsed) {
          setDataset(null);
          return;
        }


        const rows =
          Array.isArray(parsed.rows)
            ? parsed.rows
            : Array.isArray(parsed.data)
            ? parsed.data
            : [];


        const columns =
          Array.isArray(parsed.columns)
            ? parsed.columns
            : rows.length > 0
            ? Object.keys(rows[0])
            : [];


        setDataset({
          ...parsed,
          rows,
          columns,
        });

      } catch (err) {

        console.error(
          "Product Comparison dataset loading error:",
          err
        );

        setDataset(null);

        setError(
          "Unable to load the saved dataset."
        );
      }

    };


    loadDataset();

  }, []);


  // ===================================================
  // REFRESH DATASET
  // ===================================================

  const refreshDataset = async () => {

    try {

      setRefreshing(true);

      setError("");


      const parsed = await getDataset();


      if (!parsed) {

        setDataset(null);

        return;
      }


      const rows =
        Array.isArray(parsed.rows)
          ? parsed.rows
          : Array.isArray(parsed.data)
          ? parsed.data
          : [];


      const columns =
        Array.isArray(parsed.columns)
          ? parsed.columns
          : rows.length > 0
          ? Object.keys(rows[0])
          : [];


      setDataset({
        ...parsed,
        rows,
        columns,
      });


    } catch (err) {

      console.error(
        "Product Comparison refresh error:",
        err
      );

      setError(
        "Unable to refresh the saved dataset."
      );

    } finally {

      setRefreshing(false);

    }

  };


  // ===================================================
  // DETECT COLUMNS
  // ===================================================

  const detected = useMemo(() => {

    const columns = dataset?.columns || [];


    return {

      brandColumn: findColumn(columns, [
        "brand",
        "manufacturer",
        "company",
      ]),


      productColumn: findColumn(columns, [
        "product_name",
        "product name",
        "product",
        "productname",
        "model_name",
        "model name",
        "model",
        "device",
        "device_name",
      ]),


      reviewColumn: findColumn(columns, [
        "review_text",
        "review text",
        "review-text",
        "reviewtext",
        "review_body",
        "reviewbody",
        "review_content",
        "reviewcontent",
        "review",
        "comment",
        "comments",
        "text",
        "content",
        "body",
        "description",
        "feedback",
      ]),


      ratingColumn: findColumn(columns, [
        "rating",
        "ratings",
        "star_rating",
        "stars",
        "score",
      ]),


      verifiedColumn: findColumn(columns, [
        "verified_purchase",
        "verified purchase",
        "verified-purchase",
        "verified",
        "is_verified",
        "verified_buyer",
        "verified buyer",
      ]),


      helpfulColumn: findColumn(columns, [
        "helpful_votes",
        "helpful votes",
        "helpful_vote",
        "helpful",
        "votes",
        "helpful_count",
      ]),
    };

  }, [dataset]);


  // ===================================================
  // ALL BRANDS
  // ===================================================

  const brands = useMemo(() => {

    if (!dataset || !detected.brandColumn) {
      return [];
    }


    return uniqueValues(
      dataset.rows,
      detected.brandColumn
    );

  }, [dataset, detected.brandColumn]);


  // ===================================================
  // PRODUCT OPTIONS FOR A
  // ===================================================

  const productOptionsA = useMemo(() => {

    if (!dataset || !detected.productColumn) {
      return [];
    }


    let rows = dataset.rows;


    if (
      detected.brandColumn &&
      brandA !== "__ALL__"
    ) {

      rows = rows.filter(
        (row) =>
          cleanValue(
            row?.[detected.brandColumn]
          ) === brandA
      );
    }


    return uniqueValues(
      rows,
      detected.productColumn
    );

  }, [
    dataset,
    detected.productColumn,
    detected.brandColumn,
    brandA,
  ]);


  // ===================================================
  // PRODUCT OPTIONS FOR B
  // ===================================================

  const productOptionsB = useMemo(() => {

    if (!dataset || !detected.productColumn) {
      return [];
    }


    let rows = dataset.rows;


    if (
      detected.brandColumn &&
      brandB !== "__ALL__"
    ) {

      rows = rows.filter(
        (row) =>
          cleanValue(
            row?.[detected.brandColumn]
          ) === brandB
      );
    }


    return uniqueValues(
      rows,
      detected.productColumn
    );

  }, [
    dataset,
    detected.productColumn,
    detected.brandColumn,
    brandB,
  ]);


  // ===================================================
  // INITIAL PRODUCT A
  // ===================================================

  useEffect(() => {

    if (productOptionsA.length === 0) {

      setProductA("");

      return;
    }


    if (
      !productA ||
      !productOptionsA.includes(productA)
    ) {

      setProductA(productOptionsA[0]);
    }

  }, [productOptionsA, productA]);


  // ===================================================
  // INITIAL PRODUCT B
  // ===================================================

  useEffect(() => {

    if (productOptionsB.length === 0) {

      setProductB("");

      return;
    }


    if (
      !productB ||
      !productOptionsB.includes(productB)
    ) {

      const differentProduct =
        productOptionsB.find(
          (product) => product !== productA
        );


      setProductB(
        differentProduct ||
        productOptionsB[0]
      );
    }

  }, [productOptionsB, productA, productB]);


  // ===================================================
  // CHANGE BRAND A
  // ===================================================

  function handleBrandAChange(event) {

    const value = event.target.value;

    setBrandA(value);

    setProductA("");
  }


  // ===================================================
  // CHANGE BRAND B
  // ===================================================

  function handleBrandBChange(event) {

    const value = event.target.value;

    setBrandB(value);

    setProductB("");
  }


  // ===================================================
  // CHANGE PRODUCT A
  // ===================================================

  function handleProductAChange(event) {

    const value = event.target.value;

    setProductA(value);
  }


  // ===================================================
  // CHANGE PRODUCT B
  // ===================================================

  function handleProductBChange(event) {

    const value = event.target.value;

    setProductB(value);
  }


  // ===================================================
  // METRICS
  // ===================================================

  const metricsA = useMemo(() => {

    if (!dataset) {
      return null;
    }


    return calculateProductMetrics(
      dataset.rows,
      dataset.columns,
      {
        brand: brandA,
        product: productA,
      },
      detected
    );

  }, [
    dataset,
    brandA,
    productA,
    detected,
  ]);


  const metricsB = useMemo(() => {

    if (!dataset) {
      return null;
    }


    return calculateProductMetrics(
      dataset.rows,
      dataset.columns,
      {
        brand: brandB,
        product: productB,
      },
      detected
    );

  }, [
    dataset,
    brandB,
    productB,
    detected,
  ]);


  // ===================================================
  // LABELS
  // ===================================================

  const productALabel =
    productA || "Product A";


  const productBLabel =
    productB || "Product B";


  const sameSelection =
    productA &&
    productB &&
    productA === productB &&
    brandA === brandB;


  // ===================================================
  // NO DATASET
  // ===================================================

  if (!dataset) {

    return (

      <div className="comparison-page">

        <div className="comparison-page-header">

          <div>

            <div className="page-eyebrow">
              PRODUCT ANALYTICS
            </div>

            <h1>
              Product Comparison
            </h1>

            <p>
              Compare descriptive review statistics
              across products using the uploaded
              dataset.
            </p>

          </div>

        </div>


        <div className="comparison-empty-card">

          <div className="comparison-empty-icon">
            <Database size={28} />
          </div>

          <h2>
            No Dataset Available
          </h2>

          <p>
            Upload a review dataset in Dataset
            Analysis before comparing products.
          </p>

          <a
            href="/dataset-analysis"
            className="comparison-primary-button"
          >
            <Database size={17} />
            Open Dataset Analysis
          </a>

        </div>

      </div>
    );
  }


  // ===================================================
  // NO PRODUCT COLUMN
  // ===================================================

  if (!detected.productColumn) {

    return (

      <div className="comparison-page">

        <div className="comparison-page-header">

          <div>

            <div className="page-eyebrow">
              PRODUCT ANALYTICS
            </div>

            <h1>
              Product Comparison
            </h1>

            <p>
              Compare descriptive review statistics
              across products using the uploaded
              dataset.
            </p>

          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >

            <div className="comparison-dataset-badge">

              <FileText size={16} />

              <span>
                {dataset.name ||
                  dataset.fileName ||
                  "Uploaded Dataset"}
              </span>

            </div>


            <button
              type="button"
              className="comparison-refresh-button"
              onClick={refreshDataset}
              disabled={refreshing}
              title="Reload latest dataset"
            >

              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "comparison-refresh-icon spinning"
                    : "comparison-refresh-icon"
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh Dataset"}

            </button>

          </div>

        </div>


        <div className="comparison-warning-card">

          <AlertCircle size={22} />

          <div>

            <strong>
              Product column not detected
            </strong>

            <p>
              The current dataset does not contain
              a recognizable product or model column.
            </p>

          </div>

        </div>

      </div>
    );
  }


  // ===================================================
  // MAIN PAGE
  // ===================================================

  return (

    <div className="comparison-page">


      {/* HEADER */}

      <div className="comparison-page-header">

        <div>

          <div className="page-eyebrow">
            PRODUCT ANALYTICS
          </div>

          <h1>
            Product Comparison
          </h1>

          <p>
            Compare review volume, ratings,
            emoji usage, review length and
            available engagement fields side by side.
          </p>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >

          <div className="comparison-dataset-badge">

            <FileText size={16} />

            <span>
              {dataset.name ||
                dataset.fileName ||
                "Uploaded Dataset"}
            </span>

          </div>


          <button
            type="button"
            className="comparison-refresh-button"
            onClick={refreshDataset}
            disabled={refreshing}
            title="Reload latest dataset"
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "comparison-refresh-icon spinning"
                  : "comparison-refresh-icon"
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Dataset"}

          </button>

        </div>

      </div>


      {/* ERROR */}

      {error && (

        <div className="comparison-warning-card">

          <AlertCircle size={20} />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* INFORMATION */}

      <div className="comparison-info-banner">

        <Info size={18} />

        <div>

          <strong>
            Descriptive comparison only
          </strong>

          <span>
            CCI displays statistics calculated from
            the uploaded data. It does not assign a
            winner, rank products, or make a recommendation.
          </span>

        </div>

      </div>


      {/* =================================================
          PRODUCT SELECTORS
      ================================================= */}

      <section className="comparison-selector-grid">


        {/* PRODUCT A */}

        <div className="comparison-selector-card">

          <div className="comparison-selector-heading">

            <div className="comparison-product-number">
              A
            </div>

            <div>

              <span>
                PRODUCT A
              </span>

              <h2>
                {productALabel}
              </h2>

            </div>

          </div>


          {detected.brandColumn && (

            <div className="comparison-field">

              <label htmlFor="brand-a">
                Brand
              </label>

              <select
                id="brand-a"
                value={brandA}
                onChange={handleBrandAChange}
              >

                <option value="__ALL__">
                  All Brands
                </option>

                {brands.map((brand) => (

                  <option
                    key={`brand-a-${brand}`}
                    value={brand}
                  >
                    {brand}
                  </option>

                ))}

              </select>

            </div>

          )}


          <div className="comparison-field">

            <label htmlFor="product-a">
              Product / Model
            </label>

            <select
              id="product-a"
              value={productA}
              onChange={handleProductAChange}
            >

              {productOptionsA.length === 0 ? (

                <option value="">
                  No products available
                </option>

              ) : (

                productOptionsA.map((product) => (

                  <option
                    key={`product-a-${product}`}
                    value={product}
                  >
                    {product}
                  </option>

                ))

              )}

            </select>

          </div>

        </div>


        {/* VS */}

        <div
          className="comparison-vs-badge"
          aria-label="Compare"
        >

          <GitCompare size={21} />

          <span>
            VS
          </span>

        </div>


        {/* PRODUCT B */}

        <div className="comparison-selector-card">

          <div className="comparison-selector-heading">

            <div className="comparison-product-number">
              B
            </div>

            <div>

              <span>
                PRODUCT B
              </span>

              <h2>
                {productBLabel}
              </h2>

            </div>

          </div>


          {detected.brandColumn && (

            <div className="comparison-field">

              <label htmlFor="brand-b">
                Brand
              </label>

              <select
                id="brand-b"
                value={brandB}
                onChange={handleBrandBChange}
              >

                <option value="__ALL__">
                  All Brands
                </option>

                {brands.map((brand) => (

                  <option
                    key={`brand-b-${brand}`}
                    value={brand}
                  >
                    {brand}
                  </option>

                ))}

              </select>

            </div>

          )}


          <div className="comparison-field">

            <label htmlFor="product-b">
              Product / Model
            </label>

            <select
              id="product-b"
              value={productB}
              onChange={handleProductBChange}
            >

              {productOptionsB.length === 0 ? (

                <option value="">
                  No products available
                </option>

              ) : (

                productOptionsB.map((product) => (

                  <option
                    key={`product-b-${product}`}
                    value={product}
                  >
                    {product}
                  </option>

                ))

              )}

            </select>

          </div>

        </div>

      </section>


      {/* =================================================
          SELECTION WARNING
      ================================================= */}

      {!metricsA ||
      !metricsB ||
      sameSelection ? (

        <div className="comparison-warning-card">

          <AlertCircle size={20} />

          <span>

            {sameSelection
              ? "Select two different products to create a side-by-side comparison."
              : "Select two products with available records to view their descriptive statistics."}

          </span>

        </div>

      ) : (

        <>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          <section className="comparison-section">

            <div className="comparison-section-heading">

              <div>

                <div className="page-eyebrow">
                  OVERVIEW
                </div>

                <h2>
                  Review Statistics
                </h2>

              </div>

              <span className="comparison-section-note">

                Calculated from{" "}
                {formatNumber(
                  dataset.recordCount ||
                  dataset.rows.length
                )}{" "}
                dataset records

              </span>

            </div>


            {/* METRIC TABLE */}

            <div className="comparison-metric-table">

              <div className="comparison-metric-head">

                <div>
                  Metric
                </div>

                <div className="comparison-product-head">

                  <Package size={16} />

                  {productALabel}

                </div>

                <div className="comparison-product-head">

                  <Package size={16} />

                  {productBLabel}

                </div>

              </div>


              <ComparisonMetricRow
                icon={<Database size={17} />}
                label="Review volume"
                valueA={formatNumber(metricsA.count)}
                valueB={formatNumber(metricsB.count)}
              />


              <ComparisonMetricRow
                icon={<Star size={17} />}
                label="Average rating"
                valueA={formatRating(
                  metricsA.averageRating
                )}
                valueB={formatRating(
                  metricsB.averageRating
                )}
              />


              <ComparisonMetricRow
                icon={<Smile size={17} />}
                label="Reviews with emoji"
                valueA={`${formatNumber(
                  metricsA.emojiReviewCount
                )} (${metricsA.emojiUsageRate.toFixed(1)}%)`}
                valueB={`${formatNumber(
                  metricsB.emojiReviewCount
                )} (${metricsB.emojiUsageRate.toFixed(1)}%)`}
              />


              <ComparisonMetricRow
                icon={<FileText size={17} />}
                label="Average review length"
                valueA={`${Math.round(
                  metricsA.averageReviewLength
                )} chars`}
                valueB={`${Math.round(
                  metricsB.averageReviewLength
                )} chars`}
              />


              <ComparisonMetricRow
                icon={<CheckCircle2 size={17} />}
                label="Verified purchases"
                valueA={
                  metricsA.hasVerifiedColumn
                    ? `${formatNumber(
                        metricsA.verifiedCount
                      )} (${metricsA.verifiedRate.toFixed(1)}%)`
                    : "Not available"
                }
                valueB={
                  metricsB.hasVerifiedColumn
                    ? `${formatNumber(
                        metricsB.verifiedCount
                      )} (${metricsB.verifiedRate.toFixed(1)}%)`
                    : "Not available"
                }
              />


              <ComparisonMetricRow
                icon={<BarChart3 size={17} />}
                label="Helpful votes"
                valueA={
                  metricsA.hasHelpfulColumn
                    ? formatNumber(
                        metricsA.helpfulVotes
                      )
                    : "Not available"
                }
                valueB={
                  metricsB.hasHelpfulColumn
                    ? formatNumber(
                        metricsB.helpfulVotes
                      )
                    : "Not available"
                }
              />

            </div>

          </section>


          {/* =================================================
              DETAIL CARDS
          ================================================= */}

          <section className="comparison-detail-grid">

            <ComparisonDetailCard
              title={productALabel}
              subtitle="Descriptive statistics"
              metrics={metricsA}
            />

            <ComparisonDetailCard
              title={productBLabel}
              subtitle="Descriptive statistics"
              metrics={metricsB}
            />

          </section>


          {/* =================================================
              METHOD NOTE
          ================================================= */}

          <div className="comparison-method-note">

            <Info size={18} />

            <div>

              <strong>
                How this comparison is calculated
              </strong>

              <p>
                Product-level values are calculated
                directly from the currently saved
                dataset. Emoji statistics are based
                on detected emoji characters in the
                review text. Sentiment, emotion,
                sarcasm and contextual interpretation
                are not generated by this page and
                require the NLP backend.
              </p>

            </div>

          </div>

        </>

      )}

    </div>
  );
}


// =====================================================
// METRIC ROW
// =====================================================

function ComparisonMetricRow({
  icon,
  label,
  valueA,
  valueB,
}) {

  return (

    <div className="comparison-metric-row">

      <div className="comparison-metric-label">

        <span className="comparison-metric-icon">
          {icon}
        </span>

        <span>
          {label}
        </span>

      </div>


      <div className="comparison-metric-value">
        {valueA}
      </div>


      <div className="comparison-metric-value">
        {valueB}
      </div>

    </div>
  );
}


// =====================================================
// DETAIL CARD
// =====================================================

function ComparisonDetailCard({
  title,
  subtitle,
  metrics,
}) {

  return (

    <div className="comparison-card comparison-detail-card">

      <div className="comparison-card-header">

        <div>

          <h2>
            {title}
          </h2>

          <p>
            {subtitle}
          </p>

        </div>

      </div>


      <div className="comparison-detail-list">

        <div>

          <span>
            Review volume
          </span>

          <strong>
            {formatNumber(metrics.count)}
          </strong>

        </div>


        <div>

          <span>
            Average rating
          </span>

          <strong>
            {formatRating(metrics.averageRating)}
          </strong>

        </div>


        <div>

          <span>
            Emoji review rate
          </span>

          <strong>
            {metrics.emojiUsageRate.toFixed(1)}%
          </strong>

        </div>


        <div>

          <span>
            Total emojis
          </span>

          <strong>
            {formatNumber(metrics.totalEmojiCount)}
          </strong>

        </div>


        <div>

          <span>
            Average review length
          </span>

          <strong>
            {Math.round(
              metrics.averageReviewLength
            )} chars
          </strong>

        </div>


        <div>

          <span>
            Helpful votes
          </span>

          <strong>

            {metrics.hasHelpfulColumn
              ? formatNumber(
                  metrics.helpfulVotes
                )
              : "Not available"}

          </strong>

        </div>

      </div>

    </div>
  );
}


export default ProductComparison;