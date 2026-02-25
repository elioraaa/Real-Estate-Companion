# ML Service

Flask-based REST API that serves Tirana property listings, runs price predictions using a trained XGBoost model, and returns comparable properties.

Runs on `http://127.0.0.1:5001` by default.

---

## Stack

| Package | Version |
|---|---|
| Python | 3.11+ |
| Flask | 3.1.3 |
| flask-cors | 6.0.2 |
| XGBoost | 3.2.0 |
| scikit-learn | 1.7.2 |
| pandas | 2.3.3 |
| numpy | 2.2.6 |
| joblib | 1.5.3 |

Full list in `requirements.txt`.

---

## Setup

```bash
cd ml

# Create and activate virtual environment
python3.11 -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

---

## Run

```bash
python app.py
```

The dataset (`tirana_house_prices.json`) is loaded and cleaned once at startup. The trained model artifacts are already committed to the repo, so no retraining is needed to run the API.

---

## Train / Retrain (optional)

Only needed if you want to update the model after changing the dataset or features.

```bash
python ml_model.py
```

This trains a new XGBoost model and overwrites the three artifact files:

| File | Contents |
|---|---|
| `tirana_price_model.joblib` | Trained XGBoost model |
| `feature_names.joblib` | Ordered list of feature column names |
| `tirana_centers.joblib` | Tirana landmark coordinates used for distance features |

Training prints MAE (in €) and R² score on the held-out test set (80/20 split).

---

## Model

**Algorithm:** XGBoost Regressor
**Hyperparameters:** `n_estimators=300`, `learning_rate=0.05`, `max_depth=6`, `random_state=42`, `n_jobs=-1`
**Target:** `log(price_in_euro)` — predictions are exponentiated back to EUR before returning.

### Features (12 total)

| Feature | Description |
|---|---|
| `main_property_property_square` | Area in m² |
| `main_property_property_composition_bedrooms` | Number of bedrooms |
| `main_property_property_composition_bathrooms` | Number of bathrooms |
| `main_property_floor` | Floor number |
| `main_property_has_elevator` | Boolean |
| `main_property_has_parking_space` | Boolean |
| `main_property_has_garage` | Boolean |
| `main_property_has_terrace` | Boolean |
| `total_rooms` | Bedrooms + bathrooms + living rooms |
| `dist_city_center` | Haversine distance (km) to Skanderbeg Square |
| `dist_blloku` | Haversine distance (km) to Blloku neighborhood |
| `dist_grand_park` | Haversine distance (km) to Grand Park |

Missing values are filled with `0` before prediction.

---

## Data Cleaning

Applied by `data_cleaning.py` on every startup:

1. Remove duplicate rows
2. Fill missing boolean amenity columns with `False`
3. Remove listings outside price range **€33,000 – €1,000,000**
4. Remove listings outside the 1st–99th percentile of area (m²)
5. Filter to valid Tirana coordinates: lat `41.25–41.38`, lng `19.75–19.95`

---

## API Endpoints

### `GET /health`

Returns server status.

```json
{ "status": "ok", "message": "ML API is running" }
```

---

### `GET /listings`

Returns a list of cleaned listings. Supports optional query parameters for server-side filtering.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 20 | Max number of results |
| `min_price` | float | 0 | Minimum price in EUR |
| `max_price` | float | 9999999 | Maximum price in EUR |
| `min_area` | float | 0 | Minimum area in m² |
| `max_area` | float | 9999999 | Maximum area in m² |
| `bedrooms` | int | — | Exact bedroom count (optional) |

Each listing includes: price, currency, area, bedrooms, bathrooms, living rooms, balconies, kitchens, floor, type, status, lat/lng, address, furnishing status, amenity booleans, and description text.

```bash
curl "http://127.0.0.1:5001/listings?limit=5&min_price=50000&max_price=200000&bedrooms=2"
```

---

### `GET /listings/<id>`

Returns a single listing by its **0-based row index** in the cleaned dataframe.

> Note: The `id` field returned by `GET /listings` is 1-based. To fetch that listing directly, use `id - 1` here.

```bash
curl http://127.0.0.1:5001/listings/0
```

---

### `POST /predict`

Accepts a property as a JSON object and returns a price estimate.

**Request body** (all fields optional — missing values default to `0`):

```json
{
  "main_property_property_square": 85,
  "main_property_property_composition_bedrooms": 2,
  "main_property_property_composition_bathrooms": 1,
  "main_property_property_composition_living_rooms": 1,
  "main_property_floor": 3,
  "main_property_has_elevator": true,
  "main_property_has_parking_space": false,
  "main_property_has_garage": false,
  "main_property_has_terrace": false,
  "lat": 41.32795,
  "lng": 19.81902
}
```

**Response:**

```json
{
  "estimate": 142000,
  "low": 127800,
  "high": 156200
}
```

`low` = `estimate × 0.90`, `high` = `estimate × 1.10`.

```bash
curl -s -X POST http://127.0.0.1:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"main_property_property_square":85,"main_property_property_composition_bedrooms":2,"lat":41.32795,"lng":19.81902}'
```

---

### `GET /comps/<id>`

Returns the 5 most comparable properties to the listing at the given 0-based index.

Similarity is scored by combining two normalized metrics:
- **Distance score** — haversine distance (km) from the subject property
- **Area score** — absolute difference in m²

Both are normalized to `[0, 1]` and summed. Lower score = more similar.

**Response** (array of 5):

```json
[
  {
    "price_in_euro": 135000,
    "main_property_property_square": 82,
    "main_property_property_composition_bedrooms": 2,
    "main_property_location_lat": 41.329,
    "main_property_location_lng": 19.821
  }
]
```

```bash
curl http://127.0.0.1:5001/comps/0
```

---

## Troubleshooting

**`libomp` error on macOS:**
```bash
brew install libomp
```

**Port 5001 already in use:**
```bash
# Check what is using the port
lsof -nP -iTCP:5001 -sTCP:LISTEN

# Then kill it or change the port in app.py
```

**Model files missing (`tirana_price_model.joblib` not found):**
Run `python ml_model.py` to retrain and regenerate the artifacts.
