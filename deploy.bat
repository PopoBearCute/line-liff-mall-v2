@echo off
echo Adding changes to git...
git add .github/workflows/deploy.yml

echo Committing changes...
git commit -m "fix: update GitHub Actions workflow to use npm instead of pnpm"

echo Pushing to GitHub...
git push origin main

echo.
echo Done! Check GitHub Actions at:
echo https://github.com/PopoBearCute/line-liff-mall-v2/actions
pause
