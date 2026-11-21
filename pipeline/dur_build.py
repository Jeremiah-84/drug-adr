"""DUR 원자료(pipeline/dur_raw.json)를 우리 성분 id(docs/data/index.json)에 맞춰 interactions.json 으로 만듭니다.
규칙만 씁니다(AI 없음): 영문 성분명에서 염 이름을 떼고 우리 성분 id와 낱말 단위로 맞춰 보고, 안 맞으면 한글 성분명으로 맞춥니다."""
import collections, datetime, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def g(row, *keys):
    for k in keys:
        v = row.get(k)
        if v not in (None, ""): return str(v).strip()
    return ""

def _base(n):
    from run import base_name  # 같은 염 이름 규칙 사용
    return base_name(n or "")

KSALT = re.compile(r"(헤미말산염|베실산염|캄실산염|말레산염|메실산염|염산염|브롬화수소산염|황산염|타르타르산염|푸마르산염|숙신산염|시트르산염|아세트산염|인산염|나트륨|칼륨|칼슘|마그네슘|수화물|일수화물|이수화물|삼수화물|무수물|메독소밀|실렉세틸|토실산염|질산염)+$")
def _kbase(n):
    n = re.sub(r"\(.*?\)|\[.*?\]|\s", "", n or "")
    return KSALT.sub("", n)

class Matcher:
    def __init__(self, drugs):
        self.rx = []
        for d in drugs:
            i = d["id"]
            # 낱말 단위로: "amlodipine"이 "s-amlodipine" 안에서 잡히지 않게 '-'도 경계로 봄
            self.rx.append((i, re.compile(r"(?<![a-z\-])" + re.escape(i) + r"(?![a-z\-])")))
        self.rx.sort(key=lambda x: -len(x[0]))
        self.ko = collections.defaultdict(set)
        for d in drugs:
            if d.get("ko") and re.search(r"[가-힣]", d["ko"]): self.ko[_kbase(d["ko"])].add(d["id"])
        self.cache = {}

    def ids(self, eng, kor):
        k = (eng, kor)
        if k in self.cache: return self.cache[k]
        b = _base(eng)
        hit = []
        if b:
            s = b
            for i, rx in self.rx:  # 긴 이름부터 맞추고, 맞은 부분은 지워서 짧은 이름이 또 잡히지 않게
                if rx.search(s):
                    hit.append(i); s = rx.sub(" ", s)
        if not hit and len(b) >= 5:  # 우리 id에 염 이름이 남은 경우 (예: "ketorolac tromethamine")
            hit = [i for i, _ in self.rx if i.startswith(b + " ")][:1]
        if not hit and kor:
            hit = sorted(self.ko.get(_kbase(kor), ()))
        self.cache[k] = hit
        return hit

def build(raw, out):
    raw = {k: [x.get("item", x) if isinstance(x, dict) and set(x) == {"item"} else x for x in v] for k, v in raw.items()}
    index = json.load(open(os.path.join(out, "index.json")))
    m = Matcher(index["drugs"])
    reasons, ridx = [], {}
    def rid(t):
        t = re.sub(r"\s+", " ", t or "").strip()
        if t not in ridx: ridx[t] = len(reasons); reasons.append(t)
        return ridx[t]
    pairs = {}
    miss = collections.Counter()
    for r in raw.get("taboo", []):
        if g(r, "DEL_YN") in ("Y", "삭제", "삭제예정"): continue
        a = m.ids(g(r, "INGR_ENG_NAME"), g(r, "INGR_KOR_NAME", "INGR_NAME"))
        b = m.ids(g(r, "MIXTURE_INGR_ENG_NAME"), g(r, "MIXTURE_INGR_KOR_NAME", "MIXTURE_INGR_NAME"))
        if not a: miss[g(r, "INGR_ENG_NAME") or g(r, "INGR_KOR_NAME")] += 1
        if not b: miss[g(r, "MIXTURE_INGR_ENG_NAME") or g(r, "MIXTURE_INGR_KOR_NAME")] += 1
        why = rid(g(r, "PROHBT_CONTENT"))
        date = g(r, "NOTIFICATION_DATE")
        for x in a:
            for y in b:
                if x == y: continue
                key = tuple(sorted((x, y)))
                cur = pairs.setdefault(key, {"r": set(), "d": ""})
                cur["r"].add(why); cur["d"] = max(cur["d"], date)
    taboo = [[x, y, sorted(v["r"]), v["d"]] for (x, y), v in sorted(pairs.items())]

    groups = collections.defaultdict(set)
    for r in raw.get("efcy", []):
        if g(r, "DEL_YN") in ("Y", "삭제", "삭제예정"): continue
        # 같은 효능군 안의 같은 계열(예: 혈압강하제 중 ARB끼리)만 중복으로 봄. 계열이 비어 있는 행(주로 복합제)은 성분별 행이 따로 있어 건너뜀
        eff, sers = g(r, "EFFECT_CODE", "EFFECT_NAME"), g(r, "SERS_NAME")
        if not eff or not sers: continue
        name = eff + " · " + sers
        for i in m.ids(g(r, "INGR_ENG_NAME"), g(r, "INGR_KOR_NAME", "INGR_NAME")):
            groups[name].add(i)
    efcy = [{"name": n, "ids": sorted(v)} for n, v in sorted(groups.items()) if len(v) > 0]

    res = {"version": datetime.date.today().isoformat(),
           "src": "식품의약품안전처 의약품안전사용서비스(DUR) 성분정보 (공공데이터포털)",
           "reasons": reasons, "taboo": taboo, "efcy": efcy}
    json.dump(res, open(os.path.join(out, "interactions.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print("병용금기 쌍", len(taboo), "· 효능군", len(efcy), "· 못 맞춘 이름", len(miss))
    for n, c in miss.most_common(15): print("  못 맞춤:", n, c)
    return res
