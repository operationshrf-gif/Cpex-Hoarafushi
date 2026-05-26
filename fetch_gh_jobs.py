import urllib.request
import json

url = 'https://api.github.com/repos/operationshrf-gif/Cpex-Hoarafushi/actions/runs'
req = urllib.request.Request(url, headers={'User-Agent': 'python-urllib'})
try:
    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.loads(response.read().decode('utf-8'))
        print("Total runs:", data.get("total_count"))
        for run in data.get("workflow_runs", [])[:5]:
            print(f"Run ID: {run['id']}, Status: {run['status']}, Conclusion: {run['conclusion']}, HTML URL: {run['html_url']}")
except Exception as e:
    print("Error:", e)


