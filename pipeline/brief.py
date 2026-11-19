"""약 사전 성분마다 짧은 소개(약효 분류 + 효능·효과 첫 부분)를 식약처 허가정보에서 그대로 옮깁니다. AI를 쓰지 않습니다.

사용법:
  MFDS_KEY=인증키 python3 pipeline/brief.py --out docs/data [--cache .cache]

docs/data/index.json 의 성분마다 대표 품목(seq)의
  - 약효 분류: 제품 허가 목록의 PRDUCT_TYPE (예: "[02140]혈압강하제" → "혈압강하제")
  - 효능·효과: 허가정보 상세의 EE_DOC_DATA 첫 문단들 (원문 그대로, 길면 문장·쉼표에서 자름)
을 docs/data/brief.json 에 {성분 id: [분류, 효능·효과]} 로 씁니다. 약의 역사 화면의 작은 점 설명에 씁니다.
run.py 가 받아 둔 목록(.cache/list.json)과 상세(.cache/detail/<seq>.json)가 있으면 그대로 씁니다.
"""
import argparse, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from run import fetch_list, fetch_detail
from extract import _paras

MAX = 150

def klass(t):
    t = re.sub(r"\[[^\]]*\]", "", t or "").strip()
    return "" if t in ("", "기타", "따로 분류되지 않는 것") else t

def efficacy(ee):
    parts = []
    for _title, t in _paras(ee):
        t = re.sub(r"^\s*(\d+[.)]|[○●◦·•\-]|[가-하][.)])\s*", "", t).strip()
        if t: parts.append(t)
    s = re.sub(r"\s+", " ", " / ".join(parts)).strip()
    if len(s) <= MAX: return s
    cut = s[:MAX]
    for sep in (". ", "다. ", " / ", ", "):
        i = cut.rfind(sep)
        if i >= 60: return cut[:i + (1 if sep.startswith(".") or sep.startswith("다") else 0)].rstrip(" ,/") + " …"
    return cut.rstrip() + " …"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="docs/data"); ap.add_argument("--cache", default=".cache")
    a = ap.parse_args()
    key = os.environ.get("MFDS_KEY", "")
    os.makedirs(a.cache, exist_ok=True)
    idx = json.load(open(os.path.join(a.out, "index.json")))
    types = {p["ITEM_SEQ"]: p.get("PRDUCT_TYPE") for p in fetch_list(key, a.cache)}
    out, n_ee = {}, 0
    for i, d in enumerate(idx["drugs"]):
        try:
            raw = fetch_detail(d["seq"], key, a.cache)
        except Exception as e:
            print("건너뜀", d["id"], e); raw = {}
        ef = efficacy(raw.get("EE_DOC_DATA") or "")
        n_ee += bool(ef)
        c = klass(types.get(d["seq"]))
        if c or ef: out[d["id"]] = [c, ef]
        if i % 200 == 0: print("소개", i, "/", len(idx["drugs"]), flush=True)
    json.dump(out, open(os.path.join(a.out, "brief.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print("완료", len(out), "효능", n_ee)

if __name__ == "__main__":
    main()
