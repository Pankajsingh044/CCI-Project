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


INPUT_FILE = "amazon_sentiment_evaluation.csv"
OUTPUT_FILE = "model_2_predictions.csv"


print("========================================")
print("CCI - MODEL 2 EVALUATION")
print("Text + Emoji")
print("========================================")
print()


# ----------------------------------------
# 1. Load the SAME evaluation dataset
# ----------------------------------------

print("Loading evaluation dataset...")

df = pd.read_csv(INPUT_FILE)

print("Total evaluation reviews:", len(df))
print()


# ----------------------------------------
# 2. Emoji meanings
# ----------------------------------------

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


# ----------------------------------------
# 3. Extract emojis
# ----------------------------------------

def extract_emojis(text):

    found = []

    for character in text:

        if character in emoji.EMOJI_DATA:

            found.append(character)

    return found


# ----------------------------------------
# 4. Convert emojis to meaning
# ----------------------------------------

def emoji_to_text(emojis):

    meanings = []

    for item in emojis:

        if item in EMOJI_MEANINGS:

            meanings.append(
                EMOJI_MEANINGS[item]
            )

    return meanings


# ----------------------------------------
# 5. Load same pretrained model
# ----------------------------------------

print("Loading DistilBERT sentiment model...")
print()

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)


# ----------------------------------------
# 6. Run Model 2
# ----------------------------------------

predictions = []

emoji_counts = []

emoji_examples = []

print("Running Model 2...")
print("Text + Emoji")
print()


for i, text in enumerate(
    df["review_text"].astype(str)
):

    # Extract emojis
    emojis = extract_emojis(text)

    # Convert emojis into semantic words
    meanings = emoji_to_text(emojis)

    # Remove emojis from original text
    clean_text = text

    for item in emojis:

        clean_text = clean_text.replace(
            item,
            ""
        )

    clean_text = clean_text.strip()

    # Add emoji meanings to text
    if meanings:

        combined_text = (
            clean_text
            + " "
            + " ".join(meanings)
        )

    else:

        combined_text = clean_text


    # Run sentiment model
    result = sentiment_pipeline(
        combined_text,
        truncation=True
    )[0]

    predictions.append(
        result["label"]
    )

    emoji_counts.append(
        len(emojis)
    )

    emoji_examples.append(
        ", ".join(emojis)
    )


    # Progress
    if (i + 1) % 100 == 0:

        print(
            f"Processed {i + 1}/{len(df)} reviews"
        )


# ----------------------------------------
# 7. Add results to dataframe
# ----------------------------------------

df["predicted_sentiment"] = predictions

df["emoji_count"] = emoji_counts

df["detected_emojis"] = emoji_examples


# ----------------------------------------
# 8. Calculate metrics
# ----------------------------------------

y_true = df["true_sentiment"]

y_pred = df["predicted_sentiment"]


accuracy = accuracy_score(
    y_true,
    y_pred
)

precision = precision_score(
    y_true,
    y_pred,
    pos_label="POSITIVE"
)

recall = recall_score(
    y_true,
    y_pred,
    pos_label="POSITIVE"
)

f1 = f1_score(
    y_true,
    y_pred,
    pos_label="POSITIVE"
)


# ----------------------------------------
# 9. Confusion Matrix
# ----------------------------------------

cm = confusion_matrix(
    y_true,
    y_pred,
    labels=[
        "NEGATIVE",
        "POSITIVE"
    ]
)


# ----------------------------------------
# 10. Display results
# ----------------------------------------

print()
print("========================================")
print("MODEL 2 RESULTS")
print("TEXT + EMOJI")
print("========================================")

print(
    f"Accuracy  : {accuracy:.4f}"
)

print(
    f"Precision : {precision:.4f}"
)

print(
    f"Recall    : {recall:.4f}"
)

print(
    f"F1 Score  : {f1:.4f}"
)


# ----------------------------------------
# 11. Emoji statistics
# ----------------------------------------

total_emoji_reviews = (
    df["emoji_count"] > 0
).sum()

total_emojis = (
    df["emoji_count"].sum()
)

print()
print("========================================")
print("EMOJI STATISTICS")
print("========================================")

print(
    "Reviews containing emojis:",
    total_emoji_reviews
)

print(
    "Total detected emojis:",
    total_emojis
)


# ----------------------------------------
# 12. Confusion matrix
# ----------------------------------------

print()
print("========================================")
print("CONFUSION MATRIX")
print("========================================")

print(
    pd.DataFrame(
        cm,
        index=[
            "Actual NEGATIVE",
            "Actual POSITIVE"
        ],
        columns=[
            "Predicted NEGATIVE",
            "Predicted POSITIVE"
        ]
    )
)


# ----------------------------------------
# 13. Classification report
# ----------------------------------------

print()
print("========================================")
print("CLASSIFICATION REPORT")
print("========================================")

print(
    classification_report(
        y_true,
        y_pred
    )
)


# ----------------------------------------
# 14. Save predictions
# ----------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)


print()
print("========================================")
print("MODEL 2 COMPLETED")
print("========================================")

print(
    "Predictions saved as:",
    OUTPUT_FILE
)

print()
print("File location:")
print(
    "D:\\K\\CCI-Project\\backend\\datasets\\"
    + OUTPUT_FILE
)

print()
print("========================================")
print("DONE")
print("========================================")