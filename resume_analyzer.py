import spacy
import PyPDF2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

# Load spaCy NER model
nlp = spacy.load("en_core_web_sm")

# Sample job description
job_description = "NLP Specialist: Develop and implement NLP algorithms. Proficiency in, NLP libraries, and frameworks required."

# Path to the single resume PDF
resume_path = "./Resume.pdf"  # Change this to the actual file

# Extract text from PDF
def extract_text_from_pdf(pdf_path):
    with open(pdf_path, "rb") as pdf_file:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text

# Extract email and name from text
def extract_entities(text):
    emails = re.findall(r'\S+@\S+', text)
    names = re.findall(r'^([A-Z][a-z]+)\s+([A-Z][a-z]+)', text)
    if names:
        names = [" ".join(names[0])]
    return emails, names

# Extract text from the resume
resume_text = extract_text_from_pdf(resume_path)

# Extract candidate info
emails, names = extract_entities(resume_text)

# Calculate similarity with the job description
tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform([job_description, resume_text])
similarity_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

# Output the result
print(f"Similarity Score: {similarity_score:.2f}")