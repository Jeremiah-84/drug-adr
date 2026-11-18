"""식약처 낱알식별 정보(새긴 글자·모양·색)를 받아 .cache/pills.json 에 저장합니다. run.py 가 이걸 읽어 docs/data/pills.json 을 만듭니다.
사용법: MFDS_KEY=인증키 python3 pipeline/pills.py [--cache .cache]
"""
import argparse, json, os, sys, urllib.parse, urllib.request, time, concurrent.futures as cf

API = "https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03"
KEEP = ("ITEM_SEQ", "ITEM_NAME", "ENTP_NAME", "CHART", "ITEM_IMAGE", "PRINT_FRONT", "PRINT_BACK", "DRUG_SHAPE",
        "COLOR_CLASS1", "COLOR_CLASS2", "LINE_FRONT", "LINE_BACK", "FORM_CODE_NAME", "MARK_CODE_FRONT_ANAL", "MARK_CODE_BACK_ANAL",
        "LENG_LONG", "LENG_SHORT", "EDI_CODE")

def call(params, key, tries=6):
    url = API + "?" + urllib.parse.urlencode({"serviceKey": key, "type": "json", **params})
    for a in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return json.load(r)["body"]
        except Exception as e:
            print("  retry", params.get("pageNo"), e, flush=True); time.sleep(3 * (a + 1))
    raise RuntimeError(f"낱알식별 호출 실패 {params}")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--cache", default=".cache"); a = ap.parse_args()
    key = os.environ["MFDS_KEY"]
    first = call({"numOfRows": 100, "pageNo": 1}, key); pages = (first["totalCount"] + 99) // 100
    def page(p):
        return first["items"] if p == 1 else call({"numOfRows": 100, "pageNo": p}, key)["items"]
    items = []
    with cf.ThreadPoolExecutor(4) as ex:
        for i, r in enumerate(ex.map(page, range(1, pages + 1))):
            items += [{k: it.get(k) for k in KEEP} for it in r]
            if i % 25 == 0: print("page", i + 1, "/", pages, flush=True)
    os.makedirs(a.cache, exist_ok=True)
    json.dump(items, open(os.path.join(a.cache, "pills.json"), "w"), ensure_ascii=False)
    print("완료", len(items))

if __name__ == "__main__":
    main()
