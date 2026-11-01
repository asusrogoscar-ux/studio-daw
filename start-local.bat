@echo off
chcp 65001 >nul 2>&1

echo ============================================
echo    Studio DAW - Serveur Local
echo ============================================
echo.

cd /d %~dp0

echo Démarrage du serveur HTTP sur le port 8000...
echo.

rem Essayer avec py (Python 3)
py -m http.server 8000 2>nul

rem Si py échoue, essayer avec python
if errorlevel 1 (
    python -m http.server 8000
)

rem Si python échoue aussi, essayer avec python3
if errorlevel 1 (
    python3 -m http.server 8000
)

if errorlevel 1 (
    echo.
    echo ERREUR: Python n'est pas installé ou n'est pas dans le PATH
    echo.
    echo Pour installer Python sur Windows:
    echo 1. Téléchargez Python depuis https://www.python.org/downloads/
    echo 2. Pendant l'installation, cochez "Add Python to PATH"
    echo 3. Réessayez de lancer ce fichier
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo    Serveur démarré avec succès!
echo ============================================
echo.
echo Ouvrez votre navigateur et accédez à:
echo   http://localhost:8000
echo.
echo Pour arrêter le serveur:
echo   - Fermez cette fenêtre (Ctrl+C ou cliquez sur la croix)
echo.
echo ============================================
echo.
