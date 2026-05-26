import urllib.request
import json

url = 'https://api.github.com/repos/ibbe12/New-folder1/actions/runs/26387960998/jobs'
req = urllib.request.Request(url, headers={'User-Agent': 'python-urllib'})
with urllib.request.urlopen(req, timeout=30) as response:
    data = json.load(response)
    print(json.dumps(data, indent=2)[:20000])
