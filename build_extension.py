"""확장 프로그램 설치 폴더(dist/drug-adr-extension)와 웹 버전(docs)을 만듭니다.
사용법: python3 build_extension.py https://아이디.github.io/저장소/"""
import json, os, shutil, sys, zipfile
remote = sys.argv[1] if len(sys.argv) > 1 else ""
if remote and not remote.endswith("/"): remote += "/"
root = os.path.dirname(os.path.abspath(__file__))
dist = os.path.join(root, "dist", "drug-adr-extension")
shutil.rmtree(dist, ignore_errors=True); os.makedirs(dist)
shutil.rmtree(dist); shutil.copytree(os.path.join(root, "extension"), dist)
for f in ("panel.html", "app.js", "i18n.js"): shutil.copy(os.path.join(root, "app", f), dist)
shutil.copytree(os.path.join(root, "docs", "data"), os.path.join(dist, "data"))
open(os.path.join(dist, "config.js"), "w").write("window.ADR_CONFIG=" + json.dumps({"mode": "ext", "remote": remote}) + ";\n")
# 웹 버전
web = open(os.path.join(root, "app", "panel.html"), encoding="utf-8").read().replace("</head>", '<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="theme-color" content="#1f6f5c">\n<script>if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{})</script>\n</head>', 1)
open(os.path.join(root, "docs", "index.html"), "w", encoding="utf-8").write(web)
for f in ("app.js", "i18n.js"): shutil.copy(os.path.join(root, "app", f), os.path.join(root, "docs", f))
open(os.path.join(root, "docs", "config.js"), "w").write("window.ADR_CONFIG=" + json.dumps({"mode": "web", "remote": ""}) + ";\n")
z = os.path.join(root, "dist", "drug-adr-extension.zip")
with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
    for base, _, files in os.walk(dist):
        for f in files:
            p = os.path.join(base, f); zf.write(p, os.path.relpath(p, os.path.dirname(dist)))
print("만듦:", dist, z)
