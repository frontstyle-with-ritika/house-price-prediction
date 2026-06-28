from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from preprocess import preprocess_input

app = Flask(__name__)
CORS(app)  # Allow React frontend to call this API

# ── Load all saved artifacts once at startup ────────────────────────────────
model           = joblib.load('house_price_xgb_model.pkl')
scaler          = joblib.load('scaler.pkl')
feature_columns = joblib.load('feature_columns.pkl')
float_cols      = joblib.load('float_cols.pkl')

print(f"✅ Model loaded — {len(feature_columns)} features expected")


@app.route('/')
def home():
    return jsonify({"status": "House Price Predictor API is running!"})


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        user_dict = {
            'MSSubClass'   : str(data.get('MSSubClass', '20')),
            'MSZoning'     : data.get('MSZoning', 'RL'),
            'LotFrontage'  : float(data.get('LotFrontage', 0) or 0),
            'LotArea'      : float(data.get('LotArea', 0) or 0),
            'Street'       : data.get('Street', 'Pave'),
            'Alley'        : data.get('Alley', 'None'),
            'LotShape'     : data.get('LotShape', 'Reg'),
            'LandContour'  : data.get('LandContour', 'Lvl'),
            'LotConfig'    : data.get('LotConfig', 'Inside'),
            'LandSlope'    : data.get('LandSlope', 'Gtl'),
            'Neighborhood' : data.get('Neighborhood', 'NAmes'),
            'Condition1'   : data.get('Condition1', 'Norm'),
            'Condition2'   : data.get('Condition2', 'Norm'),
            'BldgType'     : data.get('BldgType', '1Fam'),
            'HouseStyle'   : data.get('HouseStyle', '1Story'),
            'OverallQual'  : int(data.get('OverallQual', 5) or 5),
            'OverallCond'  : int(data.get('OverallCond', 5) or 5),
            'YearBuilt'    : int(data.get('YearBuilt', 2000) or 2000),
            'YearRemodAdd' : int(data.get('YearRemodAdd', 2000) or 2000),
            'RoofStyle'    : data.get('RoofStyle', 'Gable'),
            'RoofMatl'     : data.get('RoofMatl', 'CompShg'),
            'Exterior1st'  : data.get('Exterior1st', 'VinylSd'),
            'Exterior2nd'  : data.get('Exterior2nd', 'VinylSd'),
            'MasVnrType'   : data.get('MasVnrType', 'None'),
            'MasVnrArea'   : float(data.get('MasVnrArea', 0) or 0),
            'ExterQual'    : data.get('ExterQual', 'TA'),
            'ExterCond'    : data.get('ExterCond', 'TA'),
            'Foundation'   : data.get('Foundation', 'PConc'),
            'BsmtQual'     : data.get('BsmtQual', 'TA'),
            'BsmtCond'     : data.get('BsmtCond', 'TA'),
            'BsmtExposure' : data.get('BsmtExposure', 'No'),
            'BsmtFinType1' : data.get('BsmtFinType1', 'Unf'),
            'BsmtFinSF1'   : float(data.get('BsmtFinSF1', 0) or 0),
            'BsmtFinType2' : data.get('BsmtFinType2', 'Unf'),
            'BsmtFinSF2'   : float(data.get('BsmtFinSF2', 0) or 0),
            'BsmtUnfSF'    : float(data.get('BsmtUnfSF', 0) or 0),
            'TotalBsmtSF'  : float(data.get('TotalBsmtSF', 0) or 0),
            'Heating'      : data.get('Heating', 'GasA'),
            'HeatingQC'    : data.get('HeatingQC', 'TA'),
            'CentralAir'   : data.get('CentralAir', 'Y'),
            'Electrical'   : data.get('Electrical', 'SBrkr'),
            '1stFlrSF'     : float(data.get('1stFlrSF', 0) or 0),
            '2ndFlrSF'     : float(data.get('2ndFlrSF', 0) or 0),
            'LowQualFinSF' : float(data.get('LowQualFinSF', 0) or 0),
            'GrLivArea'    : float(data.get('GrLivArea', 0) or 0),
            'BsmtFullBath' : int(data.get('BsmtFullBath', 0) or 0),
            'BsmtHalfBath' : int(data.get('BsmtHalfBath', 0) or 0),
            'FullBath'     : int(data.get('FullBath', 1) or 1),
            'HalfBath'     : int(data.get('HalfBath', 0) or 0),
            'BedroomAbvGr' : int(data.get('BedroomAbvGr', 3) or 3),
            'KitchenAbvGr' : int(data.get('KitchenAbvGr', 1) or 1),
            'KitchenQual'  : data.get('KitchenQual', 'TA'),
            'TotRmsAbvGrd' : int(data.get('TotRmsAbvGrd', 6) or 6),
            'Functional'   : data.get('Functional', 'Typ'),
            'Fireplaces'   : int(data.get('Fireplaces', 0) or 0),
            'FireplaceQu'  : data.get('FireplaceQu', 'None'),
            'GarageType'   : data.get('GarageType', 'None'),
            'GarageYrBlt'  : float(data.get('GarageYrBlt', 0) or 0),
            'GarageFinish' : data.get('GarageFinish', 'None'),
            'GarageCars'   : int(data.get('GarageCars', 0) or 0),
            'GarageArea'   : float(data.get('GarageArea', 0) or 0),
            'GarageQual'   : data.get('GarageQual', 'None'),
            'GarageCond'   : data.get('GarageCond', 'None'),
            'PavedDrive'   : data.get('PavedDrive', 'Y'),
            'WoodDeckSF'   : float(data.get('WoodDeckSF', 0) or 0),
            'OpenPorchSF'  : float(data.get('OpenPorchSF', 0) or 0),
            'EnclosedPorch': float(data.get('EnclosedPorch', 0) or 0),
            '3SsnPorch'    : float(data.get('3SsnPorch', 0) or 0),
            'ScreenPorch'  : float(data.get('ScreenPorch', 0) or 0),
            'PoolArea'     : float(data.get('PoolArea', 0) or 0),
            'PoolQC'       : data.get('PoolQC', 'None'),
            'Fence'        : data.get('Fence', 'NA'),
            'MiscFeature'  : data.get('MiscFeature', 'None'),
            'MiscVal'      : float(data.get('MiscVal', 0) or 0),
            'MoSold'       : int(data.get('MoSold', 6) or 6),
            'YrSold'       : int(data.get('YrSold', 2010) or 2010),
            'SaleType'     : data.get('SaleType', 'WD'),
            'SaleCondition': data.get('SaleCondition', 'Normal'),
        }

        X = preprocess_input(user_dict, feature_columns, scaler, float_cols)
        prediction = model.predict(X)[0]

        return jsonify({
            "success": True,
            "predicted_price": round(float(prediction), 2),
            "formatted_price": f"${prediction:,.0f}"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5000)
