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
  BarChart3,
  Activity,
  Trophy,
  Heart,
  Meh,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


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
// EMOJI MEANING + SENTIMENT MAP
// =====================================================

const emojiMeaningMap = {

  "😀": {
    meaning: "Happiness",
    sentiment: "Positive",
  },

  "😃": {
    meaning: "Joy",
    sentiment: "Positive",
  },

  "😄": {
    meaning: "Happiness",
    sentiment: "Positive",
  },

  "😁": {
    meaning: "Excitement",
    sentiment: "Positive",
  },

  "😆": {
    meaning: "Amusement",
    sentiment: "Positive",
  },

  "😅": {
    meaning: "Relief / nervous laughter",
    sentiment: "Neutral",
  },

  "😂": {
    meaning: "Laughter",
    sentiment: "Positive",
  },

  "🤣": {
    meaning: "Strong laughter",
    sentiment: "Positive",
  },

  "😊": {
    meaning: "Happiness",
    sentiment: "Positive",
  },

  "😇": {
    meaning: "Affection / innocence",
    sentiment: "Positive",
  },

  "🙂": {
    meaning: "Pleasure",
    sentiment: "Positive",
  },

  "🙃": {
    meaning: "Irony / mixed expression",
    sentiment: "Neutral",
  },

  "😉": {
    meaning: "Playfulness",
    sentiment: "Positive",
  },

  "😍": {
    meaning: "Love / admiration",
    sentiment: "Positive",
  },

  "🥰": {
    meaning: "Love / affection",
    sentiment: "Positive",
  },

  "😘": {
    meaning: "Affection",
    sentiment: "Positive",
  },

  "😋": {
    meaning: "Enjoyment",
    sentiment: "Positive",
  },

  "😎": {
    meaning: "Confidence",
    sentiment: "Positive",
  },

  "🤩": {
    meaning: "Excitement / admiration",
    sentiment: "Positive",
  },

  "🥳": {
    meaning: "Celebration",
    sentiment: "Positive",
  },

  "👍": {
    meaning: "Approval",
    sentiment: "Positive",
  },

  "👍🏻": {
    meaning: "Approval",
    sentiment: "Positive",
  },

  "👍🏼": {
    meaning: "Approval",
    sentiment: "Positive",
  },

  "👍🏽": {
    meaning: "Approval",
    sentiment: "Positive",
  },

  "👍🏾": {
    meaning: "Approval",
    sentiment: "Positive",
  },

  "👍🏿": {
    meaning: "Approval",
    sentiment: "Positive",
  },

  "❤️": {
    meaning: "Love / appreciation",
    sentiment: "Positive",
  },

  "❤": {
    meaning: "Love / appreciation",
    sentiment: "Positive",
  },

  "💕": {
    meaning: "Affection",
    sentiment: "Positive",
  },

  "💖": {
    meaning: "Love / admiration",
    sentiment: "Positive",
  },

  "💯": {
    meaning: "Strong approval",
    sentiment: "Positive",
  },

  "🔥": {
    meaning: "Excitement / strong approval",
    sentiment: "Positive",
  },

  "✨": {
    meaning: "Positivity / emphasis",
    sentiment: "Positive",
  },

  "⭐": {
    meaning: "Appreciation / quality",
    sentiment: "Positive",
  },

  "🌟": {
    meaning: "Admiration",
    sentiment: "Positive",
  },

  "👏": {
    meaning: "Appreciation",
    sentiment: "Positive",
  },

  "🙌": {
    meaning: "Celebration",
    sentiment: "Positive",
  },

  "💪": {
    meaning: "Strength / confidence",
    sentiment: "Positive",
  },

  "🎉": {
    meaning: "Celebration",
    sentiment: "Positive",
  },

  "😐": {
    meaning: "Neutral expression",
    sentiment: "Neutral",
  },

  "😑": {
    meaning: "Indifference",
    sentiment: "Neutral",
  },

  "🤔": {
    meaning: "Thinking / uncertainty",
    sentiment: "Neutral",
  },

  "😶": {
    meaning: "Speechlessness",
    sentiment: "Neutral",
  },

  "🙄": {
    meaning: "Annoyance / skepticism",
    sentiment: "Negative",
  },

  "😒": {
    meaning: "Displeasure",
    sentiment: "Negative",
  },

  "😞": {
    meaning: "Disappointment",
    sentiment: "Negative",
  },

  "😔": {
    meaning: "Sadness",
    sentiment: "Negative",
  },

  "😟": {
    meaning: "Worry",
    sentiment: "Negative",
  },

  "😕": {
    meaning: "Confusion / dissatisfaction",
    sentiment: "Negative",
  },

  "🙁": {
    meaning: "Sadness",
    sentiment: "Negative",
  },

  "☹️": {
    meaning: "Sadness",
    sentiment: "Negative",
  },

  "😣": {
    meaning: "Distress",
    sentiment: "Negative",
  },

  "😖": {
    meaning: "Frustration",
    sentiment: "Negative",
  },

  "😫": {
    meaning: "Exhaustion / frustration",
    sentiment: "Negative",
  },

  "😩": {
    meaning: "Frustration",
    sentiment: "Negative",
  },

  "🥺": {
    meaning: "Sadness / pleading",
    sentiment: "Negative",
  },

  "😢": {
    meaning: "Sadness",
    sentiment: "Negative",
  },

  "😭": {
    meaning: "Intense sadness",
    sentiment: "Negative",
  },

  "😡": {
    meaning: "Anger",
    sentiment: "Negative",
  },

  "😠": {
    meaning: "Anger",
    sentiment: "Negative",
  },

  "🤬": {
    meaning: "Strong anger",
    sentiment: "Negative",
  },

  "😤": {
    meaning: "Frustration / anger",
    sentiment: "Negative",
  },

  "😱": {
    meaning: "Fear / shock",
    sentiment: "Negative",
  },

  "🤮": {
    meaning: "Disgust",
    sentiment: "Negative",
  },

  "🤢": {
    meaning: "Disgust",
    sentiment: "Negative",
  },

  "💔": {
    meaning: "Heartbreak / disappointment",
    sentiment: "Negative",
  },

  "👎": {
    meaning: "Disapproval",
    sentiment: "Negative",
  },

  "👎🏻": {
    meaning: "Disapproval",
    sentiment: "Negative",
  },

  "👎🏼": {
    meaning: "Disapproval",
    sentiment: "Negative",
  },

  "👎🏽": {
    meaning: "Disapproval",
    sentiment: "Negative",
  },

  "👎🏾": {
    meaning: "Disapproval",
    sentiment: "Negative",
  },

  "👎🏿": {
    meaning: "Disapproval",
    sentiment: "Negative",
  },

  "💀": {
    meaning: "Intense reaction / expression",
    sentiment: "Neutral",
  },

};


// =====================================================
// GET EMOJI INFORMATION
// =====================================================

function getEmojiInfo(emoji) {

  return (
    emojiMeaningMap[emoji] || {
      meaning: "Emotion / expression",
      sentiment: "Neutral",
    }
  );

}


// =====================================================
// EMOJI EXPLORER
// =====================================================

function EmojiExplorer() {

  const [dataset, setDataset] = useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedEmoji, setSelectedEmoji] =
    useState(null);


  // =====================================================
  // LOAD DATASET FROM INDEXEDDB
  // =====================================================

  useEffect(() => {

    const loadDataset = async () => {

      try {

        const savedDataset =
          await getDataset();

        if (savedDataset) {

          setDataset(savedDataset);

        }

      } catch (error) {

        console.error(
          "Unable to load dataset",
          error
        );

      }

    };

    loadDataset();

  }, []);


  // =====================================================
  // NO DATASET
  // =====================================================

  if (!dataset) {

    return (

      <div className="emoji-page">

        <div className="page-eyebrow">
          CCI EMOJI ANALYSIS
        </div>

        <h1>
          Emoji Explorer
        </h1>

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
  // REVIEW DATA
  // =====================================================

  const rows =
    dataset.rows || [];

  const reviewColumn =
    dataset.reviewColumn;


  // =====================================================
  // EMOJI DATA
  // =====================================================

  const emojiData = useMemo(() => {

    const counts = {};

    const reviewExamples = {};

    let reviewsWithEmoji = 0;

    let totalEmojis = 0;


    if (
      reviewColumn &&
      reviewColumn !== "Not detected"
    ) {

      rows.forEach((row) => {

        const review =
          String(
            row[reviewColumn] || ""
          );


        const emojis =
          extractEmojis(review);


        if (emojis.length > 0) {

          reviewsWithEmoji++;

        }


        totalEmojis +=
          emojis.length;


        emojis.forEach((emoji) => {

          counts[emoji] =
            (counts[emoji] || 0) + 1;


          if (!reviewExamples[emoji]) {

            reviewExamples[emoji] = [];

          }


          if (
            reviewExamples[emoji].length < 5
          ) {

            reviewExamples[emoji].push(
              review
            );

          }

        });

      });

    }


    const sorted =
      Object.entries(counts)
        .sort(
          ([, a], [, b]) =>
            b - a
        );


    return {

      counts,

      sorted,

      reviewExamples,

      reviewsWithEmoji,

      totalEmojis,

    };

  }, [
    rows,
    reviewColumn,
  ]);


  // =====================================================
  // EMOJI INSIGHTS
  // =====================================================

  const emojiInsights = useMemo(() => {

    const uniqueEmojis =
      emojiData.sorted.length;

    const mostUsed =
      emojiData.sorted.length > 0
        ? emojiData.sorted[0]
        : null;

    const topFive =
      emojiData.sorted.slice(0, 5);

    const emojiUsagePercentage =
      rows.length > 0
        ? (
            (emojiData.reviewsWithEmoji /
              rows.length) *
            100
          ).toFixed(2)
        : "0.00";

    const averagePerEmojiReview =
      emojiData.reviewsWithEmoji > 0
        ? (
            emojiData.totalEmojis /
            emojiData.reviewsWithEmoji
          ).toFixed(2)
        : "0.00";

    return {

      uniqueEmojis,

      mostUsed,

      topFive,

      emojiUsagePercentage,

      averagePerEmojiReview,

    };

  }, [
    emojiData,
    rows.length,
  ]);


  // =====================================================
  // EMOJI SENTIMENT BREAKDOWN
  // =====================================================

  const emojiSentimentData = useMemo(() => {

    let positive = 0;

    let negative = 0;

    let neutral = 0;


    emojiData.sorted.forEach(
      ([emoji, count]) => {

        const info =
          getEmojiInfo(emoji);

        if (
          info.sentiment === "Positive"
        ) {

          positive += count;

        } else if (
          info.sentiment === "Negative"
        ) {

          negative += count;

        } else {

          neutral += count;

        }

      }
    );


    const total =
      positive +
      negative +
      neutral;


    const chartData = [
      {
        sentiment: "Positive",
        count: positive,
      },
      {
        sentiment: "Neutral",
        count: neutral,
      },
      {
        sentiment: "Negative",
        count: negative,
      },
    ];


    return {

      positive,

      negative,

      neutral,

      total,

      chartData,

    };

  }, [
    emojiData.sorted,
  ]);


  // =====================================================
  // DETAILED EMOJI INSIGHTS
  // =====================================================

  const detailedEmojiInsights = useMemo(() => {

    return emojiData.sorted
      .slice(0, 5)
      .map(
        ([emoji, count]) => {

          const info =
            getEmojiInfo(emoji);

          return {

            emoji,

            count,

            meaning:
              info.meaning,

            sentiment:
              info.sentiment,

          };

        }
      );

  }, [
    emojiData.sorted,
  ]);


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredEmojis =
    emojiData.sorted.filter(
      ([emoji]) =>
        emoji.includes(
          searchTerm
        )
    );


  // =====================================================
  // TOP CHART DATA
  // =====================================================

  const chartData =
    emojiData.sorted
      .slice(0, 15)
      .map(
        ([emoji, count]) => ({
          emoji,
          count,
        })
      );


  // =====================================================
  // SELECTED EMOJI REVIEWS
  // =====================================================

  const selectedReviews =
    selectedEmoji
      ? emojiData.reviewExamples[
          selectedEmoji
        ] || []
      : [];


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="emoji-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="emoji-page-header">

        <div>

          <div className="page-eyebrow">
            CCI EMOJI ANALYSIS
          </div>

          <h1>
            Emoji Explorer
          </h1>

          <p>
            Explore real emoji usage across
            your uploaded review dataset.
          </p>

        </div>


        <div className="emoji-file-name">

          <Database size={17} />

          {dataset.name}

        </div>

      </div>


      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="emoji-stat-cards">


        <div className="emoji-dashboard-stat">

          <div className="emoji-dashboard-icon blue">

            <Smile size={22} />

          </div>

          <div>

            <span>
              Total Emojis
            </span>

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

            <span>
              Unique Emojis
            </span>

            <strong>
              {emojiData.sorted.length}
            </strong>

          </div>

        </div>


        <div className="emoji-dashboard-stat">

          <div className="emoji-dashboard-icon purple">

            <Smile size={22} />

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


      {/* =================================================
          EMOJI SENTIMENT BREAKDOWN
      ================================================= */}

      <div className="emoji-sentiment-card">

        <div className="emoji-card-header">

          <div>

            <h2>
              Emoji Sentiment Breakdown
            </h2>

            <p>
              Sentiment classification based on
              the emojis detected in the
              uploaded reviews.
            </p>

          </div>

          <Activity size={22} />

        </div>


        {emojiSentimentData.total > 0 ? (

          <>

            <div
              className="emoji-sentiment-legend"
            >

              <div className="emoji-legend-item">

                <span className="emoji-legend-dot neutral"></span>

                <span>
                  Neutral
                </span>

                <strong>
                  {emojiSentimentData.neutral}
                </strong>

              </div>


              <div className="emoji-legend-item">

                <span className="emoji-legend-dot positive"></span>

                <span>
                  Positive
                </span>

                <strong>
                  {emojiSentimentData.positive}
                </strong>

              </div>


              <div className="emoji-legend-item">

                <span className="emoji-legend-dot negative"></span>

                <span>
                  Negative
                </span>

                <strong>
                  {emojiSentimentData.negative}
                </strong>

              </div>

            </div>


            <div className="emoji-sentiment-chart">

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <BarChart
                  data={
                    emojiSentimentData.chartData
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="sentiment"
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#2563eb"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </>

        ) : (

          <div className="emoji-no-data">

            <Smile size={25} />

            No emoji sentiment data
            available for this dataset.

          </div>

        )}

      </div>


      {/* =================================================
          EMOJI INSIGHTS
      ================================================= */}

      <div className="emoji-insights-card">

        <div className="emoji-card-header">

          <div>

            <h2>
              Emoji Insights
            </h2>

            <p>
              Meaning and usage of the most
              frequent emojis.
            </p>

          </div>

          <TrendingUp size={22} />

        </div>


        {detailedEmojiInsights.length > 0 ? (

          <div className="emoji-insights-list">

            {detailedEmojiInsights.map(
              (item) => (

                <div
                  className="emoji-insight-row"
                  key={item.emoji}
                >

                  <div className="emoji-insight-main">

                    <div className="emoji-insight-symbol">

                      {item.emoji}

                    </div>

                    <div>

                      <strong>
                        {item.meaning}
                      </strong>

                      <span>
                        {item.sentiment}
                      </span>

                    </div>

                  </div>


                  <div className="emoji-insight-count">

                    <strong>
                      {item.count}
                    </strong>

                    <span>
                      occurrences
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        ) : (

          <div className="emoji-no-data">

            <Smile size={25} />

            No emoji insights available.

          </div>

        )}

      </div>


      {/* =================================================
          EMOJI USAGE SUMMARY
      ================================================= */}

      <div className="emoji-insight-summary">

        <div className="emoji-summary-item">

          <div className="emoji-summary-icon blue">

            <Trophy size={19} />

          </div>

          <div>

            <span>
              Most Used Emoji
            </span>

            <strong>

              {emojiInsights.mostUsed
                ? emojiInsights.mostUsed[0]
                : "—"}

            </strong>

            {emojiInsights.mostUsed && (

              <small>

                {emojiInsights.mostUsed[1]}
                {" "}occurrences

              </small>

            )}

          </div>

        </div>


        <div className="emoji-summary-item">

          <div className="emoji-summary-icon green">

            <Activity size={19} />

          </div>

          <div>

            <span>
              Emoji Usage
            </span>

            <strong>
              {emojiInsights.emojiUsagePercentage}%
            </strong>

            <small>
              of reviews contain emojis
            </small>

          </div>

        </div>


        <div className="emoji-summary-item">

          <div className="emoji-summary-icon orange">

            <BarChart3 size={19} />

          </div>

          <div>

            <span>
              Avg Per Emoji Review
            </span>

            <strong>
              {emojiInsights.averagePerEmojiReview}
            </strong>

            <small>
              emojis per emoji review
            </small>

          </div>

        </div>


        <div className="emoji-summary-item">

          <div className="emoji-summary-icon purple">

            <Smile size={19} />

          </div>

          <div>

            <span>
              Unique Emojis
            </span>

            <strong>
              {emojiInsights.uniqueEmojis}
            </strong>

            <small>
              distinct emojis
            </small>

          </div>

        </div>

      </div>


      {/* =================================================
          CHART
      ================================================= */}

      <div className="emoji-chart-card">

        <div className="emoji-card-header">

          <div>

            <h2>
              Top Emoji Usage
            </h2>

            <p>
              Most frequently occurring emojis
              in the review dataset.
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

              <BarChart
                data={chartData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="emoji"
                  tick={{ fontSize: 20 }}
                />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        ) : (

          <div className="emoji-no-data">

            <Smile size={25} />

            No emojis detected in this dataset.

          </div>

        )}

      </div>


      {/* =================================================
          EMOJI LIST + SEARCH
      ================================================= */}

      <div className="emoji-explorer-card">

        <div className="emoji-card-header">

          <div>

            <h2>
              Emoji Frequency
            </h2>

            <p>
              Search and select an emoji
              to inspect associated reviews.
            </p>

          </div>

        </div>


        {/* SEARCH */}

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


        {/* EMOJI GRID */}

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


      {/* =================================================
          SELECTED EMOJI REVIEWS
      ================================================= */}

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
                Example reviews extracted
                from the uploaded dataset.
              </p>

            </div>

          </div>


          {selectedReviews.length > 0 ? (

            <div className="emoji-review-list">

              {selectedReviews.map(
                (
                  review,
                  index
                ) => (

                  <div
                    className="emoji-review-item"
                    key={index}
                  >

                    <MessageSquare
                      size={18}
                    />

                    <p>
                      {review}
                    </p>

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


      {/* =================================================
          NLP NOTICE
      ================================================= */}

      <div className="emoji-nlp-notice">

        <AlertCircle size={21} />

        <div>

          <h3>
            NLP Analysis Status
          </h3>

          <p>
            Emoji frequency and usage are
            calculated directly from the uploaded
            dataset. Emoji emotion, sarcasm,
            contextual meaning and sentiment
            interpretation will be generated after
            the NLP backend is connected.
          </p>

        </div>

      </div>


    </div>

  );

}


export default EmojiExplorer;