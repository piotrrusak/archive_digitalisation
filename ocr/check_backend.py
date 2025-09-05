import os
import requests

BASE_URL = (os.getenv("BACKEND_BASE_URL") or "http://localhost:8080").rstrip("/")
TOKEN = (os.getenv("BACKEND_AUTH_BEARER") or "").strip()

print(BASE_URL, TOKEN)

url = f"{BASE_URL}/api/v1/formats"

headers = {}

if TOKEN:
    headers["Authorization"] = f"Bearer {TOKEN}"

print(f"Checking backend at {url} ...")
print("Using headers:", headers)
try:
    r = requests.get(url, headers=headers, timeout=5)
    print("Status:", r.status_code)
    print("Body preview:", r.text[:200], "...")
except Exception as e:
    print("Error:", e)
