param(
    [string]$Version = "1.0.1"
)

git add -A
git commit -m "chore(release): v$Version"
git tag -a "v$Version" -m "v$Version"
git push origin HEAD
git push origin "v$Version"

Write-Host "Released v$Version (local commits pushed and tag pushed)."
