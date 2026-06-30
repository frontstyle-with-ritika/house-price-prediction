import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import InsightsPanel from './InsightsPanel';

// ─── HELPERS ────────────────────────────────────────────────────────────────
const Field = ({ label, children, hint }) => (
  <div className="field">
    <label>{label}{hint && <span className="field-hint">{hint}</span>}</label>
    {children}
  </div>
);

const Input = ({ name, value, onChange, placeholder, type = 'number', min, max }) => (
  <input type={type} name={name} value={value} onChange={onChange}
    placeholder={placeholder} min={min} max={max} />
);

const Sel = ({ name, value, onChange, options }) => (
  <select name={name} value={value} onChange={onChange}>
    {options.map(o => typeof o === 'string'
      ? <option key={o} value={o}>{o}</option>
      : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

// ─── INSIGHTS ENGINE ────────────────────────────────────────────────────────
const POSH = ['NridgHt','NoRidge','StoneBr','Timber','Veenker'];
const BUDGET = ['MeadowV','IDOTRR','BrDale','OldTown','Edwards'];
const MID = ['Somerst','Gilbert','CollgCr','NWAmes','Crawfor'];

function locationInsights(f) {
  const ins = [];
  if (POSH.includes(f.Neighborhood))
    ins.push({type:'pos', icon:'🏆', text:`${f.Neighborhood} is a premium neighborhood — one of Ames' highest-value areas.`});
  else if (BUDGET.includes(f.Neighborhood))
    ins.push({type:'warn', icon:'📉', text:`${f.Neighborhood} is a budget area — lower property values are typical here.`});
  else if (MID.includes(f.Neighborhood))
    ins.push({type:'info', icon:'🏘️', text:`${f.Neighborhood} is a solid mid-range neighborhood.`});
  else
    ins.push({type:'info', icon:'📍', text:`${f.Neighborhood} is a well-established residential area.`});

  if (f.MSZoning === 'C (all)')
    ins.push({type:'warn', icon:'🏢', text:'Commercial zoning lowers residential sale price.'});
  else if (f.MSZoning === 'RL')
    ins.push({type:'pos', icon:'🌳', text:'Residential Low Density — the most desirable zoning for family homes.'});

  if (f.LotArea && +f.LotArea > 15000)
    ins.push({type:'pos', icon:'📐', text:`Large lot at ${(+f.LotArea).toLocaleString()} sq ft — bigger lots command a premium.`});
  else if (f.LotArea && +f.LotArea < 5000)
    ins.push({type:'warn', icon:'📏', text:`Small lot at ${(+f.LotArea).toLocaleString()} sq ft — may limit resale value.`});

  if (f.LotConfig === 'CulDSac')
    ins.push({type:'pos', icon:'🔵', text:'Cul-de-sac lot — less traffic, more privacy, highly desirable.'});
  if (f.LandContour === 'HLS')
    ins.push({type:'warn', icon:'⛰️', text:'Hillside lots can have drainage challenges and slightly reduce value.'});
  else if (f.LandContour === 'Lvl')
    ins.push({type:'pos', icon:'✅', text:'Flat/level land — most preferred for construction and maintenance.'});
  if (f.LandSlope === 'Sev')
    ins.push({type:'warn', icon:'⚠️', text:'Severe slope increases construction cost and affects value negatively.'});
  return ins;
}

function buildingInsights(f) {
  const ins = [];
  if (f.BldgType === '1Fam')
    ins.push({type:'pos', icon:'🏠', text:'Single-family homes are the most common and highest-valued type.'});
  else if (f.BldgType === 'Duplex')
    ins.push({type:'info', icon:'🏘️', text:'Duplexes offer rental income potential — popular investment choice.'});

  const q = +f.OverallQual;
  if (q >= 8) ins.push({type:'pos', icon:'⭐', text:`Excellent quality (${q}/10) — one of the strongest price drivers in this model.`});
  else if (q >= 6) ins.push({type:'info', icon:'👍', text:`Good quality (${q}/10) — above-average construction.`});
  else if (q <= 4) ins.push({type:'warn', icon:'🔧', text:`Low quality (${q}/10) — will significantly reduce predicted price.`});

  if (f.YearBuilt) {
    const age = 2024 - +f.YearBuilt;
    if (age <= 5) ins.push({type:'pos', icon:'🆕', text:`Nearly new (built ${f.YearBuilt}) — commands a strong price premium.`});
    else if (age <= 20) ins.push({type:'pos', icon:'🏗️', text:`Modern home (built ${f.YearBuilt}) — still in great shape.`});
    else if (age > 60) ins.push({type:'warn', icon:'🕰️', text:`Older home (${f.YearBuilt}) — age impacts price unless remodelled.`});
  }
  if (f.YearRemodAdd && f.YearBuilt && +f.YearRemodAdd > +f.YearBuilt)
    ins.push({type:'pos', icon:'🔨', text:`Remodelled in ${f.YearRemodAdd} — renovations typically boost value 5–15%.`});
  if (f.Foundation === 'PConc')
    ins.push({type:'pos', icon:'🪨', text:'Poured concrete foundation — strongest and most modern choice.'});
  return ins;
}

function livingInsights(f) {
  const ins = [];
  if (f.GrLivArea) {
    const a = +f.GrLivArea;
    if (a > 2500) ins.push({type:'pos', icon:'🏡', text:`Spacious at ${a.toLocaleString()} sq ft — large homes command strong prices.`});
    else if (a < 1000) ins.push({type:'warn', icon:'📦', text:`Compact at ${a.toLocaleString()} sq ft — may limit predicted price.`});
    else ins.push({type:'info', icon:'📐', text:`${a.toLocaleString()} sq ft is in the average range for this dataset.`});
  }
  const beds = +f.BedroomAbvGr, baths = +f.FullBath;
  if (beds >= 4 && baths >= 3)
    ins.push({type:'pos', icon:'🛏️', text:`${beds} beds & ${baths} baths — ideal for families, boosts resale value.`});
  if (f.KitchenQual === 'Ex')
    ins.push({type:'pos', icon:'👨‍🍳', text:'Excellent kitchen — buyers pay a strong premium for this.'});
  else if (f.KitchenQual === 'Fa')
    ins.push({type:'warn', icon:'🍳', text:'Fair kitchen quality — upgrades here have the highest ROI.'});
  if (+f.Fireplaces > 0)
    ins.push({type:'pos', icon:'🔥', text:`${f.Fireplaces} fireplace(s) — adds warmth and positive value.`});
  if (f.CentralAir === 'N')
    ins.push({type:'warn', icon:'🌡️', text:'No central air — a notable drawback for buyers.'});
  else ins.push({type:'pos', icon:'❄️', text:'Central air conditioning — standard expectation, good for value.'});
  return ins;
}

function basementInsights(f) {
  const ins = [];
  if (!f.TotalBsmtSF || +f.TotalBsmtSF === 0) {
    ins.push({type:'warn', icon:'🚫', text:'No basement — properties with basements sell for more.'});
    return ins;
  }
  const a = +f.TotalBsmtSF;
  if (a > 1500) ins.push({type:'pos', icon:'🏗️', text:`Large basement at ${a.toLocaleString()} sq ft — adds significant value.`});
  else ins.push({type:'info', icon:'📦', text:`Average basement at ${a.toLocaleString()} sq ft — good for storage.`});
  if (f.BsmtQual === 'Ex') ins.push({type:'pos', icon:'⭐', text:'Excellent basement — can function as living space.'});
  if (f.BsmtExposure === 'Gd') ins.push({type:'pos', icon:'☀️', text:'Good exposure (walkout) — natural light adds usability.'});
  if (+f.BsmtFullBath > 0) ins.push({type:'pos', icon:'🚿', text:`${f.BsmtFullBath} basement bath(s) — adds convenience and value.`});
  const pct = f.BsmtFinSF1 && +f.TotalBsmtSF ? Math.round((+f.BsmtFinSF1 / +f.TotalBsmtSF)*100) : 0;
  if (pct > 60) ins.push({type:'pos', icon:'✨', text:`${pct}% finished — finished basement adds more value than unfinished.`});
  else if (pct > 0 && pct < 20) ins.push({type:'info', icon:'🔧', text:`Only ${pct}% finished — completing it could boost value.`});
  return ins;
}

function garageInsights(f) {
  const ins = [];
  if (f.GarageType === 'None') {
    ins.push({type:'warn', icon:'🚫', text:'No garage — reduces resale value, especially in cold climates.'});
    return ins;
  }
  if (f.GarageType === 'Attchd') ins.push({type:'pos', icon:'🏠', text:'Attached garage — most preferred, direct access is a top buyer feature.'});
  else if (f.GarageType === 'BuiltIn') ins.push({type:'pos', icon:'🔧', text:'Built-in garage — integrated into structure, highly valued.'});
  else if (f.GarageType === 'CarPort') ins.push({type:'warn', icon:'🏕️', text:'Carport offers basic shelter but is less desirable than enclosed.'});
  const cars = +f.GarageCars;
  if (cars >= 3) ins.push({type:'pos', icon:'🚗', text:`${cars}-car garage — premium feature for multi-vehicle families.`});
  else if (cars === 2) ins.push({type:'pos', icon:'🚙', text:'2-car garage — standard expectation for mid-to-high value homes.'});
  else if (cars === 1) ins.push({type:'info', icon:'🚘', text:'1-car garage — adequate, but buyers often prefer 2-car capacity.'});
  if (f.GarageFinish === 'Fin') ins.push({type:'pos', icon:'✨', text:'Finished garage interior — positively impacts price.'});
  if (f.PavedDrive === 'Y') ins.push({type:'pos', icon:'🛤️', text:'Paved driveway — adds curb appeal, preferred by buyers.'});
  else if (f.PavedDrive === 'N') ins.push({type:'warn', icon:'🪨', text:'Dirt/gravel driveway — reduces curb appeal and perceived value.'});
  return ins;
}

function exteriorInsights(f) {
  const ins = [];
  if (f.ExterQual === 'Ex') ins.push({type:'pos', icon:'🌟', text:'Excellent exterior — premium materials significantly boost curb appeal.'});
  else if (f.ExterQual === 'Gd') ins.push({type:'pos', icon:'👍', text:'Good exterior quality — well-maintained and attractive.'});
  else if (f.ExterQual === 'Fa') ins.push({type:'warn', icon:'🎨', text:'Fair exterior — visible wear may deter buyers.'});
  if (f.Exterior1st === 'BrkFace') ins.push({type:'pos', icon:'🧱', text:'Brick face is a premium material — durable and visually strong.'});
  else if (f.Exterior1st === 'AsbShng') ins.push({type:'warn', icon:'⚠️', text:'Asbestos shingles — may affect value and insurability.'});
  else if (f.Exterior1st === 'CemntBd') ins.push({type:'pos', icon:'🏗️', text:'Cement board — modern, durable, great for value retention.'});
  if (f.MasVnrType === 'Stone') ins.push({type:'pos', icon:'💎', text:'Stone veneer — luxury feature, adds prestige and curb appeal.'});
  else if (f.MasVnrType === 'BrkFace') ins.push({type:'pos', icon:'🧱', text:'Brick face veneer — classic charm, valued by buyers.'});
  if (f.RoofStyle === 'Hip') ins.push({type:'pos', icon:'🏠', text:'Hip roof — durable and common in premium homes.'});
  else if (f.RoofStyle === 'Flat') ins.push({type:'warn', icon:'🌧️', text:'Flat roofs require more maintenance and can have drainage issues.'});
  return ins;
}

function saleInsights(f) {
  const ins = [];
  const m = +f.MoSold;
  if ([4,5,6,7].includes(m)) ins.push({type:'pos', icon:'☀️', text:'Spring/Summer — peak selling season, homes sell faster and higher.'});
  else if ([11,12,1,2].includes(m)) ins.push({type:'warn', icon:'❄️', text:'Winter is a slower market — fewer buyers can affect price.'});
  if (f.SaleType === 'New') ins.push({type:'pos', icon:'🆕', text:'New construction — buyers pay a premium for brand-new homes.'});
  else if (f.SaleType === 'WD') ins.push({type:'info', icon:'📄', text:'Standard Warranty Deed — most common sale type in the dataset.'});
  if (f.SaleCondition === 'Normal') ins.push({type:'pos', icon:'✅', text:'Normal condition — straightforward transaction, best for accuracy.'});
  else if (f.SaleCondition === 'Abnorml') ins.push({type:'warn', icon:'⚠️', text:'Abnormal sale (foreclosure/short sale) — typically below market value.'});
  else if (f.SaleCondition === 'Family') ins.push({type:'warn', icon:'👨‍👩‍👧', text:'Family sale — often priced below market value.'});
  return ins;
}

function getInsights(step, form) {
  switch(step) {
    case 0: return locationInsights(form);
    case 1: return buildingInsights(form);
    case 2: return livingInsights(form);
    case 3: return basementInsights(form);
    case 4: return garageInsights(form);
    case 5: return exteriorInsights(form);
    case 6: return saleInsights(form);
    default: return [];
  }
}

// ─── LIVE PRICE ESTIMATOR ────────────────────────────────────────────────────
function roughEstimate(form) {
  let base = 150000;
  const nb = form.Neighborhood;
  if (POSH.includes(nb)) base += 120000;
  else if (BUDGET.includes(nb)) base -= 50000;
  else if (MID.includes(nb)) base += 30000;
  if (form.GrLivArea) base += (+form.GrLivArea - 1500) * 55;
  if (form.OverallQual) base += (+form.OverallQual - 5) * 18000;
  if (form.YearBuilt) base += (2024 - +form.YearBuilt) * -400;
  if (form.TotalBsmtSF) base += +form.TotalBsmtSF * 20;
  if (form.GarageCars) base += +form.GarageCars * 8000;
  if (form.LotArea) base += (+form.LotArea - 8000) * 1.5;
  return Math.max(50000, Math.round(base / 1000) * 1000);
}

// ─── DEFAULT FORM ────────────────────────────────────────────────────────────
const defaultForm = {
  MSSubClass:'20', MSZoning:'RL', LotFrontage:'', LotArea:'',
  LotShape:'Reg', LotConfig:'Inside', LandContour:'Lvl', LandSlope:'Gtl',
  Neighborhood:'NAmes', Condition1:'Norm', Condition2:'Norm',
  BldgType:'1Fam', HouseStyle:'1Story',
  OverallQual:'5', OverallCond:'5',
  YearBuilt:'', YearRemodAdd:'',
  RoofStyle:'Gable', RoofMatl:'CompShg',
  Exterior1st:'VinylSd', Exterior2nd:'VinylSd',
  MasVnrType:'None', MasVnrArea:'0',
  ExterQual:'TA', ExterCond:'TA', Foundation:'PConc',
  BsmtQual:'TA', BsmtCond:'TA', BsmtExposure:'No',
  BsmtFinType1:'Unf', BsmtFinSF1:'0',
  BsmtFinType2:'Unf', BsmtFinSF2:'0',
  BsmtUnfSF:'0', TotalBsmtSF:'',
  Heating:'GasA', HeatingQC:'TA', CentralAir:'Y', Electrical:'SBrkr',
  '1stFlrSF':'', '2ndFlrSF':'0', LowQualFinSF:'0', GrLivArea:'',
  BsmtFullBath:'0', BsmtHalfBath:'0', FullBath:'2', HalfBath:'0',
  BedroomAbvGr:'3', KitchenAbvGr:'1', KitchenQual:'TA',
  TotRmsAbvGrd:'6', Functional:'Typ', Fireplaces:'0', FireplaceQu:'None',
  GarageType:'Attchd', GarageYrBlt:'', GarageFinish:'Unf',
  GarageCars:'2', GarageArea:'', GarageQual:'TA', GarageCond:'TA',
  PavedDrive:'Y',
  WoodDeckSF:'0', OpenPorchSF:'0', EnclosedPorch:'0',
  '3SsnPorch':'0', ScreenPorch:'0',
  PoolArea:'0', PoolQC:'None', Fence:'NA',
  MiscFeature:'None', MiscVal:'0',
  MoSold:'6', YrSold:'2010', SaleType:'WD', SaleCondition:'Normal',
};

const STEPS = [
  { label:'Location', icon:'📍' },
  { label:'Building', icon:'🏗️' },
  { label:'Living Area', icon:'🛋️' },
  { label:'Basement', icon:'🪜' },
  { label:'Garage', icon:'🚗' },
  { label:'Exterior', icon:'🪟' },
  { label:'Sale', icon:'📋' },
];

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <nav className="land-nav">
        <div className="land-logo">
          <span className="logo-mark">HP</span>
          <span className="logo-text">HousePrice</span>
        </div>
        <button className="nav-cta" onClick={onStart}>Start Predicting →</button>
      </nav>

      <section className="hero">
        <div className="hero-eyebrow">Powered by XGBoost · Ames Housing Dataset</div>
        <h1 className="hero-title">
          Know your home's<br />
          <span className="hero-accent">true value.</span>
        </h1>
        <p className="hero-sub">
          Fill in your property details across 7 categories and get an
          instant AI-powered price estimate — with live insights on every choice you make.
        </p>
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={onStart}>Get Your Estimate →</button>
        </div>
        <div className="hero-stats">
          <div className="stat"><div className="stat-num">214</div><div className="stat-label">Features Analyzed</div></div>
          <div className="stat-divider" />
          <div className="stat"><div className="stat-num">1,460</div><div className="stat-label">Training Homes</div></div>
          <div className="stat-divider" />
          <div className="stat"><div className="stat-num">XGB</div><div className="stat-label">ML Algorithm</div></div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">What makes this different</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feat-icon">💡</div>
            <h3>Smart Insights</h3>
            <p>Every field gives you real-time feedback on how your choice affects the predicted price.</p>
          </div>
          <div className="feature-card">
            <div className="feat-icon">📊</div>
            <h3>Live Estimate</h3>
            <p>Watch a rough estimate update as you fill in the form — before you even hit Predict.</p>
          </div>
          <div className="feature-card">
            <div className="feat-icon">🗂️</div>
            <h3>Prediction History</h3>
            <p>Every estimate is saved locally so you can compare different property configurations.</p>
          </div>
          <div className="feature-card">
            <div className="feat-icon">✅</div>
            <h3>Summary Review</h3>
            <p>Review all your inputs in one view before submitting — catch anything you missed.</p>
          </div>
        </div>
      </section>

      <footer className="land-footer">
        Built with React · Flask · XGBoost · Ames Housing Dataset
      </footer>
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ history, onBack, onClear }) {
  return (
    <div className="history-page">
      <div className="hist-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 className="hist-title">Prediction History</h2>
        {history.length > 0 && (
          <button className="clear-btn" onClick={onClear}>Clear All</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="hist-empty">
          <div className="empty-icon">📭</div>
          <p>No predictions yet. Fill in the form to get your first estimate!</p>
        </div>
      ) : (
        <div className="hist-list">
          {history.map((item, i) => (
            <div className="hist-card" key={i}>
              <div className="hist-card-left">
                <div className="hist-num">#{history.length - i}</div>
                <div>
                  <div className="hist-price">{item.price}</div>
                  <div className="hist-meta">{item.neighborhood} · {item.date}</div>
                </div>
              </div>
              <div className="hist-tags">
                <span className="hist-tag">{item.bldgType}</span>
                <span className="hist-tag">{item.qual}/10 quality</span>
                {item.yearBuilt && <span className="hist-tag">Built {item.yearBuilt}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SUMMARY VIEW ─────────────────────────────────────────────────────────────
function SummaryView({ form, onBack, onSubmit, loading }) {
  const fields = [
    ['Neighborhood', form.Neighborhood], ['Zoning', form.MSZoning],
    ['Lot Area', form.LotArea ? `${(+form.LotArea).toLocaleString()} sq ft` : '—'],
    ['Building Type', form.BldgType], ['House Style', form.HouseStyle],
    ['Overall Quality', `${form.OverallQual}/10`], ['Year Built', form.YearBuilt || '—'],
    ['Year Remodelled', form.YearRemodAdd || '—'], ['Foundation', form.Foundation],
    ['Living Area', form.GrLivArea ? `${(+form.GrLivArea).toLocaleString()} sq ft` : '—'],
    ['Bedrooms', form.BedroomAbvGr], ['Full Baths', form.FullBath],
    ['Kitchen Quality', form.KitchenQual], ['Central Air', form.CentralAir === 'Y' ? 'Yes' : 'No'],
    ['Basement SF', form.TotalBsmtSF ? `${(+form.TotalBsmtSF).toLocaleString()} sq ft` : '—'],
    ['Garage Type', form.GarageType], ['Garage Cars', form.GarageCars],
    ['Exterior Quality', form.ExterQual], ['Roof Style', form.RoofStyle],
    ['Sale Type', form.SaleType], ['Sale Condition', form.SaleCondition],
  ];

  return (
    <div className="summary-view">
      <div className="summary-header">
        <button className="back-btn" onClick={onBack}>← Edit</button>
        <h2 className="summary-title">Review Your Inputs</h2>
      </div>
      <p className="summary-sub">Check everything looks right before getting your estimate.</p>
      <div className="summary-grid">
        {fields.map(([k,v]) => (
          <div className="summary-row" key={k}>
            <span className="sum-key">{k}</span>
            <span className="sum-val">{v || '—'}</span>
          </div>
        ))}
      </div>
      <div className="summary-actions">
        <button className="btn-back-outline" onClick={onBack}>← Edit Details</button>
        <button className="btn-predict-final" onClick={onSubmit} disabled={loading}>
          {loading ? '⏳ Predicting...' : '🔍 Get My Estimate'}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState('landing'); // landing | form | history
  const [form, setForm]           = useState(defaultForm);
  const [step, setStep]           = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('hp_history') || '[]'); } catch { return []; }
  });

  const liveEstimate = roughEstimate(form);
  const insights = getInsights(step, form);
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveHistory = (price, f) => {
    const entry = {
      price,
      neighborhood: f.Neighborhood,
      bldgType: f.BldgType,
      qual: f.OverallQual,
      yearBuilt: f.YearBuilt,
      date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    };
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    try { localStorage.setItem('hp_history', JSON.stringify(updated)); } catch {}
  };

  const handleSubmit = async () => {
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
        saveHistory(data.formatted_price, form);
        setShowSummary(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error);
      }
    } catch {
      setError('Could not connect to the server. Make sure Flask is running.');
    } finally {
      setLoading(false);
    }
  };

  if (page === 'landing') return <LandingPage onStart={() => setPage('form')} />;

  if (page === 'history') return (
    <HistoryPage
      history={history}
      onBack={() => setPage('form')}
      onClear={() => { setHistory([]); localStorage.removeItem('hp_history'); }}
    />
  );

  if (showSummary) return (
    <div className="app">
      <AppHeader liveEstimate={liveEstimate} history={history} onHistory={() => setPage('history')} onHome={() => setPage('landing')} />
      {result && (
        <>
          <ResultBanner result={result} onClose={() => setResult(null)} />
          <div className="form-wrapper">
            <InsightsPanel predictedPrice={result} neighborhood={form.Neighborhood} />
          </div>
        </>
      )}
      {error && <ErrorBanner error={error} onClose={() => setError(null)} />}
      <div className="form-wrapper">
        <SummaryView form={form} onBack={() => setShowSummary(false)} onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );

  return (
    <div className="app">
      <AppHeader liveEstimate={liveEstimate} history={history} onHistory={() => setPage('history')} onHome={() => setPage('landing')} />
      {result && (
        <>
          <ResultBanner result={result} onClose={() => setResult(null)} />
          <div className="form-wrapper">
            <InsightsPanel predictedPrice={result} neighborhood={form.Neighborhood} />
          </div>
        </>
      )}
      {error && <ErrorBanner error={error} onClose={() => setError(null)} />}

      {/* Progress bar */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-label">{Math.round(progress)}% complete</span>
      </div>

      {/* Step nav */}
      <div className="step-nav">
        {STEPS.map((s, i) => (
          <button key={s.label}
            className={`step-btn ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => setStep(i)} type="button">
            <span className="step-num">{i < step ? '✓' : i + 1}</span>
            <span className="step-icon-sm">{s.icon}</span>
            <span className="step-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="form-wrapper">
        {/* Insights */}
        {insights.length > 0 && (
          <div className="insight-panel">
            <div className="insight-panel-title">💡 Smart Insights</div>
            <div className="insight-items">
              {insights.map((ins, i) => (
                <div key={i} className={`ins-item ins-${ins.type}`}>
                  <span>{ins.icon}</span>
                  <span>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); setShowSummary(true); }}>
          <div className="section-card">
            <div className="section-head">
              <span>{STEPS[step].icon}</span>
              <h2>{STEPS[step].label}</h2>
            </div>
            <div className="section-body">
              {step === 0 && <>
                <Field label="Neighborhood"><Sel name="Neighborhood" value={form.Neighborhood} onChange={handleChange} options={['NAmes','CollgCr','OldTown','Edwards','Somerst','NridgHt','Gilbert','Sawyer','NWAmes','SawyerW','BrkSide','Crawfor','Mitchel','NoRidge','Timber','IDOTRR','ClearCr','StoneBr','SWISU','Blmngtn','MeadowV','BrDale','Veenker','NPkVill','Blueste']} /></Field>
                <Field label="MS Zoning"><Sel name="MSZoning" value={form.MSZoning} onChange={handleChange} options={[{value:'RL',label:'RL – Residential Low'},{value:'RM',label:'RM – Residential Medium'},{value:'FV',label:'FV – Floating Village'},{value:'RH',label:'RH – Residential High'},{value:'C (all)',label:'C – Commercial'}]} /></Field>
                <Field label="Lot Area (sq ft)"><Input name="LotArea" value={form.LotArea} onChange={handleChange} placeholder="e.g. 8450" min="0" /></Field>
                <Field label="Lot Frontage (ft)"><Input name="LotFrontage" value={form.LotFrontage} onChange={handleChange} placeholder="e.g. 65" min="0" /></Field>
                <Field label="Lot Shape"><Sel name="LotShape" value={form.LotShape} onChange={handleChange} options={[{value:'Reg',label:'Regular'},{value:'IR1',label:'Slightly Irregular'},{value:'IR2',label:'Moderately Irregular'},{value:'IR3',label:'Irregular'}]} /></Field>
                <Field label="Lot Config"><Sel name="LotConfig" value={form.LotConfig} onChange={handleChange} options={['Inside','Corner','CulDSac','FR2','FR3']} /></Field>
                <Field label="Land Contour"><Sel name="LandContour" value={form.LandContour} onChange={handleChange} options={[{value:'Lvl',label:'Lvl – Near Flat'},{value:'Bnk',label:'Bnk – Banked'},{value:'HLS',label:'HLS – Hillside'},{value:'Low',label:'Low – Depression'}]} /></Field>
                <Field label="Land Slope"><Sel name="LandSlope" value={form.LandSlope} onChange={handleChange} options={[{value:'Gtl',label:'Gentle'},{value:'Mod',label:'Moderate'},{value:'Sev',label:'Severe'}]} /></Field>
              </>}

              {step === 1 && <>
                <Field label="Building Type"><Sel name="BldgType" value={form.BldgType} onChange={handleChange} options={[{value:'1Fam',label:'Single Family'},{value:'2fmCon',label:'2-Family Conversion'},{value:'Duplex',label:'Duplex'},{value:'TwnhsE',label:'Townhouse End'},{value:'Twnhs',label:'Townhouse Inside'}]} /></Field>
                <Field label="House Style"><Sel name="HouseStyle" value={form.HouseStyle} onChange={handleChange} options={[{value:'1Story',label:'1 Story'},{value:'2Story',label:'2 Story'},{value:'1.5Fin',label:'1.5 Story Finished'},{value:'SFoyer',label:'Split Foyer'},{value:'SLvl',label:'Split Level'}]} /></Field>
                <Field label="MS SubClass"><Sel name="MSSubClass" value={form.MSSubClass} onChange={handleChange} options={[{value:'20',label:'20 – 1-Story 1946+'},{value:'60',label:'60 – 2-Story 1946+'},{value:'50',label:'50 – 1.5-Story Finished'},{value:'70',label:'70 – 2-Story Pre-1945'},{value:'80',label:'80 – Split/Multi-Level'},{value:'90',label:'90 – Duplex'},{value:'120',label:'120 – 1-Story PUD'},{value:'160',label:'160 – 2-Story PUD'},{value:'190',label:'190 – 2-Family Conversion'}]} /></Field>
                <Field label="Overall Quality (1–10)" hint="Strongest price driver"><Sel name="OverallQual" value={form.OverallQual} onChange={handleChange} options={[1,2,3,4,5,6,7,8,9,10].map(i=>({value:String(i),label:String(i)}))} /></Field>
                <Field label="Overall Condition (1–10)"><Sel name="OverallCond" value={form.OverallCond} onChange={handleChange} options={[1,2,3,4,5,6,7,8,9,10].map(i=>({value:String(i),label:String(i)}))} /></Field>
                <Field label="Year Built"><Input name="YearBuilt" value={form.YearBuilt} onChange={handleChange} placeholder="e.g. 2003" min="1800" max="2025" /></Field>
                <Field label="Year Remodelled"><Input name="YearRemodAdd" value={form.YearRemodAdd} onChange={handleChange} placeholder="e.g. 2010" min="1800" max="2025" /></Field>
                <Field label="Foundation"><Sel name="Foundation" value={form.Foundation} onChange={handleChange} options={[{value:'PConc',label:'Poured Concrete'},{value:'CBlock',label:'Cinder Block'},{value:'BrkTil',label:'Brick & Tile'},{value:'Wood',label:'Wood'},{value:'Slab',label:'Slab'},{value:'Stone',label:'Stone'}]} /></Field>
              </>}

              {step === 2 && <>
                <Field label="Above Ground Living Area (sq ft)" hint="High impact"><Input name="GrLivArea" value={form.GrLivArea} onChange={handleChange} placeholder="e.g. 1710" min="0" /></Field>
                <Field label="1st Floor (sq ft)"><Input name="1stFlrSF" value={form['1stFlrSF']} onChange={handleChange} placeholder="e.g. 856" min="0" /></Field>
                <Field label="2nd Floor (sq ft)"><Input name="2ndFlrSF" value={form['2ndFlrSF']} onChange={handleChange} placeholder="e.g. 854" min="0" /></Field>
                <Field label="Bedrooms Above Grade"><Sel name="BedroomAbvGr" value={form.BedroomAbvGr} onChange={handleChange} options={[0,1,2,3,4,5,6,7,8].map(i=>({value:String(i),label:String(i)}))} /></Field>
                <Field label="Full Bathrooms"><Sel name="FullBath" value={form.FullBath} onChange={handleChange} options={[0,1,2,3,4].map(i=>({value:String(i),label:String(i)}))} /></Field>
                <Field label="Half Bathrooms"><Sel name="HalfBath" value={form.HalfBath} onChange={handleChange} options={[0,1,2].map(i=>({value:String(i),label:String(i)}))} /></Field>
                <Field label="Total Rooms Above Grade"><Sel name="TotRmsAbvGrd" value={form.TotRmsAbvGrd} onChange={handleChange} options={[2,3,4,5,6,7,8,9,10,11,12,13,14].map(i=>({value:String(i),label:String(i)}))} /></Field>
                <Field label="Kitchen Quality"><Sel name="KitchenQual" value={form.KitchenQual} onChange={handleChange} options={[{value:'Ex',label:'Excellent'},{value:'Gd',label:'Good'},{value:'TA',label:'Average'},{value:'Fa',label:'Fair'}]} /></Field>
                <Field label="Fireplaces"><Sel name="Fireplaces" value={form.Fireplaces} onChange={handleChange} options={[0,1,2,3,4].map(i=>({value:String(i),label:String(i)}))} /></Field>
                <Field label="Central Air"><Sel name="CentralAir" value={form.CentralAir} onChange={handleChange} options={[{value:'Y',label:'Yes'},{value:'N',label:'No'}]} /></Field>
              </>}

              {step === 3 && <>
                <Field label="Total Basement (sq ft)"><Input name="TotalBsmtSF" value={form.TotalBsmtSF} onChange={handleChange} placeholder="e.g. 856" min="0" /></Field>
                <Field label="Basement Quality"><Sel name="BsmtQual" value={form.BsmtQual} onChange={handleChange} options={[{value:'Ex',label:'Excellent'},{value:'Gd',label:'Good'},{value:'TA',label:'Average'},{value:'Fa',label:'Fair'},{value:'None',label:'No Basement'}]} /></Field>
                <Field label="Basement Exposure"><Sel name="BsmtExposure" value={form.BsmtExposure} onChange={handleChange} options={[{value:'Gd',label:'Good'},{value:'Av',label:'Average'},{value:'Mn',label:'Minimum'},{value:'No',label:'No Exposure'},{value:'None',label:'No Basement'}]} /></Field>
                <Field label="Finished SF (Type 1)"><Input name="BsmtFinSF1" value={form.BsmtFinSF1} onChange={handleChange} placeholder="e.g. 706" min="0" /></Field>
                <Field label="Unfinished SF"><Input name="BsmtUnfSF" value={form.BsmtUnfSF} onChange={handleChange} placeholder="e.g. 150" min="0" /></Field>
                <Field label="Basement Full Baths"><Sel name="BsmtFullBath" value={form.BsmtFullBath} onChange={handleChange} options={[0,1,2].map(i=>({value:String(i),label:String(i)}))} /></Field>
              </>}

              {step === 4 && <>
                <Field label="Garage Type"><Sel name="GarageType" value={form.GarageType} onChange={handleChange} options={[{value:'Attchd',label:'Attached'},{value:'Detchd',label:'Detached'},{value:'BuiltIn',label:'Built-In'},{value:'CarPort',label:'Carport'},{value:'None',label:'No Garage'}]} /></Field>
                <Field label="Garage Cars"><Sel name="GarageCars" value={form.GarageCars} onChange={handleChange} options={[0,1,2,3,4].map(i=>({value:String(i),label:String(i)}))} /></Field>
                <Field label="Garage Area (sq ft)"><Input name="GarageArea" value={form.GarageArea} onChange={handleChange} placeholder="e.g. 548" min="0" /></Field>
                <Field label="Garage Finish"><Sel name="GarageFinish" value={form.GarageFinish} onChange={handleChange} options={[{value:'Fin',label:'Finished'},{value:'RFn',label:'Rough Finished'},{value:'Unf',label:'Unfinished'},{value:'None',label:'No Garage'}]} /></Field>
                <Field label="Garage Year Built"><Input name="GarageYrBlt" value={form.GarageYrBlt} onChange={handleChange} placeholder="e.g. 2003" min="1800" max="2025" /></Field>
                <Field label="Paved Drive"><Sel name="PavedDrive" value={form.PavedDrive} onChange={handleChange} options={[{value:'Y',label:'Paved'},{value:'P',label:'Partial'},{value:'N',label:'Dirt/Gravel'}]} /></Field>
              </>}

              {step === 5 && <>
                <Field label="Exterior 1st"><Sel name="Exterior1st" value={form.Exterior1st} onChange={handleChange} options={['VinylSd','HdBoard','MetalSd','Wd Sdng','Plywood','CemntBd','BrkFace','WdShing','Stucco','AsbShng']} /></Field>
                <Field label="Exterior 2nd"><Sel name="Exterior2nd" value={form.Exterior2nd} onChange={handleChange} options={['VinylSd','HdBoard','MetalSd','Wd Sdng','Plywood','CemntBd','BrkFace','Wd Shng','Stucco','AsbShng']} /></Field>
                <Field label="Exterior Quality"><Sel name="ExterQual" value={form.ExterQual} onChange={handleChange} options={[{value:'Ex',label:'Excellent'},{value:'Gd',label:'Good'},{value:'TA',label:'Average'},{value:'Fa',label:'Fair'}]} /></Field>
                <Field label="Roof Style"><Sel name="RoofStyle" value={form.RoofStyle} onChange={handleChange} options={['Gable','Hip','Gambrel','Mansard','Flat','Shed']} /></Field>
                <Field label="Masonry Veneer Type"><Sel name="MasVnrType" value={form.MasVnrType} onChange={handleChange} options={[{value:'None',label:'None'},{value:'BrkFace',label:'Brick Face'},{value:'Stone',label:'Stone'},{value:'BrkCmn',label:'Brick Common'}]} /></Field>
                <Field label="Masonry Veneer Area"><Input name="MasVnrArea" value={form.MasVnrArea} onChange={handleChange} placeholder="e.g. 196" min="0" /></Field>
              </>}

              {step === 6 && <>
                <Field label="Month Sold"><Sel name="MoSold" value={form.MoSold} onChange={handleChange} options={[{value:'1',label:'January'},{value:'2',label:'February'},{value:'3',label:'March'},{value:'4',label:'April'},{value:'5',label:'May'},{value:'6',label:'June'},{value:'7',label:'July'},{value:'8',label:'August'},{value:'9',label:'September'},{value:'10',label:'October'},{value:'11',label:'November'},{value:'12',label:'December'}]} /></Field>
                <Field label="Year Sold"><Sel name="YrSold" value={form.YrSold} onChange={handleChange} options={Array.from({length:20},(_,i)=>({value:String(2006+i),label:String(2006+i)}))} /></Field>
                <Field label="Sale Type"><Sel name="SaleType" value={form.SaleType} onChange={handleChange} options={[{value:'WD',label:'Warranty Deed'},{value:'New',label:'New Construction'},{value:'COD',label:'Cash on Delivery'},{value:'Con',label:'Contract'},{value:'CWD',label:'Warranty Deed Cash'},{value:'Oth',label:'Other'}]} /></Field>
                <Field label="Sale Condition"><Sel name="SaleCondition" value={form.SaleCondition} onChange={handleChange} options={[{value:'Normal',label:'Normal'},{value:'Abnorml',label:'Abnormal'},{value:'Partial',label:'Partial'},{value:'AdjLand',label:'Adjacent Land'},{value:'Family',label:'Family'}]} /></Field>
              </>}
            </div>
          </div>

          <div className="nav-buttons">
            {step > 0 && <button type="button" className="btn-secondary" onClick={() => setStep(s => s-1)}>← Previous</button>}
            {step < STEPS.length - 1 && <button type="button" className="btn-primary" onClick={() => setStep(s => s+1)}>Next →</button>}
            {step === STEPS.length - 1 && <button type="submit" className="btn-predict">Review & Predict →</button>}
          </div>
        </form>
      </div>
      <footer className="app-footer">Built with React · Flask · XGBoost · Ames Housing Dataset</footer>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
function AppHeader({ liveEstimate, history, onHistory, onHome }) {
  return (
    <header className="app-header">
      <div className="app-header-left" onClick={onHome} style={{cursor:'pointer'}}>
        <div className="app-logo-mark">HP</div>
        <div>
          <div className="app-logo-text">HousePrice <span>Predictor</span></div>
          <div className="app-tagline">Powered by XGBoost · Ames Dataset</div>
        </div>
      </div>
      <div className="app-header-right">
        <div className="live-estimate-pill">
          <span className="live-dot" />
          <span className="live-label">Live estimate</span>
          <span className="live-price">${liveEstimate.toLocaleString()}</span>
        </div>
        <button className="hist-nav-btn" onClick={onHistory}>
          📋 History {history.length > 0 && <span className="hist-badge">{history.length}</span>}
        </button>
      </div>
    </header>
  );
}

function ResultBanner({ result, onClose }) {
  return (
    <div className="result-banner success">
      <div className="result-icon">✅</div>
      <div>
        <div className="result-label">Estimated Sale Price</div>
        <div className="result-price">{result}</div>
      </div>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
}

function ErrorBanner({ error, onClose }) {
  return (
    <div className="result-banner error-banner">
      <div className="result-icon">⚠️</div>
      <div>
        <div className="result-label">Error</div>
        <div className="result-error">{error}</div>
      </div>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
}
