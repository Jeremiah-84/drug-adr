"""식약처 DUR 성분정보로 '같이 먹으면 안 되는 약'(병용금기)과 '같은 효능군 중복' 자료를 만듭니다.

출처: 공공데이터포털 '식품의약품안전처_의약품안전사용서비스(DUR)성분정보' (DURIrdntInfoService03)
  - getUsjntTabooInfoList02 : 병용금기
  - getEfcyDplctInfoList02  : 효능군중복

사용법:
  MFDS_KEY=인증키 python3 pipeline/dur.py --raw          # 원자료만 받아 pipeline/dur_raw.json 에 저장
  python3 pipeline/dur.py --out docs/data                # 원자료 + docs/data/index.json 으로 interactions.json 만들기
  MFDS_KEY=인증키 python3 pipeline/dur.py --fetch --out docs/data   # 받기 + 만들기 (매월 자동 갱신)
"""
import argparse, json, os, sys, time, urllib.parse, urllib.request

API = "https://apis.data.go.kr/1471000/DURIrdntInfoService03/"
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "dur_raw.json")
OPS = {"taboo": "getUsjntTabooInfoList02", "efcy": "getEfcyDplctInfoList02"}

def call(op, params, key, tries=6):
    url = API + op + "?" + urllib.parse.urlencode({"serviceKey": key, "type": "json", **params})
    last = None
    for a in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                txt = r.read().decode("utf-8")
            d = json.loads(txt)
            if "body" not in d:
                raise RuntimeError(txt[:300])
            return d["body"]
        except Exception as e:
            last = e
            print("  retry", op, params.get("pageNo"), e, flush=True)
            time.sleep(3 * (a + 1))
    raise RuntimeError(f"DUR API 호출 실패: {op} {last}")

def items_of(body):
    it = body.get("items") or []
    if isinstance(it, dict):
        it = it.get("item") or []
        if isinstance(it, dict): it = [it]
    return it

def fetch_all(key):
    out = {}
    for name, op in OPS.items():
        first = call(op, {"numOfRows": 100, "pageNo": 1}, key)
        rows = items_of(first); total = int(first.get("totalCount") or 0)
        pages = (total + 99) // 100
        for p in range(2, pages + 1):
            rows += items_of(call(op, {"numOfRows": 100, "pageNo": p}, key))
            if p % 20 == 0: print(name, "page", p, "/", pages, flush=True)
        print(name, "rows", len(rows), "/", total, flush=True)
        out[name] = rows
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", action="store_true", help="원자료만 받기")
    ap.add_argument("--fetch", action="store_true", help="원자료 받은 뒤 만들기")
    ap.add_argument("--out", default="docs/data")
    a = ap.parse_args()
    if a.raw or a.fetch:
        key = os.environ.get("MFDS_KEY", "")
        raw = fetch_all(key)
        json.dump(raw, open(RAW, "w"), ensure_ascii=False, indent=0)
        if a.raw: return
    if os.path.exists(os.path.join(HERE, "dur_build.py")):
        sys.path.insert(0, HERE)
        from dur_build import build
        build(json.load(open(RAW)), a.out)

if __name__ == "__main__":
    main()
