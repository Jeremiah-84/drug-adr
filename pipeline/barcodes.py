"""제품 포장 바코드(표준코드) 모으기.

허가정보 상세(getDrugPrdtPrmsnDtlInq08)의 BAR_CODE 를 품목기준코드별로 pipeline/barcodes.json 에 모아 둡니다.
  --full : 상세 전체를 쪽(100건)마다 받아 다시 만듦 (약 430번 호출, 처음 한 번)
  기본   : 목록(.cache/list.json)에 있는데 아직 바코드가 없는 새 품목만 하나씩 받음 (매월 자동 갱신용)
사용법: MFDS_KEY=인증키 python3 pipeline/barcodes.py [--full] [--cache .cache]
"""
import argparse, json, os, sys, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(__file__))
from run import call, fetch_list

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "barcodes.json")

def codes(it):
    return ",".join(c.strip() for c in str(it.get("BAR_CODE") or "").split(",") if c.strip().isdigit())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--full", action="store_true"); ap.add_argument("--cache", default=".cache")
    ap.add_argument("--max-new", type=int, default=3000)
    a = ap.parse_args()
    key = os.environ["MFDS_KEY"]
    have = json.load(open(OUT)) if os.path.exists(OUT) else {}
    if a.full:
        first = call("getDrugPrdtPrmsnDtlInq08", {"numOfRows": 100, "pageNo": 1}, key)
        pages = (first["totalCount"] + 99) // 100
        def page(p):
            items = first["items"] if p == 1 else call("getDrugPrdtPrmsnDtlInq08", {"numOfRows": 100, "pageNo": p}, key)["items"]
            return {it["ITEM_SEQ"]: codes(it) for it in items}
        with cf.ThreadPoolExecutor(4) as ex:
            for i, r in enumerate(ex.map(page, range(1, pages + 1))):
                have.update(r)
                if i % 20 == 0:
                    print("page", i + 1, "/", pages, flush=True)
                    json.dump(have, open(OUT, "w"), separators=(",", ":"))
    else:
        items = fetch_list(key, a.cache)
        new = [p["ITEM_SEQ"] for p in items if p["ITEM_SEQ"] not in have][: a.max_new]
        print("새 품목", len(new))
        for s in new:
            try:
                its = call("getDrugPrdtPrmsnDtlInq08", {"item_seq": s, "numOfRows": 1}, key)["items"]
                have[s] = codes(its[0]) if its else ""
            except Exception as e:
                print("건너뜀", s, e)
    json.dump(dict(sorted(have.items())), open(OUT, "w"), separators=(",", ":"))
    print("완료", len(have), "품목,", sum(1 for v in have.values() if v), "개에 바코드")

if __name__ == "__main__":
    main()
