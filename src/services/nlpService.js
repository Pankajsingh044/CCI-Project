const NLP_API_URL =
  "https://cci-project.onrender.com/api/analyze";

const MODEL_RESULTS_API_URL =
  "https://cci-project.onrender.com/api/model-results";

const DATASET_EVALUATION_API_URL =
  "https://cci-project.onrender.com/api/evaluate-dataset";


// ============================================================
// ANALYZE SINGLE REVIEW
// ============================================================

export async function analyzeReviewWithNLP({
  review,
  brand,
  product,
  rating
}) {
  try {

    const response = await fetch(
      NLP_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          review,
          brand,
          product,
          rating
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail ||
        "NLP analysis failed"
      );
    }

    return data;

  } catch (error) {

    console.error(
      "NLP Backend Error:",
      error
    );

    throw error;
  }
}


// ============================================================
// GET EXISTING MODEL EVALUATION RESULTS
// ============================================================

export async function getModelEvaluationResults() {

  try {

    const response = await fetch(
      MODEL_RESULTS_API_URL
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Failed to fetch model evaluation results"
      );
    }

    return data;

  } catch (error) {

    console.error(
      "Model Results API Error:",
      error
    );

    throw error;
  }
}


// ============================================================
// EVALUATE UPLOADED DATASET
// ============================================================

export async function evaluateUploadedDataset({
  rows,
  columns,
  reviewColumn,
  ratingColumn,
  labelColumn,
  brandColumn,
  productColumn,
  verifiedColumn,
  helpfulColumn
}) {

  try {

    const response = await fetch(
      DATASET_EVALUATION_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          rows,

          columns,

          review_column:
            reviewColumn || null,

          rating_column:
            ratingColumn || null,

          label_column:
            labelColumn || null,

          brand_column:
            brandColumn || null,

          product_column:
            productColumn || null,

          verified_column:
            verifiedColumn || null,

          helpful_column:
            helpfulColumn || null
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.detail ||
        "Dataset NLP evaluation failed"
      );
    }

    return data;

  } catch (error) {

    console.error(
      "Dataset NLP Evaluation Error:",
      error
    );

    throw error;
  }
}