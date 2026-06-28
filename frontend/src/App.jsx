import React, { useState } from 'react';
import './App.css';

// ── Reusable field components ────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
);

const Input = ({ name, value, onChange, placeholder, type = 'number', min, max }) => (
  <input
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    max={max}
  />
);

const Select = ({ name, value, onChange, options }) => (
  <select name={name} value={value} onChange={onChange}>
    {options.map(opt =>
      typeof opt === 'string'
        ? <option key={opt} value={opt}>{opt}</option>
        : <option key={opt.value} value={opt.value}>{opt.label}</option>
    )}
  </select>
);

// ── Section card wrapper ─────────────────────────────────────────────────────
const SectionCard = ({ icon, title, children }) => (
  <div className="section-card">
    <div className="section-header">
      <span className="icon">{icon}</span>
      <h2>{title}</h2>
    </div>
    <div className="section-body">{children}</div>
  </div>
);

// ── Default form values ──────────────────────────────────────────────────────
const defaultForm = {
  MSSubClass: '20', MSZoning: 'RL', LotFrontage: '', LotArea: '',
  LotShape: 'Reg', LotConfig: 'Inside', LandContour: 'Lvl', LandSlope: 'Gtl',
  Neighborhood: 'NAmes', Condition1: 'Norm', Condition2: 'Norm',
  BldgType: '1Fam', HouseStyle: '1Story',
  OverallQual: '5', OverallCond: '5',
  YearBuilt: '', YearRemodAdd: '',
  RoofStyle: 'Gable', RoofMatl: 'CompShg',
  Exterior1st: 'VinylSd', Exterior2nd: 'VinylSd',
  MasVnrType: 'None', MasVnrArea: '0',
  ExterQual: 'TA', ExterCond: 'TA', Foundation: 'PConc',
  BsmtQual: 'TA', BsmtCond: 'TA', BsmtExposure: 'No',
  BsmtFinType1: 'Unf', BsmtFinSF1: '0',
  BsmtFinType2: 'Unf', BsmtFinSF2: '0',
  BsmtUnfSF: '0', TotalBsmtSF: '',
  Heating: 'GasA', HeatingQC: 'TA', CentralAir: 'Y', Electrical: 'SBrkr',
  '1stFlrSF': '', '2ndFlrSF': '0', LowQualFinSF: '0', GrLivArea: '',
  BsmtFullBath: '0', BsmtHalfBath: '0', FullBath: '2', HalfBath: '0',
  BedroomAbvGr: '3', KitchenAbvGr: '1', KitchenQual: 'TA',
  TotRmsAbvGrd: '6', Functional: 'Typ', Fireplaces: '0', FireplaceQu: 'None',
  GarageType: 'Attchd', GarageYrBlt: '', GarageFinish: 'Unf',
  GarageCars: '2', GarageArea: '', GarageQual: 'TA', GarageCond: 'TA',
  PavedDrive: 'Y',
  WoodDeckSF: '0', OpenPorchSF: '0', EnclosedPorch: '0',
  '3SsnPorch': '0', ScreenPorch: '0',
  PoolArea: '0', PoolQC: 'None', Fence: 'NA',
  MiscFeature: 'None', MiscVal: '0',
  MoSold: '6', YrSold: '2010', SaleType: 'WD', SaleCondition: 'Normal',
};

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [form, setForm]           = useState(defaultForm);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Location', 'Building', 'Living Area', 'Basement', 'Garage', 'Exterior', 'Sale'];

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.formatted_price);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Could not connect to the server. Make sure Flask is running.');
    } finally {
      setLoading(false);
    }
  };

  const q = (n) => Array.from({ length: n }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

  return (
    <div className="app">
      {/* ── HEADER ── */}
      <header>
        <div className="logo">🏠</div>
        <div>
          <h1>House<span>Price</span> Predictor</h1>
          <p className="tagline">Powered by XGBoost · Ames Housing Dataset</p>
        </div>
      </header>

      {/* ── RESULT BANNER ── */}
      {result && (
        <div className="result-banner success">
          <div className="result-icon">✅</div>
          <div>
            <div className="result-label">Estimated Sale Price</div>
            <div className="result-price">{result}</div>
          </div>
          <button className="close-btn" onClick={() => setResult(null)}>×</button>
        </div>
      )}
      {error && (
        <div className="result-banner error">
          <div className="result-icon">⚠️</div>
          <div>
            <div className="result-label">Error</div>
            <div className="result-error">{error}</div>
          </div>
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* ── STEP NAV ── */}
      <div className="step-nav">
        {steps.map((s, i) => (
          <button
            key={s}
            className={`step-btn ${activeStep === i ? 'active' : ''}`}
            onClick={() => setActiveStep(i)}
            type="button"
          >
            <span className="step-num">{i + 1}</span>
            <span className="step-label">{s}</span>
          </button>
        ))}
      </div>

      {/* ── FORM ── */}
      <div className="form-wrapper">
        <form onSubmit={handleSubmit}>

          {/* STEP 0: Location & Lot */}
          {activeStep === 0 && (
            <SectionCard icon="📍" title="Location & Lot">
              <Field label="Neighborhood">
                <Select name="Neighborhood" value={form.Neighborhood} onChange={handleChange} options={[
                  'NAmes','CollgCr','OldTown','Edwards','Somerst','NridgHt','Gilbert',
                  'Sawyer','NWAmes','SawyerW','BrkSide','Crawfor','Mitchel','NoRidge',
                  'Timber','IDOTRR','ClearCr','StoneBr','SWISU','Blmngtn','MeadowV',
                  'BrDale','Veenker','NPkVill','Blueste'
                ]} />
              </Field>
              <Field label="MS Zoning">
                <Select name="MSZoning" value={form.MSZoning} onChange={handleChange} options={[
                  { value: 'RL', label: 'RL – Residential Low' },
                  { value: 'RM', label: 'RM – Residential Medium' },
                  { value: 'FV', label: 'FV – Floating Village' },
                  { value: 'RH', label: 'RH – Residential High' },
                  { value: 'C (all)', label: 'C – Commercial' },
                ]} />
              </Field>
              <Field label="Lot Area (sq ft)">
                <Input name="LotArea" value={form.LotArea} onChange={handleChange} placeholder="e.g. 8450" min="0" />
              </Field>
              <Field label="Lot Frontage (ft)">
                <Input name="LotFrontage" value={form.LotFrontage} onChange={handleChange} placeholder="e.g. 65" min="0" />
              </Field>
              <Field label="Lot Shape">
                <Select name="LotShape" value={form.LotShape} onChange={handleChange} options={[
                  { value: 'Reg', label: 'Regular' },
                  { value: 'IR1', label: 'Slightly Irregular' },
                  { value: 'IR2', label: 'Moderately Irregular' },
                  { value: 'IR3', label: 'Irregular' },
                ]} />
              </Field>
              <Field label="Lot Config">
                <Select name="LotConfig" value={form.LotConfig} onChange={handleChange} options={['Inside','Corner','CulDSac','FR2','FR3']} />
              </Field>
              <Field label="Land Contour">
                <Select name="LandContour" value={form.LandContour} onChange={handleChange} options={[
                  { value: 'Lvl', label: 'Lvl – Near Flat' },
                  { value: 'Bnk', label: 'Bnk – Banked' },
                  { value: 'HLS', label: 'HLS – Hillside' },
                  { value: 'Low', label: 'Low – Depression' },
                ]} />
              </Field>
              <Field label="Land Slope">
                <Select name="LandSlope" value={form.LandSlope} onChange={handleChange} options={[
                  { value: 'Gtl', label: 'Gentle' },
                  { value: 'Mod', label: 'Moderate' },
                  { value: 'Sev', label: 'Severe' },
                ]} />
              </Field>
            </SectionCard>
          )}

          {/* STEP 1: Building */}
          {activeStep === 1 && (
            <SectionCard icon="🏗️" title="Building Details">
              <Field label="Building Type">
                <Select name="BldgType" value={form.BldgType} onChange={handleChange} options={[
                  { value: '1Fam', label: 'Single Family' },
                  { value: '2fmCon', label: '2-Family Conversion' },
                  { value: 'Duplex', label: 'Duplex' },
                  { value: 'TwnhsE', label: 'Townhouse End' },
                  { value: 'Twnhs', label: 'Townhouse Inside' },
                ]} />
              </Field>
              <Field label="House Style">
                <Select name="HouseStyle" value={form.HouseStyle} onChange={handleChange} options={[
                  { value: '1Story', label: '1 Story' },
                  { value: '2Story', label: '2 Story' },
                  { value: '1.5Fin', label: '1.5 Story Finished' },
                  { value: 'SFoyer', label: 'Split Foyer' },
                  { value: 'SLvl', label: 'Split Level' },
                ]} />
              </Field>
              <Field label="MS SubClass">
                <Select name="MSSubClass" value={form.MSSubClass} onChange={handleChange} options={[
                  { value: '20', label: '20 – 1-Story 1946+' },
                  { value: '60', label: '60 – 2-Story 1946+' },
                  { value: '50', label: '50 – 1.5-Story Finished' },
                  { value: '70', label: '70 – 2-Story Pre-1945' },
                  { value: '80', label: '80 – Split or Multi-Level' },
                  { value: '90', label: '90 – Duplex' },
                  { value: '120', label: '120 – 1-Story PUD' },
                  { value: '160', label: '160 – 2-Story PUD' },
                  { value: '190', label: '190 – 2-Family Conversion' },
                ]} />
              </Field>
              <Field label="Overall Quality (1–10)">
                <Select name="OverallQual" value={form.OverallQual} onChange={handleChange}
                  options={[1,2,3,4,5,6,7,8,9,10].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
              <Field label="Overall Condition (1–10)">
                <Select name="OverallCond" value={form.OverallCond} onChange={handleChange}
                  options={[1,2,3,4,5,6,7,8,9,10].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
              <Field label="Year Built">
                <Input name="YearBuilt" value={form.YearBuilt} onChange={handleChange} placeholder="e.g. 2003" min="1800" max="2025" />
              </Field>
              <Field label="Year Remodelled">
                <Input name="YearRemodAdd" value={form.YearRemodAdd} onChange={handleChange} placeholder="e.g. 2003" min="1800" max="2025" />
              </Field>
              <Field label="Foundation">
                <Select name="Foundation" value={form.Foundation} onChange={handleChange} options={[
                  { value: 'PConc', label: 'Poured Concrete' },
                  { value: 'CBlock', label: 'Cinder Block' },
                  { value: 'BrkTil', label: 'Brick & Tile' },
                  { value: 'Wood', label: 'Wood' },
                  { value: 'Slab', label: 'Slab' },
                  { value: 'Stone', label: 'Stone' },
                ]} />
              </Field>
            </SectionCard>
          )}

          {/* STEP 2: Living Area */}
          {activeStep === 2 && (
            <SectionCard icon="🛋️" title="Living Area & Rooms">
              <Field label="Above Ground Living Area (sq ft)">
                <Input name="GrLivArea" value={form.GrLivArea} onChange={handleChange} placeholder="e.g. 1710" min="0" />
              </Field>
              <Field label="1st Floor (sq ft)">
                <Input name="1stFlrSF" value={form['1stFlrSF']} onChange={handleChange} placeholder="e.g. 856" min="0" />
              </Field>
              <Field label="2nd Floor (sq ft)">
                <Input name="2ndFlrSF" value={form['2ndFlrSF']} onChange={handleChange} placeholder="e.g. 854" min="0" />
              </Field>
              <Field label="Bedrooms Above Grade">
                <Select name="BedroomAbvGr" value={form.BedroomAbvGr} onChange={handleChange}
                  options={[0,1,2,3,4,5,6,7,8].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
              <Field label="Full Bathrooms">
                <Select name="FullBath" value={form.FullBath} onChange={handleChange}
                  options={[0,1,2,3,4].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
              <Field label="Half Bathrooms">
                <Select name="HalfBath" value={form.HalfBath} onChange={handleChange}
                  options={[0,1,2].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
              <Field label="Total Rooms Above Grade">
                <Select name="TotRmsAbvGrd" value={form.TotRmsAbvGrd} onChange={handleChange}
                  options={[2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
              <Field label="Kitchen Quality">
                <Select name="KitchenQual" value={form.KitchenQual} onChange={handleChange} options={[
                  { value: 'Ex', label: 'Excellent' }, { value: 'Gd', label: 'Good' },
                  { value: 'TA', label: 'Average' }, { value: 'Fa', label: 'Fair' },
                ]} />
              </Field>
              <Field label="Fireplaces">
                <Select name="Fireplaces" value={form.Fireplaces} onChange={handleChange}
                  options={[0,1,2,3,4].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
              <Field label="Central Air">
                <Select name="CentralAir" value={form.CentralAir} onChange={handleChange} options={[
                  { value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' },
                ]} />
              </Field>
            </SectionCard>
          )}

          {/* STEP 3: Basement */}
          {activeStep === 3 && (
            <SectionCard icon="🪜" title="Basement">
              <Field label="Total Basement (sq ft)">
                <Input name="TotalBsmtSF" value={form.TotalBsmtSF} onChange={handleChange} placeholder="e.g. 856" min="0" />
              </Field>
              <Field label="Basement Quality">
                <Select name="BsmtQual" value={form.BsmtQual} onChange={handleChange} options={[
                  { value: 'Ex', label: 'Excellent' }, { value: 'Gd', label: 'Good' },
                  { value: 'TA', label: 'Average' }, { value: 'Fa', label: 'Fair' },
                  { value: 'None', label: 'No Basement' },
                ]} />
              </Field>
              <Field label="Basement Exposure">
                <Select name="BsmtExposure" value={form.BsmtExposure} onChange={handleChange} options={[
                  { value: 'Gd', label: 'Good' }, { value: 'Av', label: 'Average' },
                  { value: 'Mn', label: 'Minimum' }, { value: 'No', label: 'No Exposure' },
                  { value: 'None', label: 'No Basement' },
                ]} />
              </Field>
              <Field label="Finished SF (Type 1)">
                <Input name="BsmtFinSF1" value={form.BsmtFinSF1} onChange={handleChange} placeholder="e.g. 706" min="0" />
              </Field>
              <Field label="Unfinished SF">
                <Input name="BsmtUnfSF" value={form.BsmtUnfSF} onChange={handleChange} placeholder="e.g. 150" min="0" />
              </Field>
              <Field label="Basement Full Baths">
                <Select name="BsmtFullBath" value={form.BsmtFullBath} onChange={handleChange}
                  options={[0,1,2].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
            </SectionCard>
          )}

          {/* STEP 4: Garage */}
          {activeStep === 4 && (
            <SectionCard icon="🚗" title="Garage">
              <Field label="Garage Type">
                <Select name="GarageType" value={form.GarageType} onChange={handleChange} options={[
                  { value: 'Attchd', label: 'Attached' }, { value: 'Detchd', label: 'Detached' },
                  { value: 'BuiltIn', label: 'Built-In' }, { value: 'CarPort', label: 'Carport' },
                  { value: 'None', label: 'No Garage' },
                ]} />
              </Field>
              <Field label="Garage Cars">
                <Select name="GarageCars" value={form.GarageCars} onChange={handleChange}
                  options={[0,1,2,3,4].map(i => ({ value: String(i), label: String(i) }))} />
              </Field>
              <Field label="Garage Area (sq ft)">
                <Input name="GarageArea" value={form.GarageArea} onChange={handleChange} placeholder="e.g. 548" min="0" />
              </Field>
              <Field label="Garage Finish">
                <Select name="GarageFinish" value={form.GarageFinish} onChange={handleChange} options={[
                  { value: 'Fin', label: 'Finished' }, { value: 'RFn', label: 'Rough Finished' },
                  { value: 'Unf', label: 'Unfinished' }, { value: 'None', label: 'No Garage' },
                ]} />
              </Field>
              <Field label="Garage Year Built">
                <Input name="GarageYrBlt" value={form.GarageYrBlt} onChange={handleChange} placeholder="e.g. 2003" min="0" max="2025" />
              </Field>
              <Field label="Paved Drive">
                <Select name="PavedDrive" value={form.PavedDrive} onChange={handleChange} options={[
                  { value: 'Y', label: 'Paved' }, { value: 'P', label: 'Partial' },
                  { value: 'N', label: 'Dirt/Gravel' },
                ]} />
              </Field>
            </SectionCard>
          )}

          {/* STEP 5: Exterior */}
          {activeStep === 5 && (
            <SectionCard icon="🪟" title="Exterior & Roof">
              <Field label="Exterior 1st">
                <Select name="Exterior1st" value={form.Exterior1st} onChange={handleChange} options={[
                  'VinylSd','HdBoard','MetalSd','Wd Sdng','Plywood','CemntBd','BrkFace','WdShing','Stucco','AsbShng'
                ]} />
              </Field>
              <Field label="Exterior 2nd">
                <Select name="Exterior2nd" value={form.Exterior2nd} onChange={handleChange} options={[
                  'VinylSd','HdBoard','MetalSd','Wd Sdng','Plywood','CemntBd','BrkFace','Wd Shng','Stucco','AsbShng'
                ]} />
              </Field>
              <Field label="Exterior Quality">
                <Select name="ExterQual" value={form.ExterQual} onChange={handleChange} options={[
                  { value: 'Ex', label: 'Excellent' }, { value: 'Gd', label: 'Good' },
                  { value: 'TA', label: 'Average' }, { value: 'Fa', label: 'Fair' },
                ]} />
              </Field>
              <Field label="Roof Style">
                <Select name="RoofStyle" value={form.RoofStyle} onChange={handleChange} options={[
                  'Gable','Hip','Gambrel','Mansard','Flat','Shed'
                ]} />
              </Field>
              <Field label="Masonry Veneer Type">
                <Select name="MasVnrType" value={form.MasVnrType} onChange={handleChange} options={[
                  { value: 'None', label: 'None' }, { value: 'BrkFace', label: 'Brick Face' },
                  { value: 'Stone', label: 'Stone' }, { value: 'BrkCmn', label: 'Brick Common' },
                ]} />
              </Field>
              <Field label="Masonry Veneer Area">
                <Input name="MasVnrArea" value={form.MasVnrArea} onChange={handleChange} placeholder="e.g. 196" min="0" />
              </Field>
            </SectionCard>
          )}

          {/* STEP 6: Sale Info */}
          {activeStep === 6 && (
            <SectionCard icon="📋" title="Sale Information">
              <Field label="Month Sold">
                <Select name="MoSold" value={form.MoSold} onChange={handleChange} options={[
                  { value: '1', label: 'January' }, { value: '2', label: 'February' },
                  { value: '3', label: 'March' }, { value: '4', label: 'April' },
                  { value: '5', label: 'May' }, { value: '6', label: 'June' },
                  { value: '7', label: 'July' }, { value: '8', label: 'August' },
                  { value: '9', label: 'September' }, { value: '10', label: 'October' },
                  { value: '11', label: 'November' }, { value: '12', label: 'December' },
                ]} />
              </Field>
              <Field label="Year Sold">
                <Select name="YrSold" value={form.YrSold} onChange={handleChange}
                  options={Array.from({ length: 20 }, (_, i) => ({ value: String(2006 + i), label: String(2006 + i) }))} />
              </Field>
              <Field label="Sale Type">
                <Select name="SaleType" value={form.SaleType} onChange={handleChange} options={[
                  { value: 'WD', label: 'Warranty Deed' }, { value: 'New', label: 'New Construction' },
                  { value: 'COD', label: 'Cash on Delivery' }, { value: 'Con', label: 'Contract' },
                  { value: 'CWD', label: 'Warranty Deed Cash' }, { value: 'Oth', label: 'Other' },
                ]} />
              </Field>
              <Field label="Sale Condition">
                <Select name="SaleCondition" value={form.SaleCondition} onChange={handleChange} options={[
                  { value: 'Normal', label: 'Normal' }, { value: 'Abnorml', label: 'Abnormal' },
                  { value: 'Partial', label: 'Partial' }, { value: 'AdjLand', label: 'Adjacent Land' },
                  { value: 'Family', label: 'Family' },
                ]} />
              </Field>
            </SectionCard>
          )}

          {/* ── NAV BUTTONS ── */}
          <div className="nav-buttons">
            {activeStep > 0 && (
              <button type="button" className="btn-secondary" onClick={() => setActiveStep(s => s - 1)}>
                ← Previous
              </button>
            )}
            {activeStep < steps.length - 1 && (
              <button type="button" className="btn-primary" onClick={() => setActiveStep(s => s + 1)}>
                Next →
              </button>
            )}
            {activeStep === steps.length - 1 && (
              <button type="submit" className="btn-predict" disabled={loading}>
                {loading ? '⏳ Predicting...' : '🔍 Predict Price'}
              </button>
            )}
          </div>

        </form>
      </div>

      <footer>Built with React + Flask + XGBoost · Ames Housing Dataset</footer>
    </div>
  );
}
