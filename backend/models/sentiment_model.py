import random
import re
import emoji

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)


# ============================================================
# LIGHTWEIGHT SENTIMENT NLP ENGINE
# ============================================================
# Render Free friendly:
# No Transformers
# No PyTorch
# No large ML model
# ============================================================


POSITIVE_WORDS = {
    "amazing": 3,
    "awesome": 3,
    "excellent": 3,
    "fantastic": 3,
    "perfect": 3,
    "wonderful": 3,
    "brilliant": 3,
    "love": 3,
    "loved": 3,
    "best": 3,
    "great": 2,
    "good": 2,
    "nice": 2,
    "happy": 2,
    "satisfied": 2,
    "satisfaction": 2,
    "recommend": 2,
    "recommended": 2,
    "useful": 2,
    "helpful": 2,
    "fast": 2,
    "smooth": 2,
    "easy": 2,
    "comfortable": 2,
    "quality": 2,
    "worth": 2,
    "value": 2,
    "impressive": 2,
    "impressed": 2,
    "enjoy": 2,
    "enjoyed": 2,
    "like": 2,
    "liked": 2,
    "reliable": 2,
    "clear": 1,
    "quick": 1,
    "beautiful": 2,
    "powerful": 2,
    "convenient": 2,
    "durable": 2,
    "premium": 2,
    "super": 2,
    "worthwhile": 2,
    "working": 1,
    "works": 1,
    "win": 1,
    "winner": 2
}


NEGATIVE_WORDS = {
    "bad": 3,
    "worst": 3,
    "terrible": 3,
    "horrible": 3,
    "awful": 3,
    "hate": 3,
    "hated": 3,
    "disappointed": 3,
    "disappointing": 3,
    "poor": 2,
    "useless": 3,
    "waste": 3,
    "broken": 3,
    "failure": 3,
    "failed": 3,
    "fail": 3,
    "problem": 2,
    "problems": 2,
    "issue": 2,
    "issues": 2,
    "slow": 2,
    "lag": 2,
    "laggy": 2,
    "expensive": 2,
    "cheap": 1,
    "difficult": 2,
    "hard": 1,
    "uncomfortable": 2,
    "unreliable": 2,
    "damage": 3,
    "damaged": 3,
    "defective": 3,
    "defect": 3,
    "return": 2,
    "returned": 2,
    "refund": 2,
    "complaint": 2,
    "complaints": 2,
    "annoying": 2,
    "annoyed": 2,
    "angry": 3,
    "sad": 2,
    "regret": 2,
    "regretted": 2,
    "missing": 2,
    "crash": 3,
    "crashed": 3,
    "overheating": 3,
    "overheat": 3,
    "noise": 2,
    "noisy": 2
}


NEGATION_WORDS = {
    "not",
    "no",
    "never",
    "neither",
    "nor",
    "hardly",
    "dont",
    "don't",
    "isnt",
    "isn't",
    "wasnt",
    "wasn't",
    "cant",
    "can't",
    "couldnt",
    "couldn't",
    "wont",
    "won't"
}


INTENSIFIERS = {
    "very": 1.4,
    "really": 1.3,
    "extremely": 1.6,
    "absolutely": 1.6,
    "so": 1.2,
    "too": 1.2,
    "highly": 1.4,
    "super": 1.4
}


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
# LIGHTWEIGHT SENTIMENT ANALYSIS
# ============================================================

def lightweight_sentiment(text):
    """
    Lightweight sentiment engine.

    Returns:
        label
        score
    """

    if text is None:
        text = ""

    text = str(text).strip()

    if not text:

        return {
            "label": "NEUTRAL",
            "score": 0.50
        }

    lowered = text.lower()

    words = re.findall(
        r"[a-zA-Z]+(?:'[a-zA-Z]+)?",
        lowered
    )

    positive_score = 0.0
    negative_score = 0.0

    # --------------------------------------------------------
    # WORD SENTIMENT
    # --------------------------------------------------------

    for index, word in enumerate(words):

        word_clean = word.lower()

        multiplier = 1.0

        previous_words = words[
            max(0, index - 3):index
        ]

        negated = any(
            previous in NEGATION_WORDS
            for previous in previous_words
        )

        for previous in previous_words:

            if previous in INTENSIFIERS:

                multiplier *= INTENSIFIERS[
                    previous
                ]

        if word_clean in POSITIVE_WORDS:

            value = (
                POSITIVE_WORDS[word_clean]
                * multiplier
            )

            if negated:
                negative_score += (
                    value * 0.85
                )
            else:
                positive_score += value

        elif word_clean in NEGATIVE_WORDS:

            value = (
                NEGATIVE_WORDS[word_clean]
                * multiplier
            )

            if negated:
                positive_score += (
                    value * 0.85
                )
            else:
                negative_score += value

    # --------------------------------------------------------
    # EMOJI SENTIMENT
    # --------------------------------------------------------

    detected_emojis = extract_emojis(
        text
    )

    for item in detected_emojis:

        meaning = EMOJI_MEANINGS.get(
            item,
            ""
        )

        if meaning in {
            "happy",
            "love",
            "positive",
            "excellent",
            "laughing"
        }:

            positive_score += 2

        elif meaning in {
            "sad",
            "very sad",
            "disappointed",
            "angry",
            "negative",
            "annoyed"
        }:

            negative_score += 2

    # --------------------------------------------------------
    # EXCLAMATION EMPHASIS
    # --------------------------------------------------------

    exclamation_count = text.count("!")

    if exclamation_count >= 2:

        if positive_score > negative_score:
            positive_score += 0.5

        elif negative_score > positive_score:
            negative_score += 0.5

    # --------------------------------------------------------
    # DETERMINE SENTIMENT
    # --------------------------------------------------------

    total_score = (
        positive_score
        + negative_score
    )

    if total_score == 0:

        return {
            "label": "NEUTRAL",
            "score": 0.50
        }

    if positive_score > negative_score:

        difference = (
            positive_score
            - negative_score
        )

        confidence = (
            0.55
            + min(
                0.44,
                difference
                / max(total_score, 1)
                * 0.44
            )
        )

        return {
            "label": "POSITIVE",
            "score": min(
                0.99,
                round(
                    confidence,
                    4
                )
            )
        }

    if negative_score > positive_score:

        difference = (
            negative_score
            - positive_score
        )

        confidence = (
            0.55
            + min(
                0.44,
                difference
                / max(total_score, 1)
                * 0.44
            )
        )

        return {
            "label": "NEGATIVE",
            "score": min(
                0.99,
                round(
                    confidence,
                    4
                )
            )
        }

    return {
        "label": "NEUTRAL",
        "score": 0.50
    }


# ============================================================
# SENTIMENT RESULT FORMAT
# ============================================================

def format_sentiment_result(
    model_name,
    result
):
    """
    Create consistent sentiment response.
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

    result = lightweight_sentiment(
        text
    )

    return format_sentiment_result(
        "Text Only",
        result
    )


# ============================================================
# MODEL 2
# TEXT + EMOJI
# ============================================================

def analyze_text_emoji(text):

    emojis = extract_emojis(
        text
    )

    emoji_meanings = emoji_to_text(
        emojis
    )

    clean_text = str(
        text if text is not None else ""
    )

    for item in emojis:

        clean_text = clean_text.replace(
            item,
            ""
        )

    combined_text = (
        clean_text.strip()
    )

    if emoji_meanings:

        combined_text += (
            " "
            + " ".join(
                emoji_meanings
            )
        )

    result = lightweight_sentiment(
        combined_text
    )

    formatted_result = (
        format_sentiment_result(
            "Text + Emoji",
            result
        )
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

    text = str(
        text if text is not None else ""
    )

    emojis = extract_emojis(
        text
    )

    emoji_meanings = emoji_to_text(
        emojis
    )

    context_parts = []

    if brand is not None:

        brand_text = str(
            brand
        ).strip()

        if brand_text:
            context_parts.append(
                f"Brand: {brand_text}"
            )

    if product is not None:

        product_text = str(
            product
        ).strip()

        if product_text:
            context_parts.append(
                f"Product: {product_text}"
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

    combined_text = text.strip()

    if context_text:

        combined_text += (
            " "
            + context_text
        )

    result = lightweight_sentiment(
        combined_text
    )

    formatted_result = (
        format_sentiment_result(
            "Text + Emoji + Context",
            result
        )
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
    Convert dataset ground truth into:

    POSITIVE
    NEGATIVE

    Rating:
        1-2 -> NEGATIVE
        4-5 -> POSITIVE
        3   -> EXCLUDED
    """

    if value is None:
        return None

    text = str(
        value
    ).strip().lower()

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

    column_lower = str(
        column_name
        if column_name is not None
        else ""
    ).lower()

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

        number = float(
            text
        )

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

    if not columns:
        return None

    normalized_columns = {
        str(column).strip().lower(): column
        for column in columns
        if column is not None
    }

    # Exact match
    for candidate in candidates:

        candidate_lower = (
            str(candidate)
            .lower()
            .strip()
        )

        if candidate_lower in normalized_columns:

            return normalized_columns[
                candidate_lower
            ]

    # Partial match
    for column in columns:

        if column is None:
            continue

        column_lower = (
            str(column)
            .lower()
            .strip()
        )

        for candidate in candidates:

            candidate_lower = (
                str(candidate)
                .lower()
                .strip()
            )

            if candidate_lower in column_lower:

                return column

    return None


# ============================================================
# CONVERT MODEL PREDICTION TO BINARY LABEL
# ============================================================

def convert_prediction_to_label(
    result
):
    """
    Convert prediction into:

    POSITIVE
    NEGATIVE

    NEUTRAL predictions return None.
    """

    if not isinstance(
        result,
        dict
    ):
        return None

    label = result.get(
        "label"
    )

    if label is None:
        return None

    label = str(
        label
    ).upper().strip()

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
    Calculate binary classification metrics safely.

    Neutral/invalid predictions are excluded from
    binary POSITIVE/NEGATIVE evaluation.
    """

    valid_actual = []
    valid_predicted = []

    for actual_value, predicted_value in zip(
        actual,
        predicted
    ):

        if actual_value not in {
            "POSITIVE",
            "NEGATIVE"
        }:
            continue

        if predicted_value not in {
            "POSITIVE",
            "NEGATIVE"
        }:
            continue

        valid_actual.append(
            actual_value
        )

        valid_predicted.append(
            predicted_value
        )

    # --------------------------------------------------------
    # No valid predictions
    # --------------------------------------------------------

    if not valid_actual:

        return {
            "accuracy": 0,
            "precision": 0,
            "recall": 0,
            "f1_score": 0,
            "evaluated_reviews": 0,
            "confusion_matrix": {
                "true_negative": 0,
                "false_positive": 0,
                "false_negative": 0,
                "true_positive": 0
            }
        }

    # --------------------------------------------------------
    # Calculate metrics
    # --------------------------------------------------------

    accuracy = accuracy_score(
        valid_actual,
        valid_predicted
    )

    precision = precision_score(
        valid_actual,
        valid_predicted,
        pos_label="POSITIVE",
        zero_division=0
    )

    recall = recall_score(
        valid_actual,
        valid_predicted,
        pos_label="POSITIVE",
        zero_division=0
    )

    f1 = f1_score(
        valid_actual,
        valid_predicted,
        pos_label="POSITIVE",
        zero_division=0
    )

    matrix = confusion_matrix(
        valid_actual,
        valid_predicted,
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

        "evaluated_reviews": len(
            valid_actual
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
    Run CCI's three NLP analysis approaches
    on an uploaded dataset.

    Maximum evaluation sample = 500 reviews.
    """

    # ========================================================
    # SAFETY CHECKS
    # ========================================================

    if rows is None:
        rows = []

    if columns is None:
        columns = []

    # Remove invalid column names
    columns = [
        column
        for column in columns
        if column is not None
    ]

    # If columns are missing, detect them from rows
    if not columns and rows:

        columns = list(
            rows[0].keys()
        )

    # ========================================================
    # AUTOMATIC COLUMN DETECTION
    # ========================================================

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

        if not isinstance(
            row,
            dict
        ):
            continue

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

        if label_column:

            ground_truth_value = row.get(
                label_column
            )

        else:

            ground_truth_value = row.get(
                rating_column
            )

        ground_truth = normalize_ground_truth(
            ground_truth_value,
            label_column
            or rating_column
            or ""
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
    # RANDOM SAMPLE
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
    # MODEL STORAGE
    # ========================================================

    actual_labels = []

    model_1_predictions = []

    model_2_predictions = []

    model_3_predictions = []

    emoji_review_count = 0

    total_emoji_count = 0

    # ========================================================
    # PROCESS EACH REVIEW
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

        if brand is not None:

            brand_text = str(
                brand
            ).strip()

            if brand_text:

                context_text += (
                    f" Brand: {brand_text}"
                )

        if product is not None:

            product_text = str(
                product
            ).strip()

            if product_text:

                context_text += (
                    f" Product: {product_text}"
                )

        if verified is not None:

            context_text += (
                f" Verified purchase: {verified}"
            )

        if helpful is not None:

            context_text += (
                f" Helpful votes: {helpful}"
            )

        # IMPORTANT:
        # Rating is NOT passed to Model 3.
        # This prevents target leakage.

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