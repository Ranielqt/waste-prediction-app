Waste Prediction App – README
🗑️ Project Title
A Random Forest Model for Predicting Garbage Accumulation in Cagayan de Oro Using Local Event and Weather Data

📌 Overview
This mobile application uses a Random Forest machine learning model to predict daily garbage accumulation and overflow risks across barangays in Cagayan de Oro (CDO), Philippines. It helps improve waste management through data-driven insights.

🎯 Problem Definition
Garbage overflow and delayed collection are persistent issues in CDO due to:

Limited resources

Reactive waste collection strategies

Seasonal weather and local events (fiestas, market days)

Goal: Predict garbage volume and overflow risk per barangay using historical waste data, weather, and local events to enable proactive waste management.

📊 Machine Learning Approach
Supervised Learning with labeled historical data

Regression Task: Predict garbage volume (kg) for the next day

Classification Task: Predict overflow risk (Overflow / Safe)

Algorithm: Random Forest Regressor & Classifier

🛠️ Features
📈 Daily garbage volume predictions per barangay

🚨 Overflow risk alerts

🌤️ Weather & event-based forecasting

📍 Barangay-level insights

📱 Mobile-friendly interface built with React Native & Expo

📁 Dataset Structure
Feature	Description	Type
date	Date of record	Date
barangay	Barangay name	Categorical
rain_mm	Daily rainfall (mm)	Numeric
is_market_day	Market day indicator	Binary
is_fiesta	Fiesta day indicator	Binary
past_volume	Previous day's garbage (kg)	Numeric
next_day_volume	Target for regression	Numeric
overflow_risk	Target for classification	Binary
Size: ~1,000–2,000 records from 8–15 barangays over 120–180 days.

🔗 Data Sources (Philippine)
PAGASA Climate Data – Rainfall & weather

PSA Population Data – Barangay demographics

CDO City Government Website – Local event schedules

CLENRO-CDO – Waste collection logs (if available)

🧠 Model Workflow
Data Collection – Gather historical waste, weather, and event data

Preprocessing – Handle missing values, normalize features

Feature Engineering – Create lag features, event indicators

Model Training – Train Random Forest models

Evaluation – MAE, RMSE, Accuracy, F1-Score

Interpretation – SHAP values for feature importance

📈 Expected Output
Predictive Tool – Daily garbage volume & overflow risk forecasts

Visual Dashboard – Barangay map with risk levels

Operational Recommendations – Optimized collection schedules

👥 Target Users
CLENRO-CDO – Route optimization & resource allocation

Barangay Officials – Local cleanup scheduling

City Planners – Waste management policy improvement

🚀 Impact
✅ Reduced garbage overflow events

✅ Cleaner streets & improved drainage

✅ Efficient waste collection operations

✅ Data-driven decision-making for LGUs

