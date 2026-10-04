import pandas as pd

INPUT_FILE = "amazon_electronics_5000.csv"
OUTPUT_FILE = "amazon_sentiment_evaluation.csv"

print("Loading Amazon review dataset...")

df = pd.read_csv(INPUT_FILE)

print("Original rows:", len(df))

# Keep only clearly negative and clearly positive reviews
df = df[df["rating"].isin([1, 2, 4, 5])].copy()

# Create ground-truth sentiment from rating
def create_sentiment(rating):
    if rating <= 2:
        return "NEGATIVE"
    else:
        return "POSITIVE"

df["true_sentiment"] = df["rating"].apply(
    create_sentiment
)

# Keep only useful columns
df = df[
    [
        "review_id",
        "rating",
        "review_title",
        "review_text",
        "product_id",
        "verified_purchase",
        "helpful_vote",
        "true_sentiment"
    ]
]

# Save
df.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print()
print("========================================")
print("PREPARED DATASET")
print("========================================")

print("Rows:", len(df))

print()
print("Sentiment distribution:")
print(
    df["true_sentiment"]
    .value_counts()
)

print()
print("Rating distribution:")
print(
    df["rating"]
    .value_counts()
    .sort_index()
)

print()
print("Saved as:")
print(OUTPUT_FILE)

print()
print("First 5 rows:")
print(
    df[
        [
            "rating",
            "review_text",
            "true_sentiment"
        ]
    ].head().to_string()
)