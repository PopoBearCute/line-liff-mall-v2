import subprocess
import json
import sys
import argparse

def get_env(show_values=False):
    cmd = [
        "gcloud", "run", "services", "describe", "line-liff-mall-v2",
        "--region", "asia-east1",
        "--project", "gen-lang-client-0632743402",
        "--format", "json"
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        env = data['spec']['template']['spec']['containers'][0]['env']
        for e in env:
            value = e.get('value', '') if show_values else '<redacted>'
            print(f"{e['name']}={value}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if hasattr(e, 'stderr'):
            print(f"Stderr: {e.stderr}", file=sys.stderr)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Inspect Cloud Run environment variable names.')
    parser.add_argument(
        '--show-values',
        action='store_true',
        help='Print values to the terminal. Avoid redirecting this output to tracked files.',
    )
    args = parser.parse_args()
    get_env(show_values=args.show_values)
