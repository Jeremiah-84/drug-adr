"""약 사전 성분마다 짧은 소개(약효 분류 + 효능·효과 첫 부분)를 식약처 허가정보에서 그대로 옮깁니다. AI를 쓰지 않습니다.

사용법:
  MFDS_KEY=인증키 python3 pipeline/brief.py --out docs/data [--cache .cache]

docs/data/index.json 의 성분마다 대표 품목(seq)의
  - 약효 분류: 제품 허가 목록의 PRDUCT_TYPE (예: "[02140]혈압강하제" → "혈압강하제")
  - 효능·효과: 허가정보 상세의 EE_DOC_DATA 첫 문단들 (원문 그대로, 길면 문장·쉼표에서 자름)
을 docs/data/brief.json 에 {성분 id: [분류, 효능·효과]} 로 씁니다. 약의 역사 화면의 작은 점 설명에 씁니다.
run.py 가 받아 둔 목록(.cache/list.json)과 상세(.cache/detail/<seq>.json)가 있으면 그대로 씁니다.
"""
import argparse, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from run import fetch_detail
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
    ap.add_argument("--out", default="docs/data"); ap.add_argument("--cache", default=".cache"); ap.add_argument("--budget", type=float, default=70, help="분 단위 시간 예산")
    a = ap.parse_args()
    key = os.environ.get("MFDS_KEY", "")
    os.makedirs(a.cache, exist_ok=True)
    idx = json.load(open(os.path.join(a.out, "index.json")))
    # 약효 분류는 상세 응답의 PRDUCT_TYPE을 먼저 쓰고, 없으면 run.py가 받아 둔 목록(.cache/list.json)에서 찾음 (목록을 새로 받지는 않음: 오래 걸림)
    lp = os.path.join(a.cache, "list.json")
    types = {p["ITEM_SEQ"]: p.get("PRDUCT_TYPE") for p in json.load(open(lp))} if os.path.exists(lp) else {}
    bp = os.path.join(a.out, "brief.json")
    out = json.load(open(bp)) if os.path.exists(bp) else {}   # 지난번 결과를 이어서 채움
    t0, n_ee, n_new = time.time(), 0, 0
    for i, d in enumerate(idx["drugs"]):
        if d["id"] in out and not os.path.exists(os.path.join(a.cache, "detail", f"{d['seq']}.json")):
            continue  # 이미 있고 캐시도 없으면 다시 받지 않음
        if time.time() - t0 > a.budget * 60:
            print("시간 예산을 다 써서 여기까지 저장", i, "/", len(idx["drugs"])); break
        try:
            raw = fetch_detail(d["seq"], key, a.cache)
        except Exception as e:
            print("건너뜀", d["id"], e); continue
        ef = efficacy(raw.get("EE_DOC_DATA") or "")
        n_ee += bool(ef); n_new += 1
        c = klass(raw.get("PRDUCT_TYPE") or types.get(d["seq"]))
        if c or ef: out[d["id"]] = [c, ef]
        if i % 100 == 0:
            print("소개", i, "/", len(idx["drugs"]), flush=True)
            json.dump(out, open(bp, "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump(out, open(bp, "w"), ensure_ascii=False, separators=(",", ":"))
    print("완료", len(out), "이번에 받은 것", n_new, "효능", n_ee)

if __name__ == "__main__":
    main()
