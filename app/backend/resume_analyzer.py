import spacy
import PyPDF2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import sys
import requests
import io


# Accept arguments from command line
if len(sys.argv) < 3:
    print("0")
    sys.exit(1)

resume_url = sys.argv[1]
job_description = sys.argv[2]

print(f"Debug: Resume URL: {resume_url}", file=sys.stderr)
print(f"Debug: Job description: {job_description[:100]}...", file=sys.stderr)

# Download PDF from URL
def download_pdf_from_url(url):
    try:
        print(f"Debug: Attempting to download from {url}", file=sys.stderr)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        print(f"Debug: Download successful, content length: {len(response.content)}", file=sys.stderr)
        return io.BytesIO(response.content)
    except Exception as e:
        print(f"Error downloading PDF: {e}", file=sys.stderr)
        return None

# Extract text from PDF
def extract_text_from_pdf(pdf_buffer):
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_buffer)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            text += page_text
        print(f"Debug: Extracted text length: {len(text)}", file=sys.stderr)
        print(f"Debug: First 200 chars: {text[:200]}", file=sys.stderr)
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}", file=sys.stderr)
        return ""

# Extract email and name from text
def extract_entities(text):
    emails = re.findall(r'\S+@\S+', text)
    names = re.findall(r'^([A-Z][a-z]+)\s+([A-Z][a-z]+)', text)
    if names:
        names = [" ".join(names[0])]
    return emails, names

# Download and extract text from the resume
pdf_buffer = download_pdf_from_url(resume_url)
if not pdf_buffer:
    print("0")
    sys.exit(1)

resume_text = extract_text_from_pdf(pdf_buffer)
if not resume_text:
    print("0")
    sys.exit(1)

# Extract candidate info
emails, names = extract_entities(resume_text)

# Calculate similarity with the job description
tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform([job_description, resume_text])
similarity_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

print(f"Debug: Similarity score: {similarity_score}", file=sys.stderr)

# Output only the numeric score (0-100 integer)
final_score = int(similarity_score * 100)
print(f"Debug: Final score: {final_score}", file=sys.stderr)
print(final_score)