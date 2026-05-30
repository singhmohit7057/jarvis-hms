-- #must: Seed default clinic settings, sample lab tests, and reference data

-- ============================================================================
-- DEFAULT CLINIC SETTINGS
-- ============================================================================
INSERT INTO public.clinic_settings (clinic_name, email, phone, address)
VALUES (
  'Jarvis',
  'workwithmohitsingh@gmail.com',
  '8981203500',
  'abc, xyz place, state - pincode'
);

-- ============================================================================
-- SUPER ADMIN SETUP INSTRUCTIONS
-- ============================================================================
-- To create the super_admin user:
--
-- 1. Go to your Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create a user with email/password
-- 3. Copy the user's UUID from the dashboard
-- 4. Run the following SQL (replace the UUID and details):
--
--   INSERT INTO public.profiles (id, name, email, phone, role)
--   VALUES (
--     'YOUR-USER-UUID-HERE',
--     'Admin Name',
--     'admin@example.com',
--     '9999999999',
--     'super_admin'
--   );
--
-- The super_admin can then create other staff profiles via the app.
-- ============================================================================

-- ============================================================================
-- SAMPLE LAB TESTS
-- Each test includes parameters as JSONB array with name, unit, and normal_range.
-- ============================================================================
INSERT INTO public.lab_tests (test_name, test_code, category, price, sample_type, parameters) VALUES

-- 1. Complete Blood Count
('Complete Blood Count (CBC)', 'CBC', 'Hematology', 450.00, 'Blood (EDTA)', '[
  {"name": "Hemoglobin", "unit": "g/dL", "normal_range": "M: 13.5-17.5, F: 12.0-16.0"},
  {"name": "RBC Count", "unit": "million/cumm", "normal_range": "M: 4.5-5.5, F: 3.8-4.8"},
  {"name": "WBC Count", "unit": "/cumm", "normal_range": "4000-11000"},
  {"name": "Platelet Count", "unit": "lakh/cumm", "normal_range": "1.5-4.5"},
  {"name": "PCV/Hematocrit", "unit": "%", "normal_range": "M: 40-54, F: 36-48"},
  {"name": "MCV", "unit": "fL", "normal_range": "80-100"},
  {"name": "MCH", "unit": "pg", "normal_range": "27-32"},
  {"name": "MCHC", "unit": "g/dL", "normal_range": "32-36"},
  {"name": "Neutrophils", "unit": "%", "normal_range": "40-70"},
  {"name": "Lymphocytes", "unit": "%", "normal_range": "20-40"},
  {"name": "Eosinophils", "unit": "%", "normal_range": "1-6"},
  {"name": "Monocytes", "unit": "%", "normal_range": "2-8"},
  {"name": "Basophils", "unit": "%", "normal_range": "0-1"},
  {"name": "ESR", "unit": "mm/hr", "normal_range": "M: 0-10, F: 0-20"}
]'::jsonb),

-- 2. Blood Sugar (Fasting & PP)
('Blood Sugar (Fasting)', 'BSF', 'Biochemistry', 100.00, 'Blood (Fluoride)', '[
  {"name": "Fasting Blood Sugar", "unit": "mg/dL", "normal_range": "70-100"}
]'::jsonb),

-- 3. Thyroid Profile
('Thyroid Profile (T3, T4, TSH)', 'THYROID', 'Endocrinology', 650.00, 'Blood (Serum)', '[
  {"name": "T3 (Triiodothyronine)", "unit": "ng/dL", "normal_range": "80-200"},
  {"name": "T4 (Thyroxine)", "unit": "ug/dL", "normal_range": "4.5-12.5"},
  {"name": "TSH", "unit": "uIU/mL", "normal_range": "0.4-4.0"}
]'::jsonb),

-- 4. Lipid Profile
('Lipid Profile', 'LIPID', 'Biochemistry', 550.00, 'Blood (Serum)', '[
  {"name": "Total Cholesterol", "unit": "mg/dL", "normal_range": "<200"},
  {"name": "Triglycerides", "unit": "mg/dL", "normal_range": "<150"},
  {"name": "HDL Cholesterol", "unit": "mg/dL", "normal_range": "M: >40, F: >50"},
  {"name": "LDL Cholesterol", "unit": "mg/dL", "normal_range": "<100"},
  {"name": "VLDL Cholesterol", "unit": "mg/dL", "normal_range": "<30"},
  {"name": "Total Cholesterol/HDL Ratio", "unit": "", "normal_range": "<5.0"}
]'::jsonb),

-- 5. Liver Function Test
('Liver Function Test (LFT)', 'LFT', 'Biochemistry', 600.00, 'Blood (Serum)', '[
  {"name": "Total Bilirubin", "unit": "mg/dL", "normal_range": "0.2-1.2"},
  {"name": "Direct Bilirubin", "unit": "mg/dL", "normal_range": "0.0-0.3"},
  {"name": "Indirect Bilirubin", "unit": "mg/dL", "normal_range": "0.1-0.9"},
  {"name": "SGOT (AST)", "unit": "U/L", "normal_range": "5-40"},
  {"name": "SGPT (ALT)", "unit": "U/L", "normal_range": "7-56"},
  {"name": "Alkaline Phosphatase", "unit": "U/L", "normal_range": "44-147"},
  {"name": "Total Protein", "unit": "g/dL", "normal_range": "6.0-8.3"},
  {"name": "Albumin", "unit": "g/dL", "normal_range": "3.5-5.0"},
  {"name": "Globulin", "unit": "g/dL", "normal_range": "2.0-3.5"},
  {"name": "A/G Ratio", "unit": "", "normal_range": "1.0-2.5"}
]'::jsonb),

-- 6. Kidney Function Test
('Kidney Function Test (KFT/RFT)', 'KFT', 'Biochemistry', 550.00, 'Blood (Serum)', '[
  {"name": "Blood Urea", "unit": "mg/dL", "normal_range": "15-45"},
  {"name": "Serum Creatinine", "unit": "mg/dL", "normal_range": "M: 0.7-1.3, F: 0.6-1.1"},
  {"name": "Uric Acid", "unit": "mg/dL", "normal_range": "M: 3.5-7.2, F: 2.6-6.0"},
  {"name": "BUN (Blood Urea Nitrogen)", "unit": "mg/dL", "normal_range": "7-20"},
  {"name": "Sodium", "unit": "mEq/L", "normal_range": "136-145"},
  {"name": "Potassium", "unit": "mEq/L", "normal_range": "3.5-5.0"},
  {"name": "Chloride", "unit": "mEq/L", "normal_range": "98-106"},
  {"name": "Calcium", "unit": "mg/dL", "normal_range": "8.5-10.5"}
]'::jsonb),

-- 7. Urine Routine
('Urine Routine & Microscopy', 'URINE', 'Clinical Pathology', 200.00, 'Urine (Mid-stream)', '[
  {"name": "Color", "unit": "", "normal_range": "Pale Yellow to Amber"},
  {"name": "Appearance", "unit": "", "normal_range": "Clear"},
  {"name": "pH", "unit": "", "normal_range": "4.5-8.0"},
  {"name": "Specific Gravity", "unit": "", "normal_range": "1.005-1.030"},
  {"name": "Protein", "unit": "", "normal_range": "Nil"},
  {"name": "Glucose", "unit": "", "normal_range": "Nil"},
  {"name": "Ketones", "unit": "", "normal_range": "Nil"},
  {"name": "Bilirubin", "unit": "", "normal_range": "Nil"},
  {"name": "RBCs", "unit": "/HPF", "normal_range": "0-2"},
  {"name": "WBCs (Pus Cells)", "unit": "/HPF", "normal_range": "0-5"},
  {"name": "Epithelial Cells", "unit": "/HPF", "normal_range": "Few"},
  {"name": "Casts", "unit": "/LPF", "normal_range": "Nil"},
  {"name": "Crystals", "unit": "", "normal_range": "Nil"},
  {"name": "Bacteria", "unit": "", "normal_range": "Nil"}
]'::jsonb),

-- 8. HbA1c
('Glycosylated Hemoglobin (HbA1c)', 'HBA1C', 'Biochemistry', 450.00, 'Blood (EDTA)', '[
  {"name": "HbA1c", "unit": "%", "normal_range": "Normal: <5.7, Pre-diabetic: 5.7-6.4, Diabetic: >=6.5"},
  {"name": "Estimated Average Glucose", "unit": "mg/dL", "normal_range": "70-126"}
]'::jsonb),

-- 9. Vitamin D
('Vitamin D (25-Hydroxy)', 'VITD', 'Biochemistry', 900.00, 'Blood (Serum)', '[
  {"name": "25-OH Vitamin D", "unit": "ng/mL", "normal_range": "Sufficient: 30-100, Insufficient: 20-29, Deficient: <20"}
]'::jsonb),

-- 10. Vitamin B12
('Vitamin B12', 'VITB12', 'Biochemistry', 800.00, 'Blood (Serum)', '[
  {"name": "Vitamin B12", "unit": "pg/mL", "normal_range": "200-900"}
]'::jsonb);

-- ============================================================================
-- COMMON HSN CODES FOR PHARMACEUTICAL PRODUCTS (Reference)
-- ============================================================================
-- HSN Code | Description                                    | GST Rate
-- ---------|------------------------------------------------|----------
-- 3001     | Glands, organs for organo-therapeutic uses     | 12%
-- 3002     | Human/animal blood, antisera, vaccines         | 5%
-- 3003     | Medicaments (not in measured doses/packaging)  | 12%
-- 3004     | Medicaments (in measured doses/retail packing) | 12%
-- 30041011 | Ayurvedic medicaments                          | 12%
-- 30042000 | Antibiotics                                    | 12%
-- 30043100 | Insulin                                        | 5%
-- 30044000 | Alkaloid-containing medicaments                | 12%
-- 30045000 | Vitamins & provitamins                         | 5% / 12%
-- 30046000 | Contraceptives                                 | 0%
-- 3005     | Wadding, gauze, bandages (medical)             | 12%
-- 3006     | Surgical sutures, dental cements               | 12%
-- 9018     | Medical instruments & appliances               | 12%
-- 9402     | Hospital furniture (beds, tables)              | 18%
-- 4818     | Tissue paper, diapers, sanitary pads           | 12% / 18%
-- ============================================================================
-- NOTE: GST rates are subject to government notifications.
-- Always verify current rates from cbic-gst.gov.in before production use.
-- ============================================================================
