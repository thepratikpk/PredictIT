"""
Seed data for pipeline_templates and docs_content collections.
Imported by database.py for idempotent seeding on startup.
"""

# ============================================================
# Pipeline Templates — 8 starter templates
# ============================================================

PIPELINE_TEMPLATES = [
    {
        "name": "Beginner Classification",
        "description": "The simplest ML pipeline — upload data, preprocess, split, and train a Logistic Regression model. Perfect for learning the basics.",
        "category": "classification",
        "difficulty": "beginner",
        "icon": "GraduationCap",
        "blocks": [
            {"id": "node-data", "type": "dataNode", "order": 1, "config": {}},
            {"id": "node-scale", "type": "preprocessNode", "order": 2, "config": {"scaler": "StandardScaler"}},
            {"id": "node-split", "type": "splitNode", "order": 3, "config": {"ratio": 0.2}},
            {"id": "node-model", "type": "modelNode", "order": 4, "config": {"modelType": "LogisticRegression"}},
            {"id": "node-results", "type": "resultsNode", "order": 5, "config": {}},
        ],
        "edges": [
            {"source": "node-data", "target": "node-scale"},
            {"source": "node-scale", "target": "node-split"},
            {"source": "node-split", "target": "node-model"},
            {"source": "node-model", "target": "node-results"},
        ],
        "sampleDatasetUrl": None,
        "isSystem": True,
    },
    {
        "name": "Customer Churn Prediction",
        "description": "Predict which customers will leave using encoding, class balancing (churn is rare), and Random Forest for robust results.",
        "category": "classification",
        "difficulty": "intermediate",
        "icon": "UserMinus",
        "blocks": [
            {"id": "node-data", "type": "dataNode", "order": 1, "config": {}},
            {"id": "node-encode", "type": "encodeNode", "order": 2, "config": {"method": "onehot"}},
            {"id": "node-balance", "type": "balanceNode", "order": 3, "config": {"method": "smote"}},
            {"id": "node-scale", "type": "preprocessNode", "order": 4, "config": {"scaler": "StandardScaler"}},
            {"id": "node-split", "type": "splitNode", "order": 5, "config": {"ratio": 0.2}},
            {"id": "node-model", "type": "modelNode", "order": 6, "config": {"modelType": "RandomForest"}},
            {"id": "node-results", "type": "resultsNode", "order": 7, "config": {}},
        ],
        "edges": [
            {"source": "node-data", "target": "node-encode"},
            {"source": "node-encode", "target": "node-balance"},
            {"source": "node-balance", "target": "node-scale"},
            {"source": "node-scale", "target": "node-split"},
            {"source": "node-split", "target": "node-model"},
            {"source": "node-model", "target": "node-results"},
        ],
        "sampleDatasetUrl": None,
        "isSystem": True,
    },
    {
        "name": "House Price Prediction",
        "description": "Predict house prices using Linear Regression. Cleans missing values, scales features, and evaluates with RMSE and R².",
        "category": "regression",
        "difficulty": "beginner",
        "icon": "Home",
        "blocks": [
            {"id": "node-data", "type": "dataNode", "order": 1, "config": {}},
            {"id": "node-clean", "type": "cleanNode", "order": 2, "config": {"strategy": "mean", "drop_duplicates": True}},
            {"id": "node-scale", "type": "preprocessNode", "order": 3, "config": {"scaler": "StandardScaler"}},
            {"id": "node-split", "type": "splitNode", "order": 4, "config": {"ratio": 0.2}},
            {"id": "node-model", "type": "modelNode", "order": 5, "config": {"modelType": "LinearRegression"}},
            {"id": "node-results", "type": "resultsNode", "order": 6, "config": {}},
        ],
        "edges": [
            {"source": "node-data", "target": "node-clean"},
            {"source": "node-clean", "target": "node-scale"},
            {"source": "node-scale", "target": "node-split"},
            {"source": "node-split", "target": "node-model"},
            {"source": "node-model", "target": "node-results"},
        ],
        "sampleDatasetUrl": None,
        "isSystem": True,
    },
    {
        "name": "Customer Segmentation",
        "description": "Group customers into segments using K-Means Clustering. No target column needed — the algorithm finds natural groupings.",
        "category": "clustering",
        "difficulty": "intermediate",
        "icon": "Users",
        "blocks": [
            {"id": "node-data", "type": "dataNode", "order": 1, "config": {}},
            {"id": "node-clean", "type": "cleanNode", "order": 2, "config": {"strategy": "mean", "drop_duplicates": True}},
            {"id": "node-scale", "type": "preprocessNode", "order": 3, "config": {"scaler": "StandardScaler"}},
            {"id": "node-model", "type": "modelNode", "order": 4, "config": {"modelType": "KMeans", "n_clusters": 3}},
            {"id": "node-results", "type": "resultsNode", "order": 5, "config": {}},
        ],
        "edges": [
            {"source": "node-data", "target": "node-clean"},
            {"source": "node-clean", "target": "node-scale"},
            {"source": "node-scale", "target": "node-model"},
            {"source": "node-model", "target": "node-results"},
        ],
        "sampleDatasetUrl": None,
        "isSystem": True,
    },
    {
        "name": "Loan Default / Credit Risk",
        "description": "Predict loan defaults using Gradient Boosting. Handles categorical data and imbalanced classes for reliable predictions.",
        "category": "classification",
        "difficulty": "intermediate",
        "icon": "Landmark",
        "blocks": [
            {"id": "node-data", "type": "dataNode", "order": 1, "config": {}},
            {"id": "node-encode", "type": "encodeNode", "order": 2, "config": {"method": "onehot"}},
            {"id": "node-balance", "type": "balanceNode", "order": 3, "config": {"method": "smote"}},
            {"id": "node-scale", "type": "preprocessNode", "order": 4, "config": {"scaler": "StandardScaler"}},
            {"id": "node-split", "type": "splitNode", "order": 5, "config": {"ratio": 0.2}},
            {"id": "node-model", "type": "modelNode", "order": 6, "config": {"modelType": "GradientBoosting"}},
            {"id": "node-results", "type": "resultsNode", "order": 7, "config": {}},
        ],
        "edges": [
            {"source": "node-data", "target": "node-encode"},
            {"source": "node-encode", "target": "node-balance"},
            {"source": "node-balance", "target": "node-scale"},
            {"source": "node-scale", "target": "node-split"},
            {"source": "node-split", "target": "node-model"},
            {"source": "node-model", "target": "node-results"},
        ],
        "sampleDatasetUrl": None,
        "isSystem": True,
    },
    {
        "name": "Fraud Detection",
        "description": "Detect fraudulent transactions. Uses EDA to explore patterns, SMOTE to handle rare fraud cases, and Cross-Validation for trustworthy results.",
        "category": "classification",
        "difficulty": "intermediate",
        "icon": "ShieldAlert",
        "blocks": [
            {"id": "node-data", "type": "dataNode", "order": 1, "config": {}},
            {"id": "node-eda", "type": "edaNode", "order": 2, "config": {}},
            {"id": "node-balance", "type": "balanceNode", "order": 3, "config": {"method": "smote"}},
            {"id": "node-scale", "type": "preprocessNode", "order": 4, "config": {"scaler": "StandardScaler"}},
            {"id": "node-split", "type": "splitNode", "order": 5, "config": {"ratio": 0.2}},
            {"id": "node-cv", "type": "crossValNode", "order": 6, "config": {"cv_folds": 5}},
            {"id": "node-model", "type": "modelNode", "order": 7, "config": {"modelType": "RandomForest"}},
            {"id": "node-results", "type": "resultsNode", "order": 8, "config": {}},
        ],
        "edges": [
            {"source": "node-data", "target": "node-eda"},
            {"source": "node-eda", "target": "node-balance"},
            {"source": "node-balance", "target": "node-scale"},
            {"source": "node-scale", "target": "node-split"},
            {"source": "node-split", "target": "node-cv"},
            {"source": "node-cv", "target": "node-model"},
            {"source": "node-model", "target": "node-results"},
        ],
        "sampleDatasetUrl": None,
        "isSystem": True,
    },
    {
        "name": "Employee Attrition",
        "description": "Predict employee turnover using a Decision Tree. Encodes categorical variables like department and job role.",
        "category": "classification",
        "difficulty": "beginner",
        "icon": "Briefcase",
        "blocks": [
            {"id": "node-data", "type": "dataNode", "order": 1, "config": {}},
            {"id": "node-encode", "type": "encodeNode", "order": 2, "config": {"method": "label"}},
            {"id": "node-scale", "type": "preprocessNode", "order": 3, "config": {"scaler": "StandardScaler"}},
            {"id": "node-split", "type": "splitNode", "order": 4, "config": {"ratio": 0.2}},
            {"id": "node-model", "type": "modelNode", "order": 5, "config": {"modelType": "DecisionTree"}},
            {"id": "node-results", "type": "resultsNode", "order": 6, "config": {}},
        ],
        "edges": [
            {"source": "node-data", "target": "node-encode"},
            {"source": "node-encode", "target": "node-scale"},
            {"source": "node-scale", "target": "node-split"},
            {"source": "node-split", "target": "node-model"},
            {"source": "node-model", "target": "node-results"},
        ],
        "sampleDatasetUrl": None,
        "isSystem": True,
    },
    {
        "name": "Disease Risk Prediction",
        "description": "Predict disease risk from patient data using SVM. Cleans missing medical records and scales features for optimal SVM performance.",
        "category": "classification",
        "difficulty": "intermediate",
        "icon": "HeartPulse",
        "blocks": [
            {"id": "node-data", "type": "dataNode", "order": 1, "config": {}},
            {"id": "node-clean", "type": "cleanNode", "order": 2, "config": {"strategy": "median", "drop_duplicates": True}},
            {"id": "node-scale", "type": "preprocessNode", "order": 3, "config": {"scaler": "StandardScaler"}},
            {"id": "node-split", "type": "splitNode", "order": 4, "config": {"ratio": 0.2}},
            {"id": "node-model", "type": "modelNode", "order": 5, "config": {"modelType": "SVM"}},
            {"id": "node-results", "type": "resultsNode", "order": 6, "config": {}},
        ],
        "edges": [
            {"source": "node-data", "target": "node-clean"},
            {"source": "node-clean", "target": "node-scale"},
            {"source": "node-scale", "target": "node-split"},
            {"source": "node-split", "target": "node-model"},
            {"source": "node-model", "target": "node-results"},
        ],
        "sampleDatasetUrl": None,
        "isSystem": True,
    },
]


# ============================================================
# Documentation Content
# ============================================================

DOCS_CONTENT = [
    # --- Getting Started ---
    {
        "slug": "getting-started",
        "title": "Getting Started",
        "section": "getting-started",
        "order": 1,
        "content": """## Welcome to PredictIT

PredictIT lets you build, train, and use machine learning models without writing any code. Follow these steps to get started:

### Step 1: Upload Your Data
Drag the **Data Upload** block onto the canvas. Click it to upload a CSV or Excel file. PredictIT will automatically detect column types and show you a preview.

### Step 2: Prepare Your Data (Optional)
Add **Preprocess** to scale your numeric features. This helps models learn faster. You can also add **Clean Data** to handle missing values or **Encode Categories** to convert text columns into numbers.

### Step 3: Split Your Data
The **Train-Test Split** block divides your data — part for training, part for testing. The default 80/20 split works well for most cases.

### Step 4: Choose a Model
Pick an algorithm in the **ML Model** block. Select your target column (what you want to predict) and feature columns (inputs the model uses to make predictions).

### Step 5: Run & Review
Click **Run** to train your model. PredictIT will show you accuracy, precision, recall, and a confusion matrix so you can evaluate performance.

### Tips
- Start with the **Beginner Classification** template if you're new
- Use the **?** icon on any block to learn what it does
- Check the **ML Glossary** if you encounter unfamiliar terms""",
    },
    # --- Block Reference: Core Blocks ---
    {
        "slug": "block-data-upload",
        "title": "Data Upload",
        "section": "block-reference",
        "order": 10,
        "shortDescription": "Upload a CSV or Excel file to start your pipeline.",
        "content": """## Data Upload

**What it does:** Imports your dataset (CSV or Excel) into the pipeline. PredictIT automatically detects numeric vs. categorical columns and shows a data preview.

**When to use it:** This is always the first block in any pipeline. Every ML workflow starts with data.

**Why it matters:** Without data, there's nothing to learn from. This block also detects data types so downstream blocks know how to handle each column.

**Used in templates:** All templates use this block.""",
    },
    {
        "slug": "block-preprocess",
        "title": "Preprocess (Scale Features)",
        "section": "block-reference",
        "order": 11,
        "shortDescription": "Scale numeric features to help models learn faster.",
        "content": """## Preprocess (Scale Features)

**What it does:** Scales your numeric columns so they're on a similar range. Choose StandardScaler (zero mean, unit variance) or MinMaxScaler (scale to 0–1).

**When to use it:** When your features have very different scales (e.g., age 0–100 vs. salary 20,000–200,000). Models like Logistic Regression and SVM are sensitive to feature scale.

**Why it matters:** Without scaling, features with larger numbers can dominate the model's learning, leading to worse predictions.

**Used in templates:** Beginner Classification, House Price Prediction, Customer Segmentation, and most others.""",
    },
    {
        "slug": "block-split",
        "title": "Train-Test Split",
        "section": "block-reference",
        "order": 12,
        "shortDescription": "Split data into training and testing sets.",
        "content": """## Train-Test Split

**What it does:** Divides your dataset into two parts — a training set (used to teach the model) and a test set (used to evaluate how well the model learned).

**When to use it:** For any supervised learning task (classification or regression). Not needed for clustering (K-Means).

**Why it matters:** If you test a model on the same data it trained on, it will look artificially accurate. Splitting ensures you measure real-world performance.

**Used in templates:** All supervised templates (not Customer Segmentation).""",
    },
    {
        "slug": "block-model",
        "title": "ML Model",
        "section": "block-reference",
        "order": 13,
        "shortDescription": "Choose an algorithm and configure training parameters.",
        "content": """## ML Model

**What it does:** Selects and configures the machine learning algorithm. You choose the model type, target column (what to predict), and feature columns (inputs).

**When to use it:** Every pipeline needs a model block. It's the core of the ML pipeline.

**Why it matters:** Different algorithms work better for different types of data. Logistic Regression is simple and fast; Random Forest is more powerful but slower; K-Means finds groups without a target.

**Used in templates:** All templates.""",
    },
    {
        "slug": "block-results",
        "title": "Results",
        "section": "block-reference",
        "order": 14,
        "shortDescription": "View model performance metrics and visualizations.",
        "content": """## Results

**What it does:** Displays your model's performance after training — accuracy, precision, recall, F1 score, and confusion matrix for classification; RMSE, MAE, and R² for regression; silhouette score for clustering.

**When to use it:** Always the last block in the pipeline. It's where you see if your model is any good.

**Why it matters:** Numbers tell you whether your model is reliable enough to use in the real world.

**Used in templates:** All templates.""",
    },
    # --- Block Reference: Data Prep ---
    {
        "slug": "block-clean-data",
        "title": "Clean Data",
        "section": "block-reference",
        "order": 20,
        "shortDescription": "Fill or drop missing values and remove duplicate rows.",
        "content": """## Clean Data

**What it does:** Handles missing values (NaN/blank cells) by either dropping rows with missing data or filling them with the mean, median, or most frequent value. Also removes duplicate rows.

**When to use it:** When your dataset has missing values or duplicates. Most real-world data is messy — this block fixes that.

**Why it matters:** ML models can't handle missing values. If you skip this step, your pipeline will either crash or produce unreliable results.

**Backend:** `sklearn.impute.SimpleImputer`, `pandas.DataFrame.drop_duplicates()`

**Used in templates:** House Price Prediction, Customer Segmentation, Disease Risk Prediction.""",
    },
    {
        "slug": "block-encode",
        "title": "Encode Categories",
        "section": "block-reference",
        "order": 21,
        "shortDescription": "Convert text columns into numbers that models can use.",
        "content": """## Encode Categories

**What it does:** Turns text/categorical columns (like "Yes"/"No", "Red"/"Blue"/"Green") into numeric values. One-Hot Encoding creates a new column for each category. Label Encoding assigns each category a number.

**When to use it:** When your dataset has text columns that you want to use as features. Most ML models only understand numbers.

**Why it matters:** If you feed text columns directly to a model, it will either crash or ignore them entirely. Encoding lets the model learn from categorical information.

**Backend:** `sklearn.preprocessing.OneHotEncoder`, `sklearn.preprocessing.LabelEncoder`

**Used in templates:** Customer Churn Prediction, Loan Default, Employee Attrition.""",
    },
    {
        "slug": "block-eda",
        "title": "Explore Data (EDA)",
        "section": "block-reference",
        "order": 22,
        "shortDescription": "Preview distributions, correlations, and class balance before modeling.",
        "content": """## Explore Data (EDA)

**What it does:** Shows a quick summary of your data — column statistics (mean, min, max), a correlation heatmap showing which columns are related, and class distribution for your target column.

**When to use it:** Before committing to a model. EDA helps you spot problems early — like highly correlated features (redundant information) or severe class imbalance.

**Why it matters:** Understanding your data before modeling prevents wasted effort. You might discover that a key column has 90% missing values, or that your target is 99% one class.

**Backend:** `pandas.DataFrame.describe()`, correlation matrix

**Used in templates:** Fraud Detection.""",
    },
    # --- Block Reference: Balancing & Validation ---
    {
        "slug": "block-balance",
        "title": "Balance Classes",
        "section": "block-reference",
        "order": 30,
        "shortDescription": "Create synthetic examples so rare classes aren't ignored by the model.",
        "content": """## Balance Classes

**What it does:** If one outcome is rare (e.g., only 2% of transactions are fraud), this block creates synthetic examples of the minority class using SMOTE, so the model doesn't just predict the majority class every time.

**When to use it:** When your target variable has a severe imbalance — one class is much more common than the other(s). Check the class distribution in the EDA block first.

**Why it matters:** An imbalanced dataset leads to a model that looks accurate but is actually useless. For example, if 98% of cases are "not fraud," a model that always predicts "not fraud" gets 98% accuracy but catches zero fraud.

**Backend:** `imblearn.over_sampling.SMOTE`

**Used in templates:** Customer Churn Prediction, Loan Default, Fraud Detection.""",
    },
    {
        "slug": "block-crossval",
        "title": "Cross-Validation",
        "section": "block-reference",
        "order": 31,
        "shortDescription": "Test the model on multiple data slices for a more trustworthy accuracy score.",
        "content": """## Cross-Validation

**What it does:** Instead of a single train/test split, this block tests your model on multiple different slices of the data (called "folds") and averages the results. The default is 5-fold cross-validation.

**When to use it:** When you want a more reliable estimate of model performance, especially on small datasets where a single split might be lucky or unlucky.

**Why it matters:** A single train/test split can give misleadingly high or low accuracy depending on which rows ended up in which set. Cross-validation smooths this out.

**Backend:** `sklearn.model_selection.cross_val_score`

**Used in templates:** Fraud Detection.""",
    },
    # --- Block Reference: More Models ---
    {
        "slug": "block-linear-regression",
        "title": "Linear Regression",
        "section": "block-reference",
        "order": 40,
        "shortDescription": "Predict a continuous number (price, revenue) instead of a category.",
        "content": """## Linear Regression

**What it does:** Predicts a continuous numeric value (like price, temperature, or revenue) by finding a straight-line relationship between input features and the target.

**When to use it:** When your target column is a number, not a category. For example, predicting house prices or employee salaries.

**Why it matters:** It's the simplest regression algorithm and a great baseline. If Linear Regression works well, you may not need a more complex model.

**Backend:** `sklearn.linear_model.LinearRegression`

**Used in templates:** House Price Prediction.""",
    },
    {
        "slug": "block-knn",
        "title": "K-Nearest Neighbors (KNN)",
        "section": "block-reference",
        "order": 41,
        "shortDescription": "Classify a data point based on what its closest neighbors are.",
        "content": """## K-Nearest Neighbors (KNN)

**What it does:** Classifies a new data point by looking at the K closest data points in the training set and taking a majority vote. If most neighbors are "spam," the new point is classified as "spam."

**When to use it:** When your data has clear clusters and you want a simple, interpretable model. Works well with small-to-medium datasets.

**Why it matters:** KNN makes no assumptions about the shape of your data. It's intuitive — similar things should be classified the same way.

**Backend:** `sklearn.neighbors.KNeighborsClassifier`""",
    },
    {
        "slug": "block-naive-bayes",
        "title": "Naive Bayes",
        "section": "block-reference",
        "order": 42,
        "shortDescription": "Fast, simple classifier ideal for text and spam-style problems.",
        "content": """## Naive Bayes

**What it does:** A probability-based classifier that assumes features are independent of each other. Despite this simplistic assumption, it often performs surprisingly well, especially on text data.

**When to use it:** When you need a fast baseline classifier, or when working with text/document classification (spam detection, sentiment analysis).

**Why it matters:** It's extremely fast to train and works well even with limited data. Often used as a first-pass model to beat.

**Backend:** `sklearn.naive_bayes.GaussianNB`""",
    },
    {
        "slug": "block-kmeans",
        "title": "K-Means Clustering",
        "section": "block-reference",
        "order": 43,
        "shortDescription": "Group similar rows together without a target column (unsupervised).",
        "content": """## K-Means Clustering

**What it does:** Groups your data rows into K clusters based on similarity. No target column is needed — the algorithm discovers natural groupings on its own.

**When to use it:** When you want to find patterns or segments in your data without predefined labels. Example: grouping customers by purchasing behavior.

**Why it matters:** Not every ML problem has a labeled target. Clustering lets you discover structure in unlabeled data.

**Important:** K-Means changes the pipeline — it does NOT need a Train-Test Split block or a target column. The results show a silhouette score instead of accuracy.

**Backend:** `sklearn.cluster.KMeans`

**Used in templates:** Customer Segmentation.""",
    },
    {
        "slug": "block-gradient-boosting",
        "title": "Gradient Boosting",
        "section": "block-reference",
        "order": 44,
        "shortDescription": "A stronger model that usually beats Random Forest on accuracy.",
        "content": """## Gradient Boosting

**What it does:** Builds many small decision trees sequentially, where each new tree tries to fix the mistakes of the previous ones. This "boosting" approach usually produces very accurate models.

**When to use it:** When you want the best possible accuracy and are willing to wait longer for training. Works for both classification and regression tasks.

**Why it matters:** Gradient Boosting is one of the most powerful traditional ML algorithms. It consistently wins Kaggle competitions and works well on tabular data.

**Backend:** `sklearn.ensemble.GradientBoostingClassifier` / `GradientBoostingRegressor`

**Used in templates:** Loan Default / Credit Risk.""",
    },
    # --- Block Reference: Tuning & Deployment ---
    {
        "slug": "block-tune",
        "title": "Tune Model",
        "section": "block-reference",
        "order": 50,
        "shortDescription": "Automatically try many settings and keep the best-performing one.",
        "content": """## Tune Model

**What it does:** Automatically searches through different hyperparameter combinations (like tree depth, learning rate, number of neighbors) and keeps the configuration that gives the best cross-validated score.

**When to use it:** After you've picked a model and want to squeeze out better performance. This is like fine-tuning a car's engine settings.

**Why it matters:** Default model settings are rarely optimal. Tuning can improve accuracy by 2-10% depending on the problem.

**Backend:** `sklearn.model_selection.GridSearchCV` / `RandomizedSearchCV`""",
    },
    {
        "slug": "block-export",
        "title": "Export Model",
        "section": "block-reference",
        "order": 51,
        "shortDescription": "Download the trained model file to use in your own code or app.",
        "content": """## Export Model

**What it does:** Saves your trained model to a `.joblib` file and lets you download it. You can then load this file in any Python script to make predictions without PredictIT.

**When to use it:** When you're happy with your model's performance and want to deploy it in your own application or share it with a colleague.

**Why it matters:** A trained model is only useful if you can use it outside of the training environment.

**Backend:** `joblib.dump()`, served via Cloudinary or direct download""",
    },
    {
        "slug": "block-predict-new",
        "title": "Predict New Data",
        "section": "block-reference",
        "order": 52,
        "shortDescription": "Upload fresh data (no target column) and get predictions from your trained model.",
        "content": """## Predict New Data

**What it does:** Upload a new CSV file (without the target column) and get predictions from your already-trained model. The predictions are returned as a downloadable CSV.

**When to use it:** After training a model, when you have new data you want to classify or predict values for.

**Why it matters:** This is the whole point of ML — making predictions on unseen data. Without this, your model just sits there.

**Backend:** Load saved model, `model.predict()`""",
    },
    # --- ML Glossary ---
    {
        "slug": "glossary-accuracy",
        "title": "Accuracy",
        "section": "ml-glossary",
        "order": 100,
        "content": """**Accuracy** is the percentage of predictions your model got right out of all predictions made. If your model correctly classified 85 out of 100 samples, accuracy is 85%. It's a good starting metric but can be misleading with imbalanced data.""",
    },
    {
        "slug": "glossary-precision",
        "title": "Precision",
        "section": "ml-glossary",
        "order": 101,
        "content": """**Precision** answers: "Of all the times the model predicted positive, how many were actually positive?" High precision means few false alarms. Important when false positives are costly (e.g., marking a legitimate email as spam).""",
    },
    {
        "slug": "glossary-recall",
        "title": "Recall",
        "section": "ml-glossary",
        "order": 102,
        "content": """**Recall** answers: "Of all the actual positives, how many did the model catch?" High recall means few missed cases. Important when false negatives are costly (e.g., missing a cancer diagnosis).""",
    },
    {
        "slug": "glossary-f1",
        "title": "F1 Score",
        "section": "ml-glossary",
        "order": 103,
        "content": """**F1 Score** is the harmonic mean of precision and recall, giving a single number that balances both. Ranges from 0 to 1. Use F1 when you need a balanced metric and can't afford to sacrifice either precision or recall.""",
    },
    {
        "slug": "glossary-confusion-matrix",
        "title": "Confusion Matrix",
        "section": "ml-glossary",
        "order": 104,
        "content": """A **Confusion Matrix** is a table showing correct and incorrect predictions broken down by class. Rows represent actual classes, columns represent predicted classes. It reveals exactly where your model makes mistakes — which classes it confuses with each other.""",
    },
    {
        "slug": "glossary-overfitting",
        "title": "Overfitting vs. Underfitting",
        "section": "ml-glossary",
        "order": 105,
        "content": """**Overfitting** means your model memorized the training data instead of learning general patterns — it scores high on training data but poorly on new data. **Underfitting** means the model is too simple to capture the patterns. Use cross-validation and train-test split to detect both.""",
    },
    {
        "slug": "glossary-train-test-split",
        "title": "Train/Test Split",
        "section": "ml-glossary",
        "order": 106,
        "content": """**Train/Test Split** divides your data into two parts: the training set (typically 70-80%) used to teach the model, and the test set (20-30%) used to evaluate how well it learned. This prevents you from testing on data the model has already seen.""",
    },
    {
        "slug": "glossary-feature-target",
        "title": "Feature vs. Target",
        "section": "ml-glossary",
        "order": 107,
        "content": """**Features** are the input columns your model uses to make predictions (e.g., age, income, education). The **Target** is the column you're trying to predict (e.g., "will this customer churn?"). Think of features as the question and the target as the answer.""",
    },
    {
        "slug": "glossary-class-imbalance",
        "title": "Class Imbalance",
        "section": "ml-glossary",
        "order": 108,
        "content": """**Class Imbalance** occurs when one class vastly outnumbers the other(s) in your dataset. For example, 98% "not fraud" vs. 2% "fraud." Models trained on imbalanced data tend to always predict the majority class. Use the Balance Classes block (SMOTE) to fix this.""",
    },
    {
        "slug": "glossary-rmse-r2",
        "title": "RMSE, MAE, and R²",
        "section": "ml-glossary",
        "order": 109,
        "content": """**RMSE** (Root Mean Squared Error) measures average prediction error — lower is better. **MAE** (Mean Absolute Error) is similar but less sensitive to outliers. **R²** (R-squared) measures how much of the variance your model explains — 1.0 is perfect, 0.0 means no better than guessing the mean.""",
    },
    # --- Template Walkthroughs ---
    {
        "slug": "walkthrough-beginner-classification",
        "title": "Beginner Classification",
        "section": "template-walkthroughs",
        "order": 200,
        "content": """## Why These Blocks, In This Order

**Data Upload → Preprocess → Train-Test Split → Logistic Regression → Results**

This is the simplest possible ML pipeline. It teaches the core flow:

1. **Data Upload** — you always start with data.
2. **Preprocess (StandardScaler)** — Logistic Regression works better when features are on the same scale.
3. **Train-Test Split (80/20)** — ensures we measure real-world accuracy, not memorization.
4. **Logistic Regression** — the simplest classification algorithm. Fast, interpretable, and a great baseline.
5. **Results** — see accuracy, precision, recall, and confusion matrix.

Start here if you've never built an ML pipeline before.""",
    },
    {
        "slug": "walkthrough-customer-churn",
        "title": "Customer Churn Prediction",
        "section": "template-walkthroughs",
        "order": 201,
        "content": """## Why These Blocks, In This Order

**Data Upload → Encode Categories → Balance Classes → Preprocess → Split → Random Forest → Results**

Customer churn data typically has two challenges: categorical features (department, contract type) and class imbalance (most customers don't churn).

1. **Encode Categories** — converts text columns like "Month-to-month" into numbers.
2. **Balance Classes (SMOTE)** — churn is rare (~15-20%), so SMOTE creates synthetic examples of churned customers.
3. **Preprocess** — scales numeric features.
4. **Random Forest** — handles non-linear relationships well and is robust to noise.

Random Forest + SMOTE is a proven combo for imbalanced classification problems.""",
    },
    {
        "slug": "walkthrough-house-price",
        "title": "House Price Prediction",
        "section": "template-walkthroughs",
        "order": 202,
        "content": """## Why These Blocks, In This Order

**Data Upload → Clean Data → Preprocess → Split → Linear Regression → Results**

House price data often has missing values (not every listing has garage size or pool info). This is a regression task — predicting a number, not a category.

1. **Clean Data (mean fill)** — fills missing values with column averages.
2. **Preprocess** — scales features so square footage and number of bedrooms are on the same range.
3. **Linear Regression** — simple and interpretable for numeric predictions.

Results show RMSE, MAE, and R² instead of accuracy.""",
    },
    {
        "slug": "walkthrough-customer-segmentation",
        "title": "Customer Segmentation",
        "section": "template-walkthroughs",
        "order": 203,
        "content": """## Why These Blocks, In This Order

**Data Upload → Clean Data → Preprocess → K-Means Clustering → Results**

This is an **unsupervised** pipeline — there's no target column. K-Means finds natural groups in your data.

1. **Clean Data** — removes duplicates and fills gaps.
2. **Preprocess** — K-Means is distance-based, so scaling is critical.
3. **K-Means (3 clusters)** — groups customers into 3 segments.

Notice: **no Train-Test Split**. Unsupervised learning doesn't split data. Results show a silhouette score (how well-separated the clusters are).""",
    },
    {
        "slug": "walkthrough-loan-default",
        "title": "Loan Default / Credit Risk",
        "section": "template-walkthroughs",
        "order": 204,
        "content": """## Why These Blocks, In This Order

**Data Upload → Encode Categories → Balance Classes → Preprocess → Split → Gradient Boosting → Results**

Credit risk data has both categorical features (employment type, marital status) and severe imbalance (most loans are repaid).

1. **Encode Categories** — loan applications have many text fields.
2. **Balance Classes** — defaults are rare (~5-10%), SMOTE helps.
3. **Gradient Boosting** — the most powerful algorithm for tabular data. Worth the extra training time for financial decisions.

Gradient Boosting typically achieves 2-5% higher accuracy than Random Forest on structured data.""",
    },
    {
        "slug": "walkthrough-fraud-detection",
        "title": "Fraud Detection",
        "section": "template-walkthroughs",
        "order": 205,
        "content": """## Why These Blocks, In This Order

**Data Upload → Explore Data → Balance Classes → Preprocess → Split → Cross-Validation → Random Forest → Results**

Fraud is extremely rare (<1% of transactions), so this pipeline is built around handling that challenge.

1. **Explore Data** — check class distribution to see how imbalanced the data is.
2. **Balance Classes (SMOTE)** — critical for fraud detection.
3. **Cross-Validation (5-fold)** — a single split might miss fraud patterns. Cross-validation gives a more trustworthy accuracy estimate.
4. **Random Forest** — handles complex patterns and is resistant to overfitting.

This is the most thorough pipeline template, designed for high-stakes predictions.""",
    },
    {
        "slug": "walkthrough-employee-attrition",
        "title": "Employee Attrition",
        "section": "template-walkthroughs",
        "order": 206,
        "content": """## Why These Blocks, In This Order

**Data Upload → Encode Categories → Preprocess → Split → Decision Tree → Results**

HR data has many categorical columns (department, job role, education field). Decision Trees handle this well and produce interpretable rules.

1. **Encode Categories (Label Encoding)** — converts department names, job roles, etc. to numbers.
2. **Decision Tree** — creates human-readable rules like "IF overtime=yes AND job_satisfaction<3 THEN likely to leave." Great for explaining to HR teams.

Decision Trees are chosen here for interpretability — HR needs to understand *why* someone might leave.""",
    },
    {
        "slug": "walkthrough-disease-risk",
        "title": "Disease Risk Prediction",
        "section": "template-walkthroughs",
        "order": 207,
        "content": """## Why These Blocks, In This Order

**Data Upload → Clean Data → Preprocess → Split → SVM → Results**

Medical data often has missing records and needs careful preprocessing. SVM (Support Vector Machine) works well for binary classification tasks.

1. **Clean Data (median fill)** — medical data often has missing values. Median is more robust than mean for skewed medical measurements.
2. **Preprocess** — SVM requires scaled features to work properly.
3. **SVM** — effective for binary classification (disease/no disease) and works well with high-dimensional medical feature sets.

Median imputation is preferred over mean for medical data because outliers (extreme lab values) can skew the mean.""",
    },
]
