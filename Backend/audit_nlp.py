import sys
import os

sys.path.insert(0, os.getcwd())
try:
    import Backend
    sys.modules['backend'] = Backend
except Exception:
    pass

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import StratifiedKFold, cross_validate

data_path = 'backend/data/training/combined_dataset.csv'
model_path = 'backend/models/phishing_classifier.joblib'

print('=== 1. CLASS BALANCE CHECK ===')
df = pd.read_csv(data_path)
print('Total rows in combined_dataset.csv:', len(df))
print('Value counts by label:')
print(df['label'].value_counts())

print('\n=== 2. DATA LEAKAGE CHECK (TOP 30 TF-IDF FEATURES) ===')
pipeline = joblib.load(model_path)
tfidf = pipeline.named_steps['tfidf']
clf = pipeline.named_steps['clf']

feature_names = np.array(tfidf.get_feature_names_out())
coefs = clf.coef_[0]

# Top 30 positive (Phishing)
top_phish_idx = np.argsort(coefs)[-30:][::-1]
print('--- TOP 30 PHISHING FEATURES (HIGHEST POSITIVE WEIGHTS) ---')
for i, idx in enumerate(top_phish_idx, 1):
    print(f'{i:2d}. {feature_names[idx]:<25} (weight: {coefs[idx]:+.4f})')

# Top 30 negative (Legitimate)
top_legit_idx = np.argsort(coefs)[:30]
print('\n--- TOP 30 LEGITIMATE FEATURES (LOWEST NEGATIVE WEIGHTS) ---')
for i, idx in enumerate(top_legit_idx, 1):
    print(f'{i:2d}. {feature_names[idx]:<25} (weight: {coefs[idx]:+.4f})')

print('\n=== 3. 5-FOLD STRATIFIED CROSS-VALIDATION ===')
df['text'] = df['subject'].fillna('') + ' ' + df['body'].fillna('')
X = df['text'].values
y = df['label'].apply(lambda x: 1 if str(x).lower() == 'phishing' else 0).values

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = {
    'accuracy': 'accuracy',
    'precision': 'precision',
    'recall': 'recall',
    'f1': 'f1'
}

cv_results = cross_validate(pipeline, X, y, cv=cv, scoring=scoring, n_jobs=-1)
f1_scores = cv_results['test_f1']
acc_scores = cv_results['test_accuracy']
prec_scores = cv_results['test_precision']
rec_scores = cv_results['test_recall']

print('5-Fold F1 Scores:   ', [round(x, 4) for x in f1_scores])
print(f'Mean F1-Score:       {np.mean(f1_scores):.4f} (+/- {np.std(f1_scores):.4f})')
print(f'Mean Accuracy:       {np.mean(acc_scores):.4f} (+/- {np.std(acc_scores):.4f})')
print(f'Mean Precision:      {np.mean(prec_scores):.4f} (+/- {np.std(prec_scores):.4f})')
print(f'Mean Recall:         {np.mean(rec_scores):.4f} (+/- {np.std(rec_scores):.4f})')

print('\n=== 4. REAL-WORLD SYNTHETIC EMAIL TESTS ===')
test_emails = [
    ('Legitimate Business Email',
     'Project Roadmap Update for Sprint 42',
     'Hi everyone, here is the updated timeline for our backend API release next Tuesday. Let me know if you need any adjustments to your assigned tickets.'),
    ('Obvious Modern Phishing',
     'Urgent: Mandatory Multi-Factor Authentication Reset',
     'Your Microsoft 365 MFA profile has expired. To maintain access to your corporate email and SharePoint files, you must verify your identity immediately within 24 hours at the secure portal: http://m365-security-auth-check.com'),
    ('Borderline / Ambiguous Email',
     'New Internal Portal Link',
     'Hello team, we have migrated the HR documentation to a new web address. Please bookmark this URL for future reference: http://internal-wiki-docs.corp/hr')
]

for name, subj, body in test_emails:
    text = f'{subj} {body}'
    prob = pipeline.predict_proba([text])[0]
    pred = pipeline.predict([text])[0]
    label = 'phishing' if pred == 1 else 'legitimate'
    print(f'[{name}]')
    print(f'   -> Predicted: {label.upper()} | Phishing Prob: {prob[1]*100:.2f}% | Legit Prob: {prob[0]*100:.2f}%\n')
