@echo off
REM Vérifie si release.exe existe
if not exist "release.exe" (
    REM Génère l'exécutable avec PyInstaller
    python -m PyInstaller --onefile --distpath . --workpath build --specpath build release.py

    REM Supprime les dossiers et fichiers temporaires
    rmdir /S /Q build
) else (
    echo release.exe existe deja, generation skipped.
)

REM Lance l'exécutable
release.exe

if %EXIT_CODE%==0 (
    exit
) else (
    echo Le programme a rencontre une erreur. Appuyez sur une touche pour fermer.
    pause
)