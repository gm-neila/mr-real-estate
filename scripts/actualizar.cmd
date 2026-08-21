@echo off
cd /d "%~dp0.."
echo Actualizando inmuebles desde vuestra tienda de Milanuncios / Fotocasa Pro...
echo Si el companero publica ahi, con esto basta.
echo Idealista de Salamanca: cuando tengas la URL Pro, pegala en scripts\portals.json
echo NO uses idealista.com/pro/mr-realestate (es Palma, otra empresa).
node scripts/sync-listings.mjs
if errorlevel 1 (
  echo.
  echo No se pudo actualizar. Si Milanuncios pide captcha, abre la tienda en el navegador y reintenta.
  pause
  exit /b 1
)
echo.
echo Listo. Para publicarlo en la web: git add -A && git commit && git push
echo O dime en el chat que lo suba a GitHub Pages.
pause
