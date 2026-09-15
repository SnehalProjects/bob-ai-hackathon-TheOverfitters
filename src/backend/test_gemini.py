import os
import sys
from dotenv import load_dotenv

load_dotenv("d:/bob-ai-hackathon-TheOverfitters/src/backend/.env")

api_key = os.getenv("GEMINI_API_KEY", "")
print(f"API Key loaded (length {len(api_key)}): {api_key[:6]}...{api_key[-4:] if len(api_key) > 10 else ''}")

try:
    from google import genai
    client = genai.Client(api_key=api_key)
    print("Testing genai.Client with gemini-1.5-flash...")
    res = client.models.generate_content(model="gemini-1.5-flash", contents="Hello, reply with OK.")
    print("SUCCESS genai.Client:", res.text)
except Exception as e:
    print("ERROR genai.Client:", type(e), e)

try:
    import google.generativeai as legacy_genai
    legacy_genai.configure(api_key=api_key)
    print("Testing google.generativeai with gemini-1.5-flash...")
    m = legacy_genai.GenerativeModel("gemini-1.5-flash")
    res = m.generate_content("Hello, reply with OK.")
    print("SUCCESS legacy_genai:", res.text)
except Exception as e:
    print("ERROR legacy_genai:", type(e), e)

try:
    print("Listing models from legacy_genai...")
    import google.generativeai as legacy_genai
    legacy_genai.configure(api_key=api_key)
    for model in legacy_genai.list_models():
        if "generateContent" in model.supported_generation_methods:
            print("  -", model.name)
except Exception as e:
    print("ERROR listing models:", type(e), e)
