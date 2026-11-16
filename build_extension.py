"""확장 프로그램 설치 폴더(dist/drug-adr-extension)와 웹 버전(docs)을 만듭니다.
사용법: python3 build_extension.py https://아이디.github.io/저장소/"""
import json, os, shutil, sys, zipfile
remote = sys.argv[1] if len(sys.argv) > 1 else ""
if remote and not remote.endswith("/"): remote += "/"
root = os.path.dirname(os.path.abspath(__file__))
dist = os.path.join(root, "dist", "drug-adr-extension")
shutil.rmtree(dist, ignore_errors=True); os.makedirs(dist)
for f in os.listdir(os.path.join(root, "extension")): shutil.copy(os.path.join(root, "extension", f), dist)
for f in ("panel.html", "app.js"): shutil.copy(os.path.join(root, "app", f), dist)
shutil.copytree(os.path.join(root, "docs", "data"), os.path.join(dist, "data"))
open(os.path.join(dist, "config.js"), "w").write("window.ADR_CONFIG=" + json.dumps({"mode": "ext", "remote": remote}) + ";\n")
# 웹 버전
shutil.copy(os.path.join(root, "app", "panel.html"), os.path.join(root, "docs", "index.html"))
shutil.copy(os.path.join(root, "app", "app.js"), os.path.join(root, "docs", "app.js"))
open(os.path.join(root, "docs", "config.js"), "w").write("window.ADR_CONFIG=" + json.dumps({"mode": "web", "remote": ""}) + ";\n")
z = os.path.join(root, "dist", "drug-adr-extension.zip")
with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
    for base, _, files in os.walk(dist):
        for f in files:
            p = os.path.join(base, f); zf.write(p, os.path.relpath(p, os.path.dirname(dist)))
print("만듦:", dist, z)
