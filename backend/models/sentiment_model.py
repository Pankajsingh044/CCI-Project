import random
import emoji

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

# ============================================================
# LAZY LOAD REAL PRETRAINED SENTIMENT MODEL
# ============================================================
# IMPORTANT:
# The Hugging Face model is NOT loaded when FastAPI starts.
# It is loaded only when sentiment analysis is actually needed.
# This helps Render startup memory usage.

sentiment_pipeline = None


def get_sentiment_pipeline():
    """
    Load the real pretrained Hugging Face sentiment model
    only when it is actually required.
    """

    global sentiment_pipeline

    if sentiment_pipeline is None:
        from transformers import pipeline

        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )

    return sentiment_pipeline


# ============================================================
# EMOJI MEANINGS
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
# EMOJI EXTRACTION
# ============================================================

def extract_emojis(text):
    """
    Extract emojis present in the review.
    """

    emojis = []

    if text is None:
        return emojis

    text = str(text)

    for character in text:
        if character in emoji.EMOJI_DATA:
            emojis.append(character)

    return emojis


# ============================================================
# EMOJI TO TEXT
# ============================================================

def emoji_to_text(emojis):
    """
    Convert detected emojis into predefined meanings.
    """

    meanings = []

    for item in emojis:

        if item in EMOJI_MEANINGS:
            meanings.append(
                EMOJI_MEANINGS[item]
            )

    return meanings


# ============================================================
# SENTIMENT RESULT FORMAT
# ============================================================

def format_sentiment_result(
    model_name,
    result
):
    """
    Create a consistent sentiment response
    for all three analysis approaches.
    """

    return {
        "model": model_name,
        "label": result["label"],
        "score": round(
            float(result["score"]),
            4
        ),
        "confidence_percent": round(
            float(result["score"]) * 100,
            2
        )
    }


# ============================================================
# MODEL 1
# TEXT ONLY
# ============================================================

def analyze_text_only(text):

    pipeline_model = get_sentiment_pipeline()

    result = pipeline_model(
        text,
        truncation=True
    )[0]

    return format_sentiment_result(
        "Text Only",
        result
    )


# ============================================================
# MODEL 2
# TEXT + EMOJI
# ============================================================

def analyze_text_emoji(text):

    emojis = extract_emojis(text)

    emoji_meanings = emoji_to_text(
        emojis
    )

    # Remove emojis from original text
    clean_text = str(text)

    for item in emojis:

        clean_text = clean_text.replace(
            item,
            ""
        )

    # Add emoji meanings to the text
    combined_text = clean_text.strip()

    if emoji_meanings:

        combined_text += (
            " "
            + " ".join(emoji_meanings)
        )

    pipeline_model = get_sentiment_pipeline()

    result = pipeline_model(
        combined_text,
        truncation=True
    )[0]

    formatted_result = format_sentiment_result(
        "Text + Emoji",
        result
    )

    formatted_result["emojis"] = emojis

    formatted_result["emoji_meanings"] = (
        emoji_meanings
    )

    return formatted_result


# ============================================================
# MODEL 3
# TEXT + EMOJI + CONTEXT
# ============================================================

def analyze_text_emoji_context(
    text,
    brand=None,
    product=None,
    rating=None
):

    text = str(text)

    emojis = extract_emojis(text)

    emoji_meanings = emoji_to_text(
        emojis
    )

    # --------------------------------------------------------
    # BUILD CONTEXT
    # --------------------------------------------------------

    context_parts = []

    if brand:

        context_parts.append(
            f"Brand: {brand}"
        )

    if product:

        context_parts.append(
            f"Product: {product}"
        )

    if rating is not None:

        context_parts.append(
            f"User rating: {rating} out of 5"
        )

    if emoji_meanings:

        context_parts.append(
            "Emoji meaning: "
            + ", ".join(
                emoji_meanings
            )
        )

    context_text = " ".join(
        context_parts
    )

    # --------------------------------------------------------
    # BUILD FINAL NLP INPUT
    # --------------------------------------------------------

    combined_text = text.strip()

    if context_text:

        combined_text += (
            " "
            + context_text
        )

    pipeline_model = get_sentiment_pipeline()

    result = pipeline_model(
        combined_text,
        truncation=True
    )[0]

    formatted_result = format_sentiment_result(
        "Text + Emoji + Context",
        result
    )

    formatted_result["emojis"] = emojis

    formatted_result["emoji_meanings"] = (
        emoji_meanings
    )

    formatted_result["context"] = {
        "brand": brand,
        "product": product,
        "rating": rating
    }

    return formatted_result


# ============================================================
# RUN ALL THREE ANALYSIS APPROACHES
# ============================================================

def analyze_review(
    text,
    brand=None,
    product=None,
    rating=None
):

    model_1 = analyze_text_only(
        text
    )

    model_2 = analyze_text_emoji(
        text
    )

    model_3 = analyze_text_emoji_context(
        text,
        brand,
        product,
        rating
    )

    return {
        "model_1": model_1,
        "model_2": model_2,
        "model_3": model_3
    }


# ============================================================
# GROUND TRUTH NORMALIZATION
# ============================================================

def normalize_ground_truth(
    value,
    column_name=""
):
    """
    Convert dataset ground-truth values into:

    POSITIVE
    NEGATIVE

    Rating:
        1-2 -> NEGATIVE
        4-5 -> POSITIVE
        3   -> EXCLUDED
    """

    if value is None:
        return None

    text = str(value).strip().lower()

    if not text:
        return None

    positive_values = {
        "positive",
        "pos",
        "positive sentiment",
        "good",
        "great",
        "1"
    }

    negative_values = {
        "negative",
        "neg",
        "negative sentiment",
        "bad",
        "0"
    }

    column_lower = column_name.lower()

    if any(
        keyword in column_lower
        for keyword in [
            "sentiment",
            "label",
            "class",
            "target"
        ]
    ):

        if text in positive_values:
            return "POSITIVE"

        if text in negative_values:
            return "NEGATIVE"

    try:

        number = float(text)

    except ValueError:

        return None

    if 1 <= number <= 2:
        return "NEGATIVE"

    if 4 <= number <= 5:
        return "POSITIVE"

    return None


# ============================================================
# DATASET COLUMN DETECTION
# ============================================================

def find_dataset_column(
    columns,
    candidates
):
    """
    Find dataset column using exact
    and partial matching.
    """

    normalized_columns = {
        str(column).strip().lower(): column
        for column in columns
    }

    # Exact match
    for candidate in candidates:

        candidate_lower = (
            candidate.lower().strip()
        )

        if candidate_lower in normalized_columns:

            return normalized_columns[
                candidate_lower
            ]

    # Partial match
    for column in columns:

        column_lower = (
            str(column)
            .lower()
            .strip()
        )

        for candidate in candidates:

            if candidate.lower() in column_lower:

                return column

    return None


# ============================================================
# CONVERT MODEL PREDICTION TO BINARY LABEL
# ============================================================

def convert_prediction_to_label(
    result
):
    """
    Convert Hugging Face prediction into
    POSITIVE / NEGATIVE.
    """

    label = str(
        result["label"]
    ).upper()

    if "POSITIVE" in label:
        return "POSITIVE"

    if "NEGATIVE" in label:
        return "NEGATIVE"

    return None


# ============================================================
# CALCULATE BINARY METRICS
# ============================================================

def calculate_binary_metrics(
    actual,
    predicted
):
    """
    Calculate:

    Accuracy
    Precision
    Recall
    F1 Score
    Confusion Matrix
    """

    accuracy = accuracy_score(
        actual,
        predicted
    )

    precision = precision_score(
        actual,
        predicted,
        pos_label="POSITIVE",
        zero_division=0
    )

    recall = recall_score(
        actual,
        predicted,
        pos_label="POSITIVE",
        zero_division=0
    )

    f1 = f1_score(
        actual,
        predicted,
        pos_label="POSITIVE",
        zero_division=0
    )

    matrix = confusion_matrix(
        actual,
        predicted,
        labels=[
            "NEGATIVE",
            "POSITIVE"
        ]
    )

    return {

        "accuracy": round(
            float(accuracy) * 100,
            2
        ),

        "precision": round(
            float(precision) * 100,
            2
        ),

        "recall": round(
            float(recall) * 100,
            2
        ),

        "f1_score": round(
            float(f1) * 100,
            2
        ),

        "confusion_matrix": {

            "true_negative": int(
                matrix[0][0]
            ),

            "false_positive": int(
                matrix[0][1]
            ),

            "false_negative": int(
                matrix[1][0]
            ),

            "true_positive": int(
                matrix[1][1]
            )
        }
    }


# ============================================================
# EVALUATE UPLOADED DATASET
# ============================================================

def evaluate_uploaded_dataset(
    rows,
    columns,
    review_column=None,
    rating_column=None,
    label_column=None,
    brand_column=None,
    product_column=None,
    verified_column=None,
    helpful_column=None
):
    """
    Run CCI's three NLP models on an uploaded dataset.

    Model 1:
        Text Only

    Model 2:
        Text + Emoji

    Model 3:
        Text + Emoji + Context

    Maximum evaluation sample = 500 reviews.
    """

    # ========================================================
    # AUTOMATIC COLUMN DETECTION
    # ========================================================

    if not columns and rows:

        columns = list(
            rows[0].keys()
        )

    if not review_column:

        review_column = find_dataset_column(
            columns,
            [
                "review_text",
                "review-text",
                "review",
                "review_body",
                "review_content",
                "comment",
                "comments",
                "text",
                "content",
                "body",
                "feedback",
                "description"
            ]
        )

    if not rating_column:

        rating_column = find_dataset_column(
            columns,
            [
                "rating",
                "ratings",
                "stars",
                "star_rating",
                "score"
            ]
        )

    if not label_column:

        label_column = find_dataset_column(
            columns,
            [
                "sentiment",
                "sentiment_label",
                "label",
                "class",
                "target",
                "true_sentiment"
            ]
        )

    if not brand_column:

        brand_column = find_dataset_column(
            columns,
            [
                "brand",
                "manufacturer"
            ]
        )

    if not product_column:

        product_column = find_dataset_column(
            columns,
            [
                "product",
                "product_name",
                "productname",
                "model"
            ]
        )

    if not verified_column:

        verified_column = find_dataset_column(
            columns,
            [
                "verified_purchase",
                "verified purchase",
                "verified",
                "is_verified"
            ]
        )

    if not helpful_column:

        helpful_column = find_dataset_column(
            columns,
            [
                "helpful_vote",
                "helpful_votes",
                "helpful votes",
                "helpful",
                "votes"
            ]
        )

    # ========================================================
    # VALIDATION
    # ========================================================

    if not review_column:

        raise ValueError(
            "No review text column could be detected."
        )

    if not label_column and not rating_column:

        raise ValueError(
            "Precision, Recall and F1 require "
            "a ground-truth label or rating column."
        )

    # ========================================================
    # PREPARE VALID EVALUATION ROWS
    # ========================================================

    evaluation_rows = []

    for row in rows:

        review = row.get(
            review_column
        )

        if review is None:
            continue

        review = str(
            review
        ).strip()

        if not review:
            continue

        ground_truth_value = (
            row.get(label_column)
            if label_column
            else row.get(rating_column)
        )

        ground_truth = (
            normalize_ground_truth(
                ground_truth_value,
                label_column
                or rating_column
                or ""
            )
        )

        if ground_truth is None:
            continue

        evaluation_rows.append(
            {
                "row": row,
                "review": review,
                "actual": ground_truth
            }
        )

    # ========================================================
    # CHECK VALID RECORDS
    # ========================================================

    if not evaluation_rows:

        raise ValueError(
            "No valid positive/negative records were found. "
            "Use ratings 1-2 and 4-5, or a valid "
            "sentiment/label column."
        )

    # ========================================================
    # RANDOM 500-REVIEW SAMPLE
    # ========================================================

    SAMPLE_SIZE = 500

    original_evaluation_count = (
        len(evaluation_rows)
    )

    if len(evaluation_rows) > SAMPLE_SIZE:

        random.seed(42)

        evaluation_rows = random.sample(
            evaluation_rows,
            SAMPLE_SIZE
        )

        sampling_method = (
            "Random sample of 500 eligible reviews "
            "using random seed 42"
        )

    else:

        sampling_method = (
            "All eligible reviews used because "
            "dataset contains fewer than 500 eligible reviews"
        )

    # ========================================================
    # RUN THREE MODELS
    # ========================================================

    actual_labels = []

    model_1_predictions = []

    model_2_predictions = []

    model_3_predictions = []

    emoji_review_count = 0

    total_emoji_count = 0

    # ========================================================
    # PROCESS EACH SAMPLE REVIEW
    # ========================================================

    for item in evaluation_rows:

        row = item["row"]

        review = item["review"]

        actual_labels.append(
            item["actual"]
        )

        # ====================================================
        # MODEL 1
        # ====================================================

        result_1 = analyze_text_only(
            review
        )

        prediction_1 = (
            convert_prediction_to_label(
                result_1
            )
        )

        model_1_predictions.append(
            prediction_1
        )

        # ====================================================
        # MODEL 2
        # ====================================================

        result_2 = analyze_text_emoji(
            review
        )

        prediction_2 = (
            convert_prediction_to_label(
                result_2
            )
        )

        model_2_predictions.append(
            prediction_2
        )

        emojis = result_2.get(
            "emojis",
            []
        )

        if emojis:
            emoji_review_count += 1

        total_emoji_count += len(
            emojis
        )

        # ====================================================
        # MODEL 3
        # ====================================================

        brand = (
            row.get(brand_column)
            if brand_column
            else None
        )

        product = (
            row.get(product_column)
            if product_column
            else None
        )

        verified = (
            row.get(verified_column)
            if verified_column
            else None
        )

        helpful = (
            row.get(helpful_column)
            if helpful_column
            else None
        )

        context_text = review

        if brand:

            context_text += (
                f" Brand: {brand}"
            )

        if product:

            context_text += (
                f" Product: {product}"
            )

        if verified is not None:

            context_text += (
                f" Verified purchase: {verified}"
            )

        if helpful is not None:

            context_text += (
                f" Helpful votes: {helpful}"
            )

        # Rating is intentionally NOT passed
        # to prevent target leakage.

        result_3 = analyze_text_emoji_context(
            context_text,
            brand=brand,
            product=product,
            rating=None
        )

        prediction_3 = (
            convert_prediction_to_label(
                result_3
            )
        )

        model_3_predictions.append(
            prediction_3
        )

    # ========================================================
    # CALCULATE METRICS
    # ========================================================

    model_1_metrics = (
        calculate_binary_metrics(
            actual_labels,
            model_1_predictions
        )
    )

    model_2_metrics = (
        calculate_binary_metrics(
            actual_labels,
            model_2_predictions
        )
    )

    model_3_metrics = (
        calculate_binary_metrics(
            actual_labels,
            model_3_predictions
        )
    )

    # ========================================================
    # FINAL RESULT
    # ========================================================

    return {

        "dataset": {

            "total_uploaded_rows": len(
                rows
            ),

            "eligible_reviews_before_sampling":
                original_evaluation_count,

            "evaluation_reviews":
                len(evaluation_rows),

            "sample_size":
                len(evaluation_rows),

            "sampling_method":
                sampling_method,

            "review_column":
                review_column,

            "rating_column":
                rating_column,

            "label_column":
                label_column,

            "brand_column":
                brand_column,

            "product_column":
                product_column,

            "verified_column":
                verified_column,

            "helpful_column":
                helpful_column
        },

        "models": {

            "model_1": {

                "name":
                    "Text Only",

                "total_reviews":
                    len(evaluation_rows),

                **model_1_metrics
            },

            "model_2": {

                "name":
                    "Text + Emoji",

                "total_reviews":
                    len(evaluation_rows),

                **model_2_metrics
            },

            "model_3": {

                "name":
                    "Text + Emoji + Context",

                "total_reviews":
                    len(evaluation_rows),

                **model_3_metrics
            }
        },

        "emoji_statistics": {

            "reviews_with_emojis":
                emoji_review_count,

            "total_detected_emojis":
                total_emoji_count
        }
    }