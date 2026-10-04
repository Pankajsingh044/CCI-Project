import { useEffect, useMemo, useState } from "react";
import { getDataset } from "../services/datasetStorage";

import {
  Smile,
  Database,
  MessageSquare,
  Hash,
  Search,
  AlertCircle,
  TrendingUp,
  Package,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// =====================================================
// EMOJI MEANINGS
// =====================================================

const EMOJI_MEANINGS = {
  "😍": "Love / admiration",
  "❤️": "Love / appreciation",
  "❤": "Love / appreciation",
  "😊": "Happiness",
  "😀": "Happiness",
  "😃": "Happiness",
  "😄": "Happiness",
  "😁": "Joy",
  "😂": "Laughter",
  "🤣": "Strong laughter",
  "👍": "Positive approval",
  "👏": "Appreciation",
  "🔥": "Excitement / excellent",
  "💯": "Strong approval",
  "✨": "Positive / impressive",
  "😎": "Confidence / satisfaction",
  "🙂": "Mild positivity",
  "🤩": "Excitement / admiration",
  "🙌": "Celebration / appreciation",
  "🙏": "Thanks / appreciation",
  "🎉": "Celebration",
  "🚀": "Excitement / fast progress",

  "😐": "Neutral",
  "😶": "Unclear / neutral",
  "🤔": "Thinking / uncertainty",
  "😅": "Awkwardness / nervousness",

  "😕": "Confusion / dissatisfaction",
  "😔": "Sadness",
  "😞": "Disappointment",
  "😭": "Strong sadness",
  "😡": "Anger",
  "😠": "Anger",
  "👎": "Negative approval",
  "❌": "Negative / rejection",
  "💔": "Disappointment / dislike",
  "😢": "Sadness",
};

// =====================================================
// EMOJI SENTIMENT
// =====================================================

const POSITIVE_EMOJIS = [
  "😍",
  "❤️",
  "❤",
  "😊",
  "😀",
  "😃",
  "😄",
  "😁",
  "😂",
  "🤣",
  "👍",
  "👏",
  "🔥",
  "💯",
  "✨",
  "😎",
  "🙂",
  "🤩",
  "🙌",
  "🙏",
  "🎉",
  "🚀",
];

const NEGATIVE_EMOJIS = [
  "😕",
  "😔",
  "😞",
  "😭",
  "😡",
  "😠",
  "👎",
  "❌",
  "💔",
  "😢",
];

function getEmojiSentiment(emoji) {
  if (POSITIVE_EMOJIS.includes(emoji)) {
    return "Positive";
  }

  if (NEGATIVE_EMOJIS.includes(emoji)) {
    return "Negative";
  }

  return "Neutral";
}

// =====================================================
// EMOJI EXTRACTION
// =====================================================

function extractEmojis(text) {
  if (!text) {
    return [];
  }

  const emojiRegex =
    /[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F]/gu;

  return String(text).match(emojiRegex) || [];
}

// =====================================================
// GET REVIEW TEXT
// =====================================================

function getReviewText(row, reviewColumn) {
  if (reviewColumn && row[reviewColumn]) {
    return String(row[reviewColumn]);
  }

  return String(
    row.review_text ||
      row["review-text"] ||
      row.reviewText ||
      row.review ||
      row.text ||
      ""
  );
}

// =====================================================
// GET PRODUCT
// =====================================================

function getProduct(row) {
  return (
    row.product ||
    row.product_name ||
    row.productName ||
    row.item_name ||
    row.title ||
    "Unknown Product"
  );
}

// =====================================================
// EMOJI EXPLORER
// =====================================================

function EmojiExplorer() {
  const [dataset, setDataset] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedEmoji, setSelectedEmoji] = useState(null);

  // =====================================================
  // LOAD UPLOADED DATASET
  // =====================================================

  useEffect(() => {
    const loadDataset = async () => {
      try {
        const savedDataset = await getDataset();

        if (savedDataset) {
          setDataset(savedDataset);

          console.log(
            "CCI dataset loaded from IndexedDB:",
            savedDataset.name,
            savedDataset.rows?.length || 0,
            "rows"
          );
        } else {
          setDataset(null);
        }
      } catch (error) {
        console.error(
          "Unable to load dataset from IndexedDB:",
          error
        );

        setDataset(null);
      }
    };

    loadDataset();
  }, []);

  // =====================================================
  // SAFE DATA
  // IMPORTANT:
  // These are defined BEFORE useMemo so every render
  // follows the same hook order.
  // =====================================================

  const rows = dataset?.rows || [];

  const reviewColumn =
    dataset?.reviewColumn || null;

  // =====================================================
  // EMOJI ANALYSIS
  // IMPORTANT:
  // useMemo MUST always execute.
  // =====================================================

  const emojiData = useMemo(() => {
    const counts = {};

    const meanings = {};

    const reviewExamples = {};

    const sentimentCounts = {
      Positive: 0,
      Neutral: 0,
      Negative: 0,
    };

    const productEmojiMap = {};

    let reviewsWithEmoji = 0;

    let totalEmojis = 0;

    rows.forEach((row) => {
      const review = getReviewText(
        row,
        reviewColumn
      );

      const product = getProduct(row);

      const emojis = extractEmojis(review);

      if (emojis.length > 0) {
        reviewsWithEmoji++;
      }

      totalEmojis += emojis.length;

      emojis.forEach((emoji) => {
        counts[emoji] =
          (counts[emoji] || 0) + 1;

        meanings[emoji] =
          EMOJI_MEANINGS[emoji] ||
          "Emotion / expression";

        if (!reviewExamples[emoji]) {
          reviewExamples[emoji] = [];
        }

        if (
          reviewExamples[emoji].length < 5
        ) {
          reviewExamples[emoji].push(review);
        }

        const sentiment =
          getEmojiSentiment(emoji);

        sentimentCounts[sentiment]++;

        if (!productEmojiMap[product]) {
          productEmojiMap[product] = {
            product,
            emojiCount: 0,
            reviewsWithEmoji: 0,
          };
        }

        productEmojiMap[product].emojiCount++;
      });

      if (emojis.length > 0) {
        productEmojiMap[product] =
          productEmojiMap[product] || {
            product,
            emojiCount: 0,
            reviewsWithEmoji: 0,
          };

        productEmojiMap[
          product
        ].reviewsWithEmoji++;
      }
    });

    const sorted = Object.entries(counts).sort(
      ([, a], [, b]) => b - a
    );

    const productData = Object.values(
      productEmojiMap
    ).sort(
      (a, b) =>
        b.emojiCount - a.emojiCount
    );

    return {
      counts,
      sorted,
      meanings,
      reviewExamples,
      sentimentCounts,
      productData,
      reviewsWithEmoji,
      totalEmojis,
    };
  }, [rows, reviewColumn]);

  // =====================================================
  // NO DATASET
  // This return is NOW AFTER all hooks.
  // =====================================================

  if (!dataset) {
    return (
      <div className="emoji-page">
        <div className="page-eyebrow">
          CCI EMOJI ANALYSIS
        </div>

        <h1>Emoji Explorer</h1>

        <p className="emoji-description">
          Upload a review dataset from
          Dataset Analysis to explore
          real emoji usage.
        </p>

        <div className="emoji-empty">
          <Smile size={42} />

          <h2>
            No Dataset Available
          </h2>

          <p>
            Please upload a review dataset
            from Dataset Analysis first.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredEmojis =
    emojiData.sorted.filter(
      ([emoji]) =>
        emoji.includes(searchTerm)
    );

  // =====================================================
  // TOP EMOJI CHART
  // =====================================================

  const chartData =
    emojiData.sorted
      .slice(0, 15)
      .map(([emoji, count]) => ({
        emoji,
        count,
      }));

  // =====================================================
  // SENTIMENT CHART
  // =====================================================

  const sentimentData = [
    {
      name: "Positive",
      value:
        emojiData.sentimentCounts.Positive,
    },
    {
      name: "Neutral",
      value:
        emojiData.sentimentCounts.Neutral,
    },
    {
      name: "Negative",
      value:
        emojiData.sentimentCounts.Negative,
    },
  ].filter((item) => item.value > 0);

  // =====================================================
  // SELECTED EMOJI
  // =====================================================

  const selectedReviews = selectedEmoji
    ? emojiData.reviewExamples[
        selectedEmoji
      ] || []
    : [];

  const selectedMeaning = selectedEmoji
    ? emojiData.meanings[selectedEmoji] ||
      "Emotion / expression"
    : "";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="emoji-page">

      {/* HEADER */}

      <div className="emoji-page-header">
        <div>
          <div className="page-eyebrow">
            CCI EMOJI ANALYSIS
          </div>

          <h1>Emoji Explorer</h1>

          <p>
            Explore real emoji usage,
            sentiment and product-level
            patterns from your uploaded
            review dataset.
          </p>
        </div>

        <div className="emoji-file-name">
          <Database size={17} />

          {dataset.name ||
            "Uploaded Dataset"}
        </div>
      </div>

      {/* STAT CARDS */}

      <div className="emoji-stat-cards">

        <div className="emoji-dashboard-stat">
          <div className="emoji-dashboard-icon blue">
            <Smile size={22} />
          </div>

          <div>
            <span>Total Emojis</span>

            <strong>
              {emojiData.totalEmojis}
            </strong>
          </div>
        </div>

        <div className="emoji-dashboard-stat">
          <div className="emoji-dashboard-icon green">
            <MessageSquare size={22} />
          </div>

          <div>
            <span>
              Reviews With Emoji
            </span>

            <strong>
              {emojiData.reviewsWithEmoji}
            </strong>
          </div>
        </div>

        <div className="emoji-dashboard-stat">
          <div className="emoji-dashboard-icon orange">
            <Hash size={22} />
          </div>

          <div>
            <span>Unique Emojis</span>

            <strong>
              {emojiData.sorted.length}
            </strong>
          </div>
        </div>

        <div className="emoji-dashboard-stat">
          <div className="emoji-dashboard-icon purple">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>
              Avg Emojis / Review
            </span>

            <strong>
              {rows.length
                ? (
                    emojiData.totalEmojis /
                    rows.length
                  ).toFixed(2)
                : "0.00"}
            </strong>
          </div>
        </div>
      </div>

      {/* TOP EMOJIS */}

      <div className="emoji-chart-card">

        <div className="emoji-card-header">

          <div>
            <h2>Top Emoji Usage</h2>

            <p>
              Most frequently occurring
              emojis in the uploaded
              review dataset.
            </p>
          </div>

          <Smile size={22} />
        </div>

        {chartData.length > 0 ? (
          <div className="emoji-chart">

            <ResponsiveContainer
              width="100%"
              height={380}
            >
              <BarChart data={chartData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="emoji"
                  tick={{
                    fontSize: 20,
                  }}
                />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>
        ) : (
          <div className="emoji-no-data">
            <Smile size={25} />

            No emojis detected in this
            dataset.
          </div>
        )}
      </div>

      {/* SENTIMENT + TOP EMOJI DETAILS */}

      <div
        className="emoji-analysis-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "20px",
          marginTop: "20px",
        }}
      >

        {/* SENTIMENT */}

        <div className="emoji-chart-card">

          <div className="emoji-card-header">

            <div>
              <h2>
                Emoji Sentiment Breakdown
              </h2>

              <p>
                Sentiment classification based
                on the emojis detected in
                the uploaded reviews.
              </p>
            </div>

          </div>

          {sentimentData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <PieChart>

                <Pie
                  data={sentimentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {sentimentData.map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name ===
                          "Positive"
                            ? "#16a34a"
                            : entry.name ===
                              "Negative"
                            ? "#dc2626"
                            : "#64748b"
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="emoji-no-data">
              No emoji sentiment data
              available.
            </div>
          )}
        </div>

        {/* TOP EMOJI DETAILS */}

        <div className="emoji-chart-card">

          <div className="emoji-card-header">

            <div>
              <h2>Emoji Insights</h2>

              <p>
                Meaning and usage of the
                most frequent emojis.
              </p>
            </div>

          </div>

          {emojiData.sorted.length > 0 ? (
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {emojiData.sorted
                .slice(0, 10)
                .map(([emoji, count]) => (
                  <div
                    key={emoji}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      padding: "12px 4px",
                      borderBottom:
                        "1px solid var(--border-color, #e5e7eb)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "28px",
                        }}
                      >
                        {emoji}
                      </span>

                      <div>
                        <strong>
                          {
                            emojiData.meanings[
                              emoji
                            ]
                          }
                        </strong>

                        <div
                          style={{
                            fontSize: "12px",
                            opacity: 0.7,
                          }}
                        >
                          {getEmojiSentiment(
                            emoji
                          )}
                        </div>
                      </div>
                    </div>

                    <strong>
                      {count}
                    </strong>
                  </div>
                ))}
            </div>
          ) : (
            <div className="emoji-no-data">
              No emoji insights available.
            </div>
          )}
        </div>
      </div>

      {/* PRODUCT-WISE USAGE */}

      <div
        className="emoji-chart-card"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="emoji-card-header">

          <div>
            <h2>
              Product-wise Emoji Usage
            </h2>

            <p>
              Emoji usage across products in
              the uploaded review dataset.
            </p>
          </div>

          <Package size={22} />
        </div>

        {emojiData.productData.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={380}
          >
            <BarChart
              data={emojiData.productData.slice(
                0,
                15
              )}
              layout="vertical"
              margin={{
                left: 20,
                right: 20,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis type="number" />

              <YAxis
                type="category"
                dataKey="product"
                width={130}
                tick={{
                  fontSize: 12,
                }}
              />

              <Tooltip />

              <Bar
                dataKey="emojiCount"
                fill="#7c3aed"
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="emoji-no-data">
            No product-wise emoji data
            available.
          </div>
        )}
      </div>

      {/* EMOJI FREQUENCY + SEARCH */}

      <div className="emoji-explorer-card">

        <div className="emoji-card-header">

          <div>
            <h2>Emoji Frequency</h2>

            <p>
              Search and select an emoji
              to inspect associated reviews.
            </p>
          </div>

        </div>

        <div className="emoji-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search emoji..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

        {filteredEmojis.length > 0 ? (
          <div className="emoji-grid">

            {filteredEmojis.map(
              ([emoji, count]) => (
                <button
                  key={emoji}
                  className={
                    selectedEmoji === emoji
                      ? "emoji-item selected"
                      : "emoji-item"
                  }
                  onClick={() =>
                    setSelectedEmoji(
                      emoji
                    )
                  }
                >
                  <span className="emoji-symbol">
                    {emoji}
                  </span>

                  <span className="emoji-count">
                    {count}
                  </span>
                </button>
              )
            )}

          </div>
        ) : (
          <div className="emoji-no-data">
            No matching emojis found.
          </div>
        )}
      </div>

      {/* SELECTED EMOJI */}

      {selectedEmoji && (
        <div className="emoji-review-card">

          <div className="emoji-card-header">

            <div>
              <h2>
                Reviews containing{" "}
                <span className="selected-emoji-large">
                  {selectedEmoji}
                </span>
              </h2>

              <p>
                {selectedMeaning}
                {" • "}
                {getEmojiSentiment(
                  selectedEmoji
                )}
                {" • "}
                {emojiData.counts[
                  selectedEmoji
                ] || 0}{" "}
                occurrence(s)
              </p>
            </div>

          </div>

          {selectedReviews.length > 0 ? (
            <div className="emoji-review-list">

              {selectedReviews.map(
                (review, index) => (
                  <div
                    className="emoji-review-item"
                    key={index}
                  >
                    <MessageSquare
                      size={18}
                    />

                    <p>{review}</p>
                  </div>
                )
              )}

            </div>
          ) : (
            <p className="emoji-no-data">
              No review examples available.
            </p>
          )}
        </div>
      )}

      {/* STATUS */}

      <div className="emoji-nlp-notice">

        <AlertCircle size={21} />

        <div>

          <h3>
            Emoji Analysis Status
          </h3>

          <p>
            All emoji counts, sentiment
            breakdowns and product-wise
            usage shown above are calculated
            directly from the uploaded review
            dataset. Emoji meaning is based on
            the configured emoji interpretation
            dictionary.
          </p>

        </div>
      </div>
    </div>
  );
}

export default EmojiExplorer;