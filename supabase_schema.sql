-- Create the headache_history table
CREATE TABLE IF NOT EXISTS public.headache_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Demographics
  age INTEGER NOT NULL,
  gender TEXT NOT NULL, -- Male, Female, Other
  
  -- Symptom Details
  duration INTEGER NOT NULL, -- in hours
  intensity INTEGER NOT NULL, -- 1-10
  location TEXT NOT NULL, -- Unilateral, Bilateral
  character TEXT NOT NULL, -- Throbbing, Constant, Stabbing
  
  -- Associated Symptoms (Boolean)
  nausea BOOLEAN DEFAULT false,
  vomiting BOOLEAN DEFAULT false,
  phonophobia BOOLEAN DEFAULT false,
  photophobia BOOLEAN DEFAULT false,
  visual_aura BOOLEAN DEFAULT false,
  sensory_aura BOOLEAN DEFAULT false,
  dysphasia BOOLEAN DEFAULT false,
  vertigo BOOLEAN DEFAULT false,

  -- Lifestyle Factors (Added for better prediction)
  sleep_hours FLOAT,
  stress_level INTEGER,
  hydration_level INTEGER,
  screen_time FLOAT,
  
  -- Prediction Results
  predicted_type TEXT,
  confidence FLOAT, 
  risk_level TEXT, -- low, moderate, high, severe
  algorithm_used TEXT DEFAULT 'SVM',
  xai_factors JSONB, -- Stores feature contribution scores
  
  -- Metadata
  actual_type TEXT -- For potential retraining feedback
);

-- Risk Predictions Table
CREATE TABLE IF NOT EXISTS public.risk_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_date DATE DEFAULT CURRENT_DATE,
  risk_score INTEGER, -- 0-100
  risk_level TEXT, -- Low, Moderate, High
  top_triggers JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ML Models Metadata Table (Research Mode)
CREATE TABLE IF NOT EXISTS public.ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE,
  version INTEGER,
  accuracy FLOAT,
  precision_score FLOAT,
  recall_score FLOAT,
  f1_score FLOAT,
  dataset_size INTEGER,
  confusion_matrix JSONB,
  model_params JSONB,
  training_logs TEXT,
  last_trained TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Basic RLS (Row Level Security)
ALTER TABLE public.headache_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own entries" 
ON public.headache_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own entries" 
ON public.headache_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries" 
ON public.headache_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own risk predictions" 
ON public.risk_predictions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view model metrics" 
ON public.ml_models FOR SELECT USING (true);
