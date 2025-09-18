#!/bin/env python3

import os
import json
import zipfile
import fnmatch
import shutil

# exclusions par nom ou pattern
EXCLUDE = {".git", ".idea", ".vscode", "img", "releases", ".gitignore", "build"}
PATTERN_EXCLUDE = ["*.zip", "*.bat", "*.py", "*.md", "*.exe", "manifest.firefox.json", "manifest.chrome.json"]

def get_version(manifest):
    with open(manifest, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("version", "0.0.0")

def zip_project(version, fichierManifest):
    release_dir = "."
    os.makedirs(release_dir, exist_ok=True)
    zip_name = os.path.join(release_dir, f"lbc_old_price_v{version}.zip")

    shutil.copy2(fichierManifest, "manifest.json")

    with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            # ignorer dossiers exclus
            dirs[:] = [d for d in dirs if d not in EXCLUDE]

            for file in files:
                # ignorer fichiers exclus par nom
                if file in EXCLUDE:
                    continue
                # ignorer fichiers correspondant aux patterns
                if any(fnmatch.fnmatch(file, pattern) for pattern in PATTERN_EXCLUDE):
                    continue
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, ".")
                zipf.write(filepath, arcname)

    os.remove("manifest.json")
    print(f"✅ Archive créée : {zip_name}")

if __name__ == "__main__":
    ff = "manifest.firefox.json"
    versionFF = get_version(ff)
    zip_project(versionFF, ff)
    
    ch = "manifest.chrome.json"
    versionCH = get_version(ch)
    zip_project(versionCH, ch)
