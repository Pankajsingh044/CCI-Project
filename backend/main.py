from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import os
import re
from collections import Counter

from bson import ObjectId

from passlib.context import CryptContext

from database import (
    connect_to_mongodb,
    close_mongodb_connection,
    users_collection,
    reviews_collection,
    analysis_history_collection
)

from models.sentiment_model import (
    analyze_review,
    evaluate_uploaded_dataset
)


# ============================================================
# MONGODB LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Connect to MongoDB when FastAPI starts
    await connect_to_mongodb()

    yield

    # Close MongoDB when FastAPI stops
    await close_mongodb_connection()


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="CCI NLP Backend",
    description="Contextual Communication Intelligence NLP API",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ============================================================
# REVIEW REQUEST DATA STRUCTURE
# ============================================================

class ReviewRequest(BaseModel):

    review: str
    brand: Optional[str] = None
    product: Optional[str] = None
    rating: Optional[float] = None


# ============================================================
# SAVE REVIEW REQUEST
# ============================================================

class SaveReviewRequest(BaseModel):

    userEmail: Optional[str] = ""
    brand: str
    product: str
    review: str
    rating: Optional[float] = 0
    date: str
    nlpResults: dict
    status: str = "NLP Completed"


# ============================================================
# SAVE HISTORY REQUEST
# ============================================================

class SaveHistoryRequest(BaseModel):

    userEmail: Optional[str] = ""
    reviewId: Optional[str] = None
    brand: str
    product: str
    date: str
    status: str = "NLP Completed"


# ============================================================
# DATASET EVALUATION REQUEST DATA STRUCTURE
# ============================================================

class DatasetEvaluationRequest(BaseModel):

    rows: list
    columns: list
    review_column: Optional[str] = None
    rating_column: Optional[str] = None
    label_column: Optional[str] = None
    brand_column: Optional[str] = None
    product_column: Optional[str] = None
    verified_column: Optional[str] = None
    helpful_column: Optional[str] = None


# ============================================================
# SIGNUP REQUEST DATA STRUCTURE
# ============================================================

class SignupRequest(BaseModel):

    name: str
    email: str
    password: str


# ============================================================
# LOGIN REQUEST DATA STRUCTURE
# ============================================================

class LoginRequest(BaseModel):

    email: str
    password: str


# ============================================================
# TEST / HOME ENDPOINT
# ============================================================

@app.get("/")
def home():

    return {
        "message": "CCI NLP Backend is running",
        "status": "online"
    }


# ============================================================
# DATABASE STATUS ENDPOINT
# ============================================================

@app.get("/api/database-status")
async def database_status():

    return {
        "success": True,
        "database": "MongoDB",
        "status": "connected"
    }


# ============================================================
# SIGNUP API
# ============================================================

@app.post("/api/auth/signup")
async def signup(request: SignupRequest):

    try:

        name = request.name.strip()
        email = request.email.strip().lower()
        password = request.password

        if not name:

            raise HTTPException(
                status_code=400,
                detail="Name is required"
            )

        if not email:

            raise HTTPException(
                status_code=400,
                detail="Email is required"
            )

        if not password:

            raise HTTPException(
                status_code=400,
                detail="Password is required"
            )

        if len(password) < 6:

            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters"
            )

        existing_user = await users_collection.find_one(
            {
                "email": email
            }
        )

        if existing_user:

            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )

        password_hash = pwd_context.hash(password)

        user = {
            "name": name,
            "email": email,
            "password_hash": password_hash
        }

        result = await users_collection.insert_one(user)

        return {
            "success": True,
            "message": "Account created successfully",
            "user": {
                "id": str(result.inserted_id),
                "name": name,
                "email": email
            }
        }

    except HTTPException:

        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# LOGIN API
# ============================================================

@app.post("/api/auth/login")
async def login(request: LoginRequest):

    try:

        email = request.email.strip().lower()
        password = request.password

        if not email:

            raise HTTPException(
                status_code=400,
                detail="Email is required"
            )

        if not password:

            raise HTTPException(
                status_code=400,
                detail="Password is required"
            )

        user = await users_collection.find_one(
            {
                "email": email
            }
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        password_is_valid = pwd_context.verify(
            password,
            user["password_hash"]
        )

        if not password_is_valid:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"]
            }
        }

    except HTTPException:

        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# NLP REVIEW ANALYSIS ENDPOINT
# ============================================================

@app.post("/api/analyze")
def analyze(request: ReviewRequest):

    try:

        results = analyze_review(
            text=request.review,
            brand=request.brand,
            product=request.product,
            rating=request.rating
        )

        return {
            "success": True,
            "review": request.review,
            "brand": request.brand,
            "product": request.product,
            "rating": request.rating,
            "results": results
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# SAVE REVIEW TO MONGODB
# ============================================================

@app.post("/api/reviews")
async def save_review(request: SaveReviewRequest):

    try:

        review_document = {
            "userEmail": request.userEmail,
            "brand": request.brand,
            "product": request.product,
            "review": request.review,
            "rating": request.rating,
            "date": request.date,
            "nlpResults": request.nlpResults,
            "status": request.status
        }

        result = await reviews_collection.insert_one(
            review_document
        )

        return {
            "success": True,
            "message": "Review saved successfully",
            "review": {
                "id": str(result.inserted_id),
                "userEmail": request.userEmail,
                "brand": request.brand,
                "product": request.product,
                "review": request.review,
                "rating": request.rating,
                "date": request.date,
                "nlpResults": request.nlpResults,
                "status": request.status
            }
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# GET USER REVIEWS
# ============================================================

@app.get("/api/reviews")
async def get_reviews(
    userEmail: Optional[str] = None
):

    try:

        query = {}

        if userEmail:

            query["userEmail"] = userEmail.strip().lower()

        cursor = reviews_collection.find(
            query
        ).sort(
            "_id",
            -1
        )

        reviews = []

        async for review in cursor:

            reviews.append({
                "id": str(review["_id"]),
                "userEmail": review.get(
                    "userEmail",
                    ""
                ),
                "brand": review.get(
                    "brand",
                    ""
                ),
                "product": review.get(
                    "product",
                    ""
                ),
                "review": review.get(
                    "review",
                    ""
                ),
                "rating": review.get(
                    "rating",
                    0
                ),
                "date": review.get(
                    "date",
                    ""
                ),
                "nlpResults": review.get(
                    "nlpResults",
                    {}
                ),
                "status": review.get(
                    "status",
                    ""
                )
            })

        return {
            "success": True,
            "reviews": reviews
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# SAVE ANALYSIS HISTORY TO MONGODB
# ============================================================

@app.post("/api/analysis-history")
async def save_analysis_history(
    request: SaveHistoryRequest
):

    try:

        history_document = {
            "userEmail": request.userEmail,
            "reviewId": request.reviewId,
            "brand": request.brand,
            "product": request.product,
            "date": request.date,
            "status": request.status
        }

        result = await analysis_history_collection.insert_one(
            history_document
        )

        return {
            "success": True,
            "message": "Analysis history saved successfully",
            "history": {
                "id": str(result.inserted_id),
                "userEmail": request.userEmail,
                "reviewId": request.reviewId,
                "brand": request.brand,
                "product": request.product,
                "date": request.date,
                "status": request.status
            }
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# GET ANALYSIS HISTORY
# ============================================================

@app.get("/api/analysis-history")
async def get_analysis_history(
    userEmail: Optional[str] = None
):

    try:

        query = {}

        if userEmail:

            query["userEmail"] = userEmail.strip().lower()

        cursor = analysis_history_collection.find(
            query
        ).sort(
            "_id",
            -1
        )

        history = []

        async for item in cursor:

            history.append({
                "id": str(item["_id"]),
                "userEmail": item.get(
                    "userEmail",
                    ""
                ),
                "reviewId": item.get(
                    "reviewId"
                ),
                "brand": item.get(
                    "brand",
                    ""
                ),
                "product": item.get(
                    "product",
                    ""
                ),
                "date": item.get(
                    "date",
                    ""
                ),
                "status": item.get(
                    "status",
                    ""
                )
            })

        return {
            "success": True,
            "history": history
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# DELETE ONE ANALYSIS HISTORY
# ============================================================

@app.delete("/api/analysis-history/{history_id}")
async def delete_analysis_history(
    history_id: str,
    userEmail: Optional[str] = None
):

    try:

        # Validate MongoDB ObjectId
        if not ObjectId.is_valid(history_id):

            raise HTTPException(
                status_code=400,
                detail="Invalid analysis history ID"
            )

        # Find the analysis history
        query = {
            "_id": ObjectId(history_id)
        }

        # Keep deletion limited to the logged-in user
        if userEmail:

            query["userEmail"] = userEmail.strip().lower()

        history_item = await analysis_history_collection.find_one(
            query
        )

        if not history_item:

            raise HTTPException(
                status_code=404,
                detail="Analysis history not found"
            )

        # Delete analysis history
        history_result = await analysis_history_collection.delete_one(
            query
        )

        # Get linked review ID
        review_id = history_item.get("reviewId")

        review_deleted = 0

        # Delete linked review
        if review_id and ObjectId.is_valid(
            str(review_id)
        ):

            review_query = {
                "_id": ObjectId(str(review_id))
            }

            if userEmail:

                review_query["userEmail"] = (
                    userEmail.strip().lower()
                )

            review_result = await reviews_collection.delete_one(
                review_query
            )

            review_deleted = review_result.deleted_count

        return {
            "success": True,
            "message": "Analysis deleted successfully",
            "historyDeleted": history_result.deleted_count,
            "reviewDeleted": review_deleted
        }

    except HTTPException:

        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# DELETE ALL ANALYSIS HISTORY
# ============================================================

@app.delete("/api/analysis-history")
async def clear_all_analysis_history(
    userEmail: Optional[str] = None
):

    try:

        history_query = {}

        # Delete only current user's history
        if userEmail:

            history_query["userEmail"] = (
                userEmail.strip().lower()
            )

        # Delete all analysis history
        history_result = await analysis_history_collection.delete_many(
            history_query
        )

        # Delete saved reviews belonging to same user
        review_query = {}

        if userEmail:

            review_query["userEmail"] = (
                userEmail.strip().lower()
            )

        review_result = await reviews_collection.delete_many(
            review_query
        )

        return {
            "success": True,
            "message": "All analysis history cleared successfully",
            "historyDeleted": history_result.deleted_count,
            "reviewsDeleted": review_result.deleted_count
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )



# ============================================================
# LIVE MONGODB ANALYTICS HELPERS
# ============================================================

EMOJI_PATTERN = re.compile(
    r"[\U0001F300-\U0001FAFF\u2600-\u27BF]"
)

SENTIMENT_KEYS = [
    "sentiment",
    "predicted_sentiment",
    "predictedSentiment",
    "sentiment_label",
    "sentimentLabel",
    "label",
    "prediction",
    "predicted_label",
    "predictedLabel",
    "class"
]


def _find_nested_value(data, possible_keys):
    """
    Search a saved NLP result recursively for one of the
    known sentiment-related keys.
    """
    if not isinstance(data, dict):
        return None

    for key in possible_keys:
        if key in data and data[key] is not None:
            value = data[key]

            if isinstance(value, dict):
                nested = _find_nested_value(
                    value,
                    possible_keys
                )

                if nested is not None:
                    return nested

                for child_key in [
                    "label",
                    "name",
                    "value",
                    "text",
                    "class",
                    "category"
                ]:
                    if (
                        child_key in value and
                        value[child_key] is not None
                    ):
                        return value[child_key]

            elif isinstance(value, list):
                for item in value:
                    nested = _find_nested_value(
                        item,
                        possible_keys
                    )

                    if nested is not None:
                        return nested

            else:
                return value

    for value in data.values():
        if isinstance(value, dict):
            nested = _find_nested_value(
                value,
                possible_keys
            )

            if nested is not None:
                return nested

    return None


def _normalize_sentiment(value):
    """
    Normalize common NLP sentiment labels without
    inventing a sentiment when the NLP result has none.
    """
    if value is None:
        return None

    if isinstance(value, dict):
        for key in [
            "label",
            "sentiment",
            "name",
            "value",
            "class",
            "category",
            "text"
        ]:
            if key in value:
                return _normalize_sentiment(
                    value[key]
                )

        return None

    text = str(value).strip().lower()

    if not text:
        return None

    if any(
        word in text
        for word in [
            "positive",
            "pos",
            "good",
            "favorable",
            "favourable"
        ]
    ):
        return "Positive"

    if any(
        word in text
        for word in [
            "negative",
            "neg",
            "bad",
            "unfavorable",
            "unfavourable"
        ]
    ):
        return "Negative"

    if any(
        word in text
        for word in [
            "neutral",
            "neu"
        ]
    ):
        return "Neutral"

    return None


def _extract_review_sentiment(nlp_results):
    """
    Prefer Model 3 because it represents the complete
    Text + Emoji + Context pipeline. If Model 3 does not
    contain a recognizable sentiment label, search the
    remaining saved NLP result structure.
    """
    if not isinstance(nlp_results, dict):
        return None

    model3 = (
        nlp_results.get("model_3") or
        nlp_results.get("model3")
    )

    sentiment = _normalize_sentiment(
        _find_nested_value(
            model3,
            SENTIMENT_KEYS
        )
    )

    if sentiment:
        return sentiment

    sentiment = _normalize_sentiment(
        _find_nested_value(
            nlp_results,
            SENTIMENT_KEYS
        )
    )

    return sentiment


def _safe_float(value):
    try:
        number = float(value)

        if number != number:
            return None

        return number
    except (TypeError, ValueError):
        return None


# ============================================================
# LIVE MONGODB ANALYTICS API
# ============================================================

@app.get("/api/analytics")
async def get_live_analytics(
    userEmail: Optional[str] = None
):
    try:
        if not userEmail or not userEmail.strip():
            raise HTTPException(
                status_code=400,
                detail="userEmail is required"
            )

        normalized_email = (
            userEmail.strip().lower()
        )

        query = {
            "userEmail": normalized_email
        }

        cursor = reviews_collection.find(
            query
        ).sort(
            "_id",
            -1
        )

        reviews = []

        async for review in cursor:
            reviews.append(review)

        total_reviews = len(reviews)

        ratings = []
        rating_distribution = Counter()

        brand_distribution = Counter()
        product_distribution = Counter()

        sentiment_distribution = Counter()

        emoji_counter = Counter()

        emoji_review_count = 0
        total_emoji_count = 0

        review_lengths = []

        normalized_review_texts = []

        missing_values = 0

        for review in reviews:
            text = str(
                review.get("review") or ""
            ).strip()

            brand = str(
                review.get("brand") or ""
            ).strip()

            product = str(
                review.get("product") or ""
            ).strip()

            rating = _safe_float(
                review.get("rating")
            )

            if rating is not None:
                ratings.append(rating)

                rating_key = (
                    str(int(rating))
                    if rating.is_integer()
                    else str(rating)
                )

                rating_distribution[
                    rating_key
                ] += 1

            if brand:
                brand_distribution[
                    brand
                ] += 1

            if product:
                product_distribution[
                    product
                ] += 1

            if not text:
                missing_values += 1
            else:
                review_lengths.append(
                    len(text)
                )

                normalized_review_texts.append(
                    re.sub(
                        r"\s+",
                        " ",
                        text.lower()
                    ).strip()
                )

            if not brand:
                missing_values += 1

            if not product:
                missing_values += 1

            if rating is None:
                missing_values += 1

            emoji_matches = EMOJI_PATTERN.findall(
                text
            )

            if emoji_matches:
                emoji_review_count += 1
                total_emoji_count += len(
                    emoji_matches
                )

                emoji_counter.update(
                    emoji_matches
                )

            sentiment = _extract_review_sentiment(
                review.get("nlpResults") or {}
            )

            if sentiment:
                sentiment_distribution[
                    sentiment
                ] += 1

        duplicate_count = (
            len(normalized_review_texts)
            - len(set(normalized_review_texts))
        )

        average_rating = (
            sum(ratings) / len(ratings)
            if ratings
            else 0
        )

        average_review_length = (
            sum(review_lengths) /
            len(review_lengths)
            if review_lengths
            else 0
        )

        return {
            "success": True,
            "source": "MongoDB",
            "userEmail": normalized_email,
            "totalReviews": total_reviews,
            "averageRating": round(
                average_rating,
                2
            ),
            "ratingDistribution": dict(
                sorted(
                    rating_distribution.items(),
                    key=lambda item: float(item[0])
                )
            ),
            "sentimentDistribution": {
                "Positive": sentiment_distribution.get(
                    "Positive",
                    0
                ),
                "Negative": sentiment_distribution.get(
                    "Negative",
                    0
                ),
                "Neutral": sentiment_distribution.get(
                    "Neutral",
                    0
                )
            },
            "emojiReviewCount": (
                emoji_review_count
            ),
            "totalEmojiCount": (
                total_emoji_count
            ),
            "topEmojis": [
                {
                    "emoji": emoji,
                    "count": count
                }
                for emoji, count
                in emoji_counter.most_common(10)
            ],
            "brandDistribution": [
                {
                    "brand": brand,
                    "count": count
                }
                for brand, count
                in brand_distribution.most_common(10)
            ],
            "productDistribution": [
                {
                    "product": product,
                    "count": count
                }
                for product, count
                in product_distribution.most_common(10)
            ],
            "averageReviewLength": round(
                average_review_length,
                2
            ),
            "duplicateCount": max(
                duplicate_count,
                0
            ),
            "missingValues": missing_values
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# MODEL EVALUATION RESULTS API
# ============================================================

@app.get("/api/model-results")
def get_model_results():

    results_path = os.path.join(
        os.path.dirname(__file__),
        "datasets",
        "model_results.json"
    )

    if not os.path.exists(results_path):

        raise HTTPException(
            status_code=404,
            detail="Model results file not found"
        )

    try:

        with open(
            results_path,
            "r",
            encoding="utf-8"
        ) as file:

            results = json.load(file)

        return {
            "success": True,
            "results": results
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# UPLOADED DATASET NLP EVALUATION API
# ============================================================

@app.post("/api/evaluate-dataset")
def evaluate_dataset(
    request: DatasetEvaluationRequest
):

    try:

        results = evaluate_uploaded_dataset(
            rows=request.rows,
            columns=request.columns,
            review_column=request.review_column,
            rating_column=request.rating_column,
            label_column=request.label_column,
            brand_column=request.brand_column,
            product_column=request.product_column,
            verified_column=request.verified_column,
            helpful_column=request.helpful_column
        )

        return {
            "success": True,
            "results": results
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )