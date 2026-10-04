import pandas as pd

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


print("========================================")
print("CCI - MODEL 1 EVALUATION")
print("Text Only")
print("========================================")
print()


# ----------------------------------------
# 1. Load dataset
# ----------------------------------------

print("Loading evaluation dataset...")

df = pd.read_csv(INPUT_FILE)

print("Total evaluation reviews:", len(df))
print()


# ----------------------------------------
# 2. Load pretrained sentiment model
# ----------------------------------------

print("Loading DistilBERT sentiment model...")
print("This may take some time on first run.")
print()

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)


# ----------------------------------------
# 3. Analyze reviews
# ----------------------------------------

texts = df["review_text"].astype(str).tolist()

predictions = []

print("Running Model 1...")
print()

for i, text in enumerate(texts):

    result = sentiment_pipeline(
        text,
        truncation=True
    )[0]

    predictions.append(
        result["label"]
    )

    if (i + 1) % 100 == 0:
        print(
            f"Processed {i + 1}/{len(texts)} reviews"
        )


# ----------------------------------------
# 4. Add predictions
# ----------------------------------------

df["predicted_sentiment"] = predictions


# ----------------------------------------
# 5. Calculate metrics
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
# 6. Confusion matrix
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
# 7. Display results
# ----------------------------------------

print()
print("========================================")
print("MODEL 1 RESULTS")
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

print()
print("Confusion Matrix")
print(
    "Rows = Actual"
)
print(
    "Columns = Predicted"
)
print()

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
# 8. Classification report
# ----------------------------------------

print()
print("Classification Report")
print()

print(
    classification_report(
        y_true,
        y_pred
    )
)


# ----------------------------------------
# 9. Save predictions
# ----------------------------------------

OUTPUT_FILE = "model_1_predictions.csv"

df.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print()
print("========================================")
print("Evaluation completed.")
print("Predictions saved as:")
print(OUTPUT_FILE)
print("========================================")