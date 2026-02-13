import subprocess
import json
import sys

def get_env():
    cmd = [
        "gcloud", "run", "services", "describe", "line-liff-mall-v2",
        "--region", "asia-east1",
        "--project", "gen-lang-client-0632743402",
        "--format", "json"
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, shell=True)
        data = json.loads(result.stdout)
        env = data['spec']['template']['spec']['containers'][0]['env']
        for e in env:
            print(f"{e['name']}={e['value']}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if hasattr(e, 'stderr'):
            print(f"Stderr: {e.stderr}", file=sys.stderr)

if __name__ == "__main__":
    get_env()
