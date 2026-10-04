import pandas as pd
import emoji

from transformers import pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)


# ============================================================
# 1. LOAD SENTIMENT MODEL
# ============================================================

print("Loading sentiment model...")

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

print("Model loaded successfully.")


# ============================================================
# 2. EMOJI MEANINGS
# ============================================================

EMOJI_MEANINGS = {
    "😀": "happy",
    "😃": "happy",
    "😄": "happy",
    "😁": "happy",
    "😊": "happy",
    "😍": "love",
    "🥰": "love",
    "❤️": "love",
    "👍": "positive",
    "👏": "positive",
    "🔥": "excellent",
    "⭐": "excellent",
    "🌟": "excellent",

    "😢": "sad",
    "😭": "very sad",
    "😞": "disappointed",
    "😔": "sad",

    "😡": "angry",
    "😠": "angry",
    "🤬": "angry",

    "👎": "negative",
    "💔": "negative",

    "😂": "laughing",
    "🤣": "laughing",

    "😐": "neutral",
    "😑": "neutral",

    "🤔": "uncertain",
    "🙄": "annoyed"
}


# ============================================================
# 3. EMOJI EXTRACTION
# ============================================================

def extract_emojis(text):
    """
    Extract emojis from review text.
    """

    if pd.isna(text):
        return []

    text = str(text)

    emojis = []

    for character in text:
        if character in emoji.EMOJI_DATA:
            emojis.append(character)

    return emojis


# ============================================================
# 4. CONVERT EMOJIS INTO MEANING
# ============================================================

def emoji_to_text(emojis):
    """
    Convert detected emojis into simple semantic words.
    """

    meanings = []

    for item in emojis:

        if item in EMOJI_MEANINGS:
            meanings.append(
                EMOJI_MEANINGS[item]
            )

    return meanings


# ============================================================
# 5. LOAD DATASET
# ============================================================

DATASET_PATH = (
    "datasets/amazon_sentiment_evaluation.csv"
)

print("\nLoading dataset...")

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully.")
print("Total reviews:", len(df))


# ============================================================
# 6. CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "review_id",
    "rating",
    "review_text",
    "product_id",
    "verified_purchase",
    "helpful_vote",
    "true_sentiment"
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:

    print("\nERROR:")
    print("Missing columns:")

    for column in missing_columns:
        print("-", column)

    raise ValueError(
        "Required columns are missing from dataset."
    )


# ============================================================
# 7. STORAGE FOR RESULTS
# ============================================================

y_true = []
y_pred = []

prediction_records = []

total_emojis = 0
reviews_with_emojis = 0


# ============================================================
# 8. MODEL 3 ANALYSIS
# ============================================================

print("\nStarting Model 3 evaluation...")
print(
    "Text + Emoji + Product ID + Review Metadata"
)

print(
    "\nIMPORTANT:"
)

print(
    "Rating is NOT used as model input because "
    "true_sentiment is derived from rating."
)

print(
    "This prevents target leakage."
)


for index, row in df.iterrows():

    # --------------------------------------------------------
    # REVIEW TEXT
    # --------------------------------------------------------

    review_text = row["review_text"]

    if pd.isna(review_text):
        review_text = ""

    review_text = str(review_text)


    # --------------------------------------------------------
    # EMOJI INFORMATION
    # --------------------------------------------------------

    emojis = extract_emojis(review_text)

    emoji_meanings = emoji_to_text(emojis)

    if len(emojis) > 0:
        reviews_with_emojis += 1

    total_emojis += len(emojis)


    # --------------------------------------------------------
    # REMOVE EMOJIS FROM ORIGINAL TEXT
    # --------------------------------------------------------

    clean_text = review_text

    for item in emojis:

        clean_text = clean_text.replace(
            item,
            ""
        )


    clean_text = clean_text.strip()


    # --------------------------------------------------------
    # ADD EMOJI MEANINGS
    # --------------------------------------------------------

    emoji_context = ""

    if emoji_meanings:

        emoji_context = (
            " Emoji meaning: "
            + ", ".join(emoji_meanings)
            + "."
        )


    # --------------------------------------------------------
    # PRODUCT CONTEXT
    # --------------------------------------------------------

    product_id = row["product_id"]

    if pd.isna(product_id):
        product_id = "Unknown"

    product_id = str(product_id)


    # --------------------------------------------------------
    # VERIFIED PURCHASE CONTEXT
    # --------------------------------------------------------

    verified_purchase = row["verified_purchase"]

    if pd.isna(verified_purchase):
        verified_purchase = "Unknown"

    verified_purchase = str(
        verified_purchase
    )


    # --------------------------------------------------------
    # HELPFUL VOTE CONTEXT
    # --------------------------------------------------------

    helpful_vote = row["helpful_vote"]

    if pd.isna(helpful_vote):
        helpful_vote = 0


    # --------------------------------------------------------
    # MODEL 3 CONTEXT
    #
    # Rating is intentionally NOT included.
    # --------------------------------------------------------

    context_information = (
        f"Product ID: {product_id}. "
        f"Verified purchase: {verified_purchase}. "
        f"Helpful votes: {helpful_vote}."
    )


    # --------------------------------------------------------
    # FINAL MODEL 3 INPUT
    # --------------------------------------------------------

    combined_text = (
        clean_text
        + emoji_context
        + " "
        + context_information
    )


    # --------------------------------------------------------
    # SENTIMENT PREDICTION
    # --------------------------------------------------------

    result = sentiment_pipeline(
        combined_text,
        truncation=True
    )[0]


    predicted_label = result["label"]

    confidence = float(
        result["score"]
    )


    # --------------------------------------------------------
    # TRUE LABEL
    # --------------------------------------------------------

    true_label = row["true_sentiment"]


    # --------------------------------------------------------
    # STORE RESULTS
    # --------------------------------------------------------

    y_true.append(true_label)

    y_pred.append(predicted_label)


    prediction_records.append({

        "review_id":
            row["review_id"],

        "rating":
            row["rating"],

        "review_text":
            review_text,

        "product_id":
            product_id,

        "verified_purchase":
            verified_purchase,

        "helpful_vote":
            helpful_vote,

        "detected_emojis":
            ", ".join(emojis),

        "emoji_meanings":
            ", ".join(emoji_meanings),

        "true_sentiment":
            true_label,

        "predicted_sentiment":
            predicted_label,

        "confidence":
            round(confidence, 4)
    })


    # --------------------------------------------------------
    # PROGRESS
    # --------------------------------------------------------

    if (index + 1) % 500 == 0:

        print(
            f"Processed {index + 1} / {len(df)} reviews"
        )


# ============================================================
# 9. CALCULATE METRICS
# ============================================================

accuracy = accuracy_score(
    y_true,
    y_pred
)

precision = precision_score(
    y_true,
    y_pred,
    pos_label="POSITIVE",
    zero_division=0
)

recall = recall_score(
    y_true,
    y_pred,
    pos_label="POSITIVE",
    zero_division=0
)

f1 = f1_score(
    y_true,
    y_pred,
    pos_label="POSITIVE",
    zero_division=0
)


# ============================================================
# 10. CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    y_true,
    y_pred,
    labels=[
        "NEGATIVE",
        "POSITIVE"
    ]
)


# ============================================================
# 11. PRINT RESULTS
# ============================================================

print("\n")
print("=" * 60)
print("MODEL 3 EVALUATION RESULTS")
print("=" * 60)

print(
    "\nModel:"
)

print(
    "Text + Emoji + Product ID + Review Metadata"
)

print(
    "\nTotal Reviews:",
    len(df)
)

print(
    "\nAccuracy:",
    round(accuracy * 100, 2),
    "%"
)

print(
    "Precision:",
    round(precision * 100, 2),
    "%"
)

print(
    "Recall:",
    round(recall * 100, 2),
    "%"
)

print(
    "F1 Score:",
    round(f1 * 100, 2),
    "%"
)


# ============================================================
# 12. EMOJI STATISTICS
# ============================================================

print("\n")
print("=" * 60)
print("EMOJI STATISTICS")
print("=" * 60)

print(
    "\nReviews containing emojis:",
    reviews_with_emojis
)

print(
    "Total detected emojis:",
    total_emojis
)


# ============================================================
# 13. CONFUSION MATRIX
# ============================================================

print("\n")
print("=" * 60)
print("CONFUSION MATRIX")
print("=" * 60)

print(
    "\n                 Predicted NEGATIVE    "
    "Predicted POSITIVE"
)

print(
    "Actual NEGATIVE       ",
    cm[0][0],
    "                 ",
    cm[0][1]
)

print(
    "Actual POSITIVE       ",
    cm[1][0],
    "                ",
    cm[1][1]
)


# ============================================================
# 14. CLASSIFICATION REPORT
# ============================================================

print("\n")
print("=" * 60)
print("CLASSIFICATION REPORT")
print("=" * 60)

print(
    classification_report(
        y_true,
        y_pred,
        labels=[
            "NEGATIVE",
            "POSITIVE"
        ],
        zero_division=0
    )
)


# ============================================================
# 15. SAVE PREDICTIONS
# ============================================================

output_path = (
    "datasets/model_3_predictions.csv"
)

results_df = pd.DataFrame(
    prediction_records
)

results_df.to_csv(
    output_path,
    index=False
)


# ============================================================
# 16. FINAL MESSAGE
# ============================================================

print("\n")
print("=" * 60)

print(
    "Model 3 evaluation completed successfully."
)

print(
    "Predictions saved to:"
)

print(
    output_path
)

print("=" * 60)