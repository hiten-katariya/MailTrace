import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, f1_score, precision_score, recall_score, confusion_matrix

DATA_PATHS = [
    os.path.join("Backend", "Data", "Training", "combined_dataset.csv"),
    os.path.join("backend", "data", "training", "combined_dataset.csv"),
]
MODEL_OUTPUT_PATHS = [
    os.path.join("Backend", "models", "phishing_classifier.joblib"),
    os.path.join("backend", "models", "phishing_classifier.joblib"),
]
for p in MODEL_OUTPUT_PATHS:
    os.makedirs(os.path.dirname(p), exist_ok=True)

def train_model():
    print("=" * 60)
    print("=== Training TF-IDF + MLP (Multi-Layer Perceptron) Neural Network ===")
    print("=" * 60)

    data_path = None
    for p in DATA_PATHS:
        if os.path.exists(p):
            data_path = p
            break

    if not data_path:
        raise FileNotFoundError(f"Training dataset not found in {DATA_PATHS}. Run prepare_training_data.py first.")

    print(f"[+] Loading deduplicated dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Fill NAs
    df["subject"] = df["subject"].fillna("")
    df["body"] = df["body"].fillna("")
    df["text"] = df["subject"] + " " + df["body"]
    
    # Target encoding: 'phishing' -> 1, 'legitimate' -> 0
    df["target"] = df["label"].apply(lambda x: 1 if str(x).lower() == "phishing" else 0)

    X = df["text"].values
    y = df["target"].values

    phish_count = int(sum(y))
    legit_count = int(len(y) - phish_count)
    print(f"[+] Total deduplicated samples: {len(X):,} (Phishing: {phish_count:,}, Legitimate: {legit_count:,})")

    # 80/20 train/test split with stratify
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"[+] Train set: {len(X_train):,} samples | Test set: {len(X_test):,} samples")

    from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
    custom_stopwords = list(ENGLISH_STOP_WORDS.union({
        "enron", "dmdx", "handyboard", "linguistics", "9fans", "ra", "houston",
        "kaminski", "skilling", "vince", "shirley", "ect", "diet", "pills", "cialis",
        "viagra", "vicodin", "xanax", "valium", "2001", "2000", "1999", "1998", "1997",
        "mike", "john", "hb", "eol", "pm", "ur", "kent"
    }))

    # Construct MLP Neural Network Pipeline
    print("[+] Building TF-IDF + Multi-Layer Perceptron (MLP) architecture...")
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=12000,
            ngram_range=(1, 2),
            stop_words=custom_stopwords,
            sublinear_tf=True,
            strip_accents="unicode",
            min_df=2,
        )),
        ("clf", MLPClassifier(
            hidden_layer_sizes=(128, 64),
            activation="relu",
            solver="adam",
            alpha=1e-4,
            batch_size=256,
            learning_rate_init=0.001,
            max_iter=30,
            early_stopping=True,
            validation_fraction=0.1,
            n_iter_no_change=4,
            random_state=42,
            verbose=True,
        )),
    ])

    print("[+] Fitting model pipeline...")
    pipeline.fit(X_train, y_train)

    # Evaluate on held-out test split
    print("[+] Evaluating on held-out test split...")
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "="*50)
    print("MODEL EVALUATION METRICS (HELD-OUT TEST SET):")
    print(f"Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
    print(f"Precision: {prec:.4f} ({prec*100:.2f}%)")
    print(f"Recall:    {rec:.4f} ({rec*100:.2f}%)")
    print(f"F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
    print("\nConfusion Matrix:")
    print(f"  TN (Legit correctly classified):  {cm[0][0]}")
    print(f"  FP (Legit misclassified phish):   {cm[0][1]}")
    print(f"  FN (Phish missed):                {cm[1][0]}")
    print(f"  TP (Phish correctly classified):  {cm[1][1]}")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["legitimate", "phishing"]))
    print("="*50 + "\n")

    # Save artifact
    for p in MODEL_OUTPUT_PATHS:
        joblib.dump(pipeline, p)
        print(f"[+] Serialized model artifact saved to {p}")
    print("=== Training Completed Successfully ===")

if __name__ == "__main__":
    train_model()
