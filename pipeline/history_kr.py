"""약의 역사 타임라인: 성분마다 국내 첫 품목허가일을 식약처 제품 허가 목록에서 찾습니다.

사용법:
  MFDS_KEY=인증키 python3 pipeline/history_kr.py --out docs/data [--cache .cache]

docs/portal/history.json 의 약마다 "kr" 정규식(성분 영문명)으로 제품 허가 목록 전체(취소·취하 품목 포함)를
훑어, 그 성분이 든 제품 가운데 허가일이 가장 이른 것을 docs/data/history_kr.json 에 씁니다.
run.py 가 받아 둔 목록(.cache/list.json)이 있으면 그대로 씁니다.
"""
import argparse, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from run import fetch_list, base_name, SPEC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def first_permits(items, drugs):
    out = {}
    for d in drugs:
        rx = re.compile(r"(?<![a-z])(?:" + d["kr"] + ")", re.I)  # methylprednisolone 같은 다른 성분 제외
        rko = re.compile(r"(?<![가-힣])" + re.escape(d["ko"]))  # 메틸프레드니솔론·에프로사르탄 같은 다른 성분은 빼려고 앞에 한글이 붙으면 제외
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

def all_first_permits(items, index, skip):
    """약 사전의 성분 전체(skip 제외)에 대해 가장 이른 국내 허가 품목을 찾음. 점 타임라인의 작은 점에 씀."""
    rxs, by_tok = {}, {}
    for d in index:
        gid = d["id"]
        if gid in skip: continue
        rxs[gid] = re.compile(SPEC.get(gid, r"(?<![a-z])" + re.escape(gid) + r"(?![a-z])"))
        tok = re.findall(r"[a-z0-9]{3,}", gid)
        by_tok.setdefault(tok[0] if tok and gid not in SPEC else "*", []).append(gid)
    always = by_tok.pop("*", [])
    best = {}
    for p in items:
        name = p.get("ITEM_NAME") or ""
        date = re.sub(r"\D", "", str(p.get("ITEM_PERMIT_DATE") or ""))
        if len(date) != 8 or "수출용" in name: continue
        raw = (p.get("ITEM_INGR_NAME") or "").lower()
        s = base_name(raw) + " " + raw
        toks = set(re.findall(r"[a-z0-9]{3,}", s))
        for gid in always + [g for t in toks for g in by_tok.get(t, ())]:
            if rxs[gid].search(s) and (gid not in best or date < best[gid][0]):
                best[gid] = (date, name, p.get("ITEM_SEQ"))
    out = []
    for d in index:
        b = best.get(d["id"])
        if b: out.append([d["id"], d["ko"], d.get("brand") or "", f"{b[0][:4]}-{b[0][4:6]}-{b[0][6:]}", b[1], b[2]])
    out.sort(key=lambda r: r[3])
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
    index = json.load(open(os.path.join(a.out, "index.json")))["drugs"]
    allp = all_first_permits(items, index, {d["id"] for d in drugs})
    json.dump({"note": "약 사전 성분별 가장 이른 국내 허가 품목: [id, 한글명, 대표 제품, 허가일, 품목명, 품목기준코드]", "items": allp},
              open(os.path.join(a.out, "history_all.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print("전체 성분 국내 허가 기록", len(allp), "/", len(index))
    print("국내 첫 허가일", len(out), "/", len(drugs))
    for d in drugs:
        r = out.get(d["id"])
        print(" ", d["id"], r and r["date"], r and r["item"], r and r["count"])

if __name__ == "__main__":
    main()
