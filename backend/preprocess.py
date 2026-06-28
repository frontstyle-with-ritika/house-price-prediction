import pandas as pd
import numpy as np
import calendar

def preprocess_input(user_dict, feature_columns, scaler, float_cols):
    """
    Takes raw user input dict, applies all preprocessing steps,
    returns a DataFrame ready for model.predict()
    """

    df = pd.DataFrame([user_dict])

    # ── 1. FILL MISSING VALUES ──────────────────────────────────────────────

    # Categorical — fill with 'None' (no feature present)
    none_cols = [
        'Alley', 'FireplaceQu', 'PoolQC', 'Fence', 'MiscFeature',
        'GarageCond', 'GarageQual', 'GarageFinish', 'GarageType',
        'BsmtCond', 'BsmtExposure', 'BsmtQual', 'BsmtFinType2', 'BsmtFinType1',
        'MasVnrType'
    ]
    for col in none_cols:
        if col not in df.columns:
            df[col] = 'None'
        else:
            df[col] = df[col].fillna('None')

    # Numerical — fill with 0
    zero_cols = ['MasVnrArea', 'GarageYrBlt', 'BsmtFinSF1', 'BsmtFinSF2',
                 'BsmtUnfSF', 'TotalBsmtSF', 'BsmtFullBath', 'BsmtHalfBath',
                 'GarageCars', 'GarageArea']
    for col in zero_cols:
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = df[col].fillna(0)

    # ── 2. MONTH NAME CONVERSION ────────────────────────────────────────────
    if 'MoSold' in df.columns:
        df['MoSold'] = df['MoSold'].apply(
            lambda x: list(calendar.month_abbr).index(x) if isinstance(x, str) else int(x)
        )

    # ── 3. CONVERT YEAR/DATE COLS TO STRING (then back to int later) ────────
    for_num_conv = ["MSSubClass", "YearBuilt", "YearRemodAdd", "GarageYrBlt",
                    "MoSold", "YrSold"]
    for feat in for_num_conv:
        if feat in df.columns:
            df[feat] = df[feat].astype(str)

    # ── 4. ORDINAL ENCODING ─────────────────────────────────────────────────
    qual_map = {"None": 0, "Po": 1, "Fa": 2, "TA": 3, "Gd": 4, "Ex": 5}
    for col in ["ExterQual", "ExterCond", "BsmtQual", "BsmtCond",
                "HeatingQC", "KitchenQual", "FireplaceQu",
                "GarageQual", "GarageCond", "PoolQC"]:
        if col in df.columns:
            df[col] = df[col].map(qual_map).fillna(0).astype(int)

    bsmt_exp_map = {"None": 0, "No": 1, "Mn": 2, "Av": 3, "Gd": 4}
    if 'BsmtExposure' in df.columns:
        df['BsmtExposure'] = df['BsmtExposure'].map(bsmt_exp_map).fillna(0).astype(int)

    bsmt_fin_map = {"None": 0, "Unf": 1, "LwQ": 2, "Rec": 3, "BLQ": 4, "ALQ": 5, "GLQ": 6}
    for col in ['BsmtFinType1', 'BsmtFinType2']:
        if col in df.columns:
            df[col] = df[col].map(bsmt_fin_map).fillna(0).astype(int)

    paved_map = {"N": 0, "P": 1, "Y": 2}
    if 'PavedDrive' in df.columns:
        df['PavedDrive'] = df['PavedDrive'].map(paved_map).fillna(0).astype(int)

    garage_fin_map = {"None": 0, "Unf": 1, "RFn": 2, "Fin": 3}
    if 'GarageFinish' in df.columns:
        df['GarageFinish'] = df['GarageFinish'].map(garage_fin_map).fillna(0).astype(int)

    ordinal_cols = {
        'LotShape'  : ['IR3', 'IR2', 'IR1', 'Reg'],
        'LandSlope' : ['Sev', 'Mod', 'Gtl'],
        'Street'    : ['Grvl', 'Pave'],
        'Alley'     : ['None', 'Grvl', 'Pave'],
        'CentralAir': ['N', 'Y'],
        'Functional': ['Sal', 'Sev', 'Maj2', 'Maj1', 'Mod', 'Min2', 'Min1', 'Typ'],
        'Fence'     : ['NA', 'MnWw', 'GdWo', 'MnPrv', 'GdPrv'],
    }
    for col, order in ordinal_cols.items():
        if col in df.columns:
            mapping = {val: i for i, val in enumerate(order)}
            df[col] = df[col].map(mapping).fillna(0).astype(int)

    # ── 5. YEAR COLUMNS → INT ───────────────────────────────────────────────
    year_cols = ['YearBuilt', 'YearRemodAdd', 'GarageYrBlt', 'YrSold']
    for col in year_cols:
        if col in df.columns:
            df[col] = df[col].astype(float).astype(int)

    month_map = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
                 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
                 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12}
    if 'MoSold' in df.columns:
        df['MoSold'] = df['MoSold'].replace(month_map)
        df['MoSold'] = pd.to_numeric(df['MoSold'], errors='coerce').fillna(1).astype(int)

    # ── 6. ONE-HOT ENCODING ─────────────────────────────────────────────────
    nominal_cols = [
        'MSSubClass', 'MSZoning', 'LandContour', 'LotConfig', 'Neighborhood',
        'Condition1', 'Condition2', 'BldgType', 'HouseStyle', 'RoofStyle',
        'RoofMatl', 'Exterior1st', 'Exterior2nd', 'MasVnrType', 'Foundation',
        'Heating', 'Electrical', 'GarageType', 'MiscFeature', 'SaleType',
        'SaleCondition',
    ]
    existing_nominal = [c for c in nominal_cols if c in df.columns]
    df = pd.get_dummies(df, columns=existing_nominal, drop_first=True)

    # ── 7. BOOL → INT ───────────────────────────────────────────────────────
    bool_cols = df.select_dtypes(include='bool').columns.tolist()
    df[bool_cols] = df[bool_cols].astype(int)

    # ── 8. DROP UTILITIES (dropped during training) ──────────────────────────
    if 'Utilities' in df.columns:
        df.drop(columns=['Utilities'], inplace=True)

    # ── 9. ALIGN COLUMNS TO TRAINING FEATURE SET ────────────────────────────
    df = df.reindex(columns=feature_columns, fill_value=0)

    # ── 10. SCALE FLOAT COLUMNS ─────────────────────────────────────────────
    existing_float = [c for c in float_cols if c in df.columns]
    if existing_float:
        df[existing_float] = scaler.transform(df[existing_float])

    return df
