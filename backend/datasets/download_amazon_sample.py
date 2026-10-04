import requests
import json
import gzip
import pandas as pd

URL = (
    "https://huggingface.co/datasets/"
    "McAuley-Lab/Amazon-Reviews-2023/"
    "resolve/main/raw/review_categories/Electronics.jsonl"
)

OUTPUT_FILE = "amazon_electronics_5000.csv"
MAX_REVIEWS = 5000

print("========================================")
print("CCI - Amazon Reviews 2023")
print("========================================")
print()
print("Connecting to official Hugging Face file...")
print("Category: Electronics")
print("Target reviews:", MAX_REVIEWS)
print()

headers = {
    "User-Agent": "CCI-Project/1.0"
}

try:
    response = requests.get(
        URL,
        headers=headers,
        stream=True,
        timeout=120
    )

    print("HTTP Status:", response.status_code)

    response.raise_for_status()

except requests.RequestException as error:
    print()
    print("Connection failed.")
    print("Error:", error)
    exit()

print()
print("Connection successful.")
print("Reading real Amazon review records...")
print()

rows = []

try:

    for line in response.iter_lines(
        decode_unicode=True
    ):

        if not line:
            continue

        try:
            review = json.loads(line)

            review_text = review.get("text", "")

            if not review_text:
                continue

            rows.append({
                "review_id": len(rows) + 1,
                "rating": review.get("rating"),
                "review_title": review.get("title", ""),
                "review_text": review_text,
                "product_id": review.get("parent_asin"),
                "verified_purchase": review.get(
                    "verified_purchase"
                ),
                "helpful_vote": review.get(
                    "helpful_vote"
                )
            })

            if len(rows) >= MAX_REVIEWS:
                break

        except json.JSONDecodeError:
            continue

except Exception as error:

    print()
    print("Error while reading dataset.")
    print("Error:", error)
    exit()

df = pd.DataFrame(rows)

if df.empty:

    print()
    print("No review records were collected.")
    exit()

df = df[
    df["review_text"]
    .notna()
    & (
        df["review_text"]
        .astype(str)
        .str.strip()
        != ""
    )
]

df.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print()
print("========================================")
print("DATASET CREATED")
print("========================================")
print()
print("File:", OUTPUT_FILE)
print("Rows:", len(df))
print("Columns:", len(df.columns))
print()
print("Columns:")
print(df.columns.tolist())
print()
print("First 3 reviews:")
print(
    df[
        [
            "rating",
            "review_title",
            "review_text"
        ]
    ].head(3).to_string()
)
print()
print("Rating distribution:")
print(
    df["rating"]
    .value_counts()
    .sort_index()
)
print()
print("Missing values:")
print(df.isnull().sum())
print()
print("========================================")
print("DONE")
print("========================================")