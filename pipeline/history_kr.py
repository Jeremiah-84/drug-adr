"""약의 역사 타임라인: 성분마다 국내 첫 품목허가일을 식약처 제품 허가 목록에서 찾습니다.

사용법:
  MFDS_KEY=인증키 python3 pipeline/history_kr.py --out docs/data [--cache .cache]

docs/portal/history.json 의 약마다 "kr" 정규식(성분 영문명)으로 제품 허가 목록 전체(취소·취하 품목 포함)를
훑어, 그 성분이 든 제품 가운데 허가일이 가장 이른 것을 docs/data/history_kr.json 에 씁니다.
run.py 가 받아 둔 목록(.cache/list.json)이 있으면 그대로 씁니다.
"""
import argparse, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from run import fetch_list

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def first_permits(items, drugs):
    out = {}
    for d in drugs:
        rx = re.compile(d["kr"], re.I); rko = re.compile(re.escape(d["ko"]))
        best, n = None, 0
        for p in items:
            ingr = (p.get("ITEM_INGR_NAME") or "") + " " + (p.get("ITEM_ENG_NAME") or "")
            date = re.sub(r"\D", "", str(p.get("ITEM_PERMIT_DATE") or ""))
            if len(date) != 8 or "수출용" in (p.get("ITEM_NAME") or ""):
                continue  # 수출 전용 품목은 국내 판매가 아니므로 뺌
            if not (rx.search(ingr) or rko.search(p.get("ITEM_NAME") or "") or rko.search(p.get("ITEM_INGR_NAME") or "")):
                continue
            n += 1
            if best is None or date < best[0]:
                best = (date, p)
        if best:
            date, p = best
            out[d["id"]] = {"date": f"{date[:4]}-{date[4:6]}-{date[6:]}", "item": p.get("ITEM_NAME"), "seq": p.get("ITEM_SEQ"),
                            "entp": p.get("ENTP_NAME"), "cancel": p.get("CANCEL_NAME") not in (None, "", "정상"), "count": n}
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="docs/data"); ap.add_argument("--cache", default=".cache")
    a = ap.parse_args()
    os.makedirs(a.cache, exist_ok=True)
    items = fetch_list(os.environ.get("MFDS_KEY", ""), a.cache)
    drugs = json.load(open(os.path.join(ROOT, "docs", "portal", "history.json")))["drugs"]
    out = first_permits(items, drugs)
    json.dump(out, open(os.path.join(a.out, "history_kr.json"), "w"), ensure_ascii=False, indent=0)
    print("국내 첫 허가일", len(out), "/", len(drugs))
    for d in drugs:
        r = out.get(d["id"])
        print(" ", d["id"], r and r["date"], r and r["item"], r and r["count"])

if __name__ == "__main__":
    main()
