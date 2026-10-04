import pandas as pd
import json
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)


# ============================================================
# FILE PATHS
# ============================================================

MODEL_1_FILE = "datasets/model_1_predictions.csv"
MODEL_2_FILE = "datasets/model_2_predictions.csv"
MODEL_3_FILE = "datasets/model_3_predictions.csv"

OUTPUT_FILE = "datasets/model_results.json"


# ============================================================
# FUNCTION TO CALCULATE METRICS
# ============================================================

def calculate_metrics(file_path):

    df = pd.read_csv(file_path)

    y_true = df["true_sentiment"]
    y_pred = df["predicted_sentiment"]

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

    cm = confusion_matrix(
        y_true,
        y_pred,
        labels=[
            "NEGATIVE",
            "POSITIVE"
        ]
    )

    return {
        "total_reviews": len(df),

        "accuracy": round(
            accuracy * 100,
            2
        ),

        "precision": round(
            precision * 100,
            2
        ),

        "recall": round(
            recall * 100,
            2
        ),

        "f1_score": round(
            f1 * 100,
            2
        ),

        "confusion_matrix": {
            "true_negative": int(cm[0][0]),
            "false_positive": int(cm[0][1]),
            "false_negative": int(cm[1][0]),
            "true_positive": int(cm[1][1])
        }
    }


# ============================================================
# MODEL 1
# ============================================================

print("Calculating Model 1 metrics...")

model_1 = calculate_metrics(
    MODEL_1_FILE
)


# ============================================================
# MODEL 2
# ============================================================

print("Calculating Model 2 metrics...")

model_2 = calculate_metrics(
    MODEL_2_FILE
)


# ============================================================
# MODEL 3
# ============================================================

print("Calculating Model 3 metrics...")

model_3 = calculate_metrics(
    MODEL_3_FILE
)


# ============================================================
# COMBINE RESULTS
# ============================================================

results = {

    "dataset": {
        "name": "Amazon Reviews 2023 Electronics",
        "evaluation_reviews": 4672
    },

    "models": {

        "model_1": {
            "name": "Text Only",
            **model_1
        },

        "model_2": {
            "name": "Text + Emoji",
            **model_2
        },

        "model_3": {
            "name": "Text + Emoji + Context",
            **model_3
        }
    },

    "emoji_statistics": {
        "reviews_with_emojis": 74,
        "total_detected_emojis": 134
    }
}


# ============================================================
# SAVE JSON
# ============================================================

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        results,
        file,
        indent=4
    )


# ============================================================
# DISPLAY RESULTS
# ============================================================

print("\n")
print("=" * 60)
print("MODEL RESULTS GENERATED")
print("=" * 60)

for model_key, model_data in results["models"].items():

    print("\n" + model_data["name"])

    print(
        "Accuracy:",
        model_data["accuracy"],
        "%"
    )

    print(
        "Precision:",
        model_data["precision"],
        "%"
    )

    print(
        "Recall:",
        model_data["recall"],
        "%"
    )

    print(
        "F1 Score:",
        model_data["f1_score"],
        "%"
    )


print("\n")
print("=" * 60)

print(
    "JSON saved to:"
)

print(
    OUTPUT_FILE
)

print("=" * 60)