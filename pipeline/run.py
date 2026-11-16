"""식약처 허가정보로 약 이상반응 데이터를 만드는 전체 작업.

사용법:
  MFDS_KEY=인증키 python3 pipeline/run.py --out docs/data [--cache .cache]

1) 전체 제품 목록(약 4만 3천 건)을 받아 제품명 → 성분 색인을 만들고
2) 경구 단일 성분을 묶어 성분마다 대표 첨부문서 1개를 고른 뒤 (핵심 목록은 core_list.csv의 제품 고정)
3) 첨부문서를 받아 이상반응·신/간기능 정보를 규칙으로 추출하고
4) docs/data 에 index.json, d/<약>.json, version.json 을 씁니다.
"""
import argparse, collections, csv, datetime, json, os, re, sys, time, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from extract import extract_adr, extract_organ, adr_paragraphs
from problems import PROBLEMS

API = "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService08/"
HERE = os.path.dirname(__file__)

def call(op, params, key, tries=6):
    url = API + op + "?" + urllib.parse.urlencode({"serviceKey": key, "type": "json", **params})
    for a in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                d = json.load(r)
            return d["body"]
        except Exception as e:
            print("  retry", op, params.get("pageNo") or params.get("item_seq"), e, flush=True)
            time.sleep(3 * (a + 1))
    raise RuntimeError(f"API 호출 실패: {op} {params}")

def fetch_list(key, cache):
    path = os.path.join(cache, "list.json")
    if os.path.exists(path):
        return json.load(open(path))
    first = call("getDrugPrdtPrmsnInq08", {"numOfRows": 500, "pageNo": 1}, key)
    items = first["items"]; pages = (first["totalCount"] + 499) // 500
    for p in range(2, pages + 1):
        items += call("getDrugPrdtPrmsnInq08", {"numOfRows": 500, "pageNo": p}, key)["items"]
        print("list page", p, "/", pages, flush=True)
    json.dump(items, open(path, "w"), ensure_ascii=False)
    return items

def fetch_detail(seq, key, cache):
    path = os.path.join(cache, "detail", f"{seq}.json")
    if os.path.exists(path):
        return json.load(open(path))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    it = call("getDrugPrdtPrmsnDtlInq08", {"item_seq": seq, "numOfRows": 1}, key)["items"][0]
    json.dump(it, open(path, "w"), ensure_ascii=False)
    return it

SALT = r'\b(hydrochloride|hcl|besylate|besilate|camsylate|maleate|mesylate|mesilate|sodium|potassium|calcium|magnesium|hydrate|monohydrate|dihydrate|trihydrate|sesquihydrate|hemihydrate|anhydrous|tartrate|bitartrate|citrate|fumarate|hemifumarate|succinate|sulfate|bisulfate|hydrobromide|bromide|acetate|phosphate|dipotassium|disodium|nitrate|oxalate|malate|lactate|tosylate|tosilate|medoxomil|cilexetil|axetil|proxetil|pivoxil|propanediol|l-pyroglutamic acid|micronized|dispersion|zinc|ethyl|esters?|salt|lysine|arginine|meglumine|trometamol|hemitartrate|valerate|benzoate|palmitate|stearate|hemicalcium|olamine|decanoate|enanthate|hyclate|pamoate|aspartate|gluconate|carbonate|oxide|chloride|hemimalate|hemiedisylate|edisylate|orotate|nicotinate|adipate|camsilate|napadisilate|salicylate)\b'
def base_name(n):
    n = n.lower(); n = re.sub(r"\(.*?\)", "", n); n = re.sub(SALT, " ", n)
    n = re.sub(r"[^a-z0-9\- ]", " ", n); return re.sub(r"\s+", " ", n).strip()
ORAL = re.compile(r"(정|캡슐|산|과립|시럽|현탁|액|환|츄)")
NONORAL = re.compile(r"(주사|주\d|주$|주\(|주사액|패취|패치|겔|크림|연고|좌제|좌약|점안|점이|점비|외용|흡입|분무|스프레이|플라스타|카타플라스마|로션|질정|가글|구강|에어로솔|필름(?!코팅)|첩부|트로키|관장|외용액|이식|투여용|투석|수액|세정)")
EXCL = ("[06340]", "[02230]", "[02610]", "[07320]", "[07390]", "[07190]", "[07990]", "[03410]", "[01110]", "[02650]", "[02310]", "[01320]", "[01310]", "[02640]", "[02690]", "[01210]", "[02670]")
SPEC = {"omega-3": r"omega-3", "valproate": r"valpro|divalproex", "ginkgo biloba": r"ginkgo", "spherical carbon": r"spherical",
        "mycophenolate": r"mycophen", "omeprazole": r"(?<![a-z])omeprazole", "amlodipine": r"(?<![a-z-])amlodipine", "lithium": r"lithium",
        "amoxicillin/clavulanate": r"(?=.*amoxicillin)(?=.*clavulan)", "choline alfoscerate": r"alfoscerate",
        "tenofovir": r"(?<![a-z])tenofovir(?! alafenamide)", "valsartan": r"(?<!sacubitril )(?<![a-z])valsartan", "ursodeoxycholic acid": r"^(?!.*chenodeoxy).*ursodeoxycholic"}
KSALT = r"(헤미말산염|베실산염|캄실산염|말레산염|메실산염|염산염|브롬화수소산염|황산염|타르타르산염|푸마르산염|숙신산염|시트르산염|아세트산염|인산염|나트륨|칼륨|칼슘|마그네슘|수화물|일수화물|이수화물|삼수화물|무수물|메독소밀|실렉세틸|악세틸|프록세틸|프로판디올|미분화|토실산염|옥살산염|질산염|염)+$"

def ko_name(name):
    m = re.findall(r"\(([^()]+)\)", name)
    k = (m[-1] if m else name).split(",")[0].strip()
    k = re.sub(r"\d.*$", "", k); k = re.sub(KSALT, "", k).strip()
    return k or name

def brand_core(name):
    core = re.split(r"[\d(（]", name)[0].strip()
    return re.sub(r"(서방|장용|필름코팅|구강붕해|츄어블|연질|경질|발포|분산)?(정|캡슐|산|과립|시럽|현탁액|액|주사액|주|패취|겔|크림|연고|좌제)$", "", core).strip()

def slug(s):
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="docs/data"); ap.add_argument("--cache", default=".cache"); ap.add_argument("--offline", action="store_true", help="캐시에 없는 첨부문서는 건너뜀")
    a = ap.parse_args()
    key = os.environ.get("MFDS_KEY", "")
    os.makedirs(a.cache, exist_ok=True)
    prods = [p for p in fetch_list(key, a.cache) if p.get("CANCEL_NAME") == "정상" and "수출" not in p["ITEM_NAME"]]
    print("정상 제품", len(prods))
    core = list(csv.DictReader(open(os.path.join(HERE, "core_list.csv"))))
    core_rx = {c["id"]: re.compile(SPEC.get(c["id"], r"(?<![a-z])" + re.escape(c["id"]) + r"(?![a-z])")) for c in core}

    def ids_of(ingr):
        s = (ingr or "").lower(); hit = [cid for cid, rx in core_rx.items() if rx.search(s)]
        if "amoxicillin/clavulanate" in hit and "amoxicillin" in hit: hit.remove("amoxicillin")
        return hit

    # 경구 단일 성분 묶기
    groups = collections.defaultdict(list)
    for p in prods:
        if int(p.get("ITEM_INGR_CNT") or 0) != 1: continue
        if (p.get("PRDUCT_TYPE") or "").startswith(EXCL): continue
        n = p["ITEM_NAME"]
        if NONORAL.search(n) or not ORAL.search(n): continue
        b = base_name(p.get("ITEM_INGR_NAME") or "")
        if len(b) < 3: continue
        cid = (ids_of(b) or [None])[0]
        groups[cid or b].append(p)
    drugs = {}
    for c in core:
        drugs[c["id"]] = {"id": c["id"], "ko": c["ko"], "brand": c["brand"], "seq": c["item_seq"], "tier": 1}
    for gid, ps in groups.items():
        if gid in drugs: continue
        ps.sort(key=lambda p: (p["SPCLTY_PBLC"] != "전문의약품", not re.search(r"(정|캡슐)", p["ITEM_NAME"]), p.get("ITEM_PERMIT_DATE") or "9"))
        drugs[gid] = {"id": gid, "ko": ko_name(ps[0]["ITEM_NAME"]), "brand": brand_core(ps[0]["ITEM_NAME"]), "seq": ps[0]["ITEM_SEQ"], "tier": 2}
    print("성분", len(drugs))

    # 제품명 → 성분 색인 (복합제 포함)
    allrx = dict(core_rx)
    for gid, d in drugs.items():
        if d["tier"] == 2: allrx[gid] = re.compile(r"(?<![a-z])" + re.escape(gid) + r"(?![a-z])")
    products = {}
    for p in prods:
        s = base_name(p.get("ITEM_INGR_NAME") or "") + " " + (p.get("ITEM_INGR_NAME") or "").lower()
        hit = [gid for gid, rx in allrx.items() if rx.search(s)]
        if "amoxicillin/clavulanate" in hit and "amoxicillin" in hit: hit.remove("amoxicillin")
        if not hit: continue
        bc = brand_core(p["ITEM_NAME"])
        if len(bc) >= 2: products.setdefault(bc, set()).update(hit)

    # 첨부문서 받기와 추출
    os.makedirs(os.path.join(a.out, "d"), exist_ok=True)
    index = []
    for i, (gid, d) in enumerate(drugs.items()):
        if a.offline and not os.path.exists(os.path.join(a.cache, "detail", f"{d['seq']}.json")):
            continue
        try:
            raw = fetch_detail(d["seq"], key, a.cache)
        except Exception as e:
            print("건너뜀", gid, e); continue
        nb, ud = raw.get("NB_DOC_DATA") or "", raw.get("UD_DOC_DATA") or ""
        rec = {"product": raw["ITEM_NAME"], "date": raw.get("CHANGE_DATE"), "seq": raw["ITEM_SEQ"],
               "adr": extract_adr(nb), "organ": extract_organ(nb, ud), "txt": adr_paragraphs(nb)}
        f = slug(gid)
        json.dump(rec, open(os.path.join(a.out, "d", f + ".json"), "w"), ensure_ascii=False, separators=(",", ":"))
        index.append({"id": gid, "f": f, "ko": d["ko"], "en": gid, "brand": d["brand"], "seq": raw["ITEM_SEQ"], "tier": d["tier"],
                      "p": sorted(rec["adr"].keys())})
        if i % 100 == 0: print("추출", i, "/", len(drugs), flush=True)
    known = {x["id"] for x in index}
    prod_idx = {k: sorted(v & known) for k, v in products.items() if v & known}
    version = datetime.date.today().isoformat()
    json.dump({"version": version, "drugs": index, "problems": [{"id": p, "category": c, "name": n} for p, c, n, _ in PROBLEMS],
               "products": prod_idx}, open(os.path.join(a.out, "index.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"version": version, "drugs": len(index), "products": len(prod_idx)}, open(os.path.join(a.out, "version.json"), "w"))
    print("완료", version, "성분", len(index), "제품명", len(prod_idx))

if __name__ == "__main__":
    main()
