"""첨부문서(XML)에서 이상반응과 신·간기능 정보를 규칙으로 추출합니다. AI를 쓰지 않습니다."""
import re, html
from problems import PROBLEMS

FREQ = [
 (r"매우\s*(흔하게|자주|흔함)", 5, "매우 흔하게 (≥10%)"),
 (r"흔하지\s*않[게음]", 3, "흔하지 않게 (0.1~1%)"),
 (r"매우\s*드[물묾][게]?", 1, "매우 드물게 (<0.01%)"),
 (r"(?<!매우\s)(?<!매우)흔하게|(?<!매우\s)(?<!매우)자주|(?<!매우\s)(?<!매우)흔함", 4, "흔하게 (1~10%)"),
 (r"때때로", 3, "때때로 (0.1~1%)"),
 (r"(?<!매우\s)(?<!매우)드물게|(?<!매우\s)(?<!매우)드묾", 2, "드물게 (0.01~0.1%)"),
 (r"빈도\s*불명|시판\s*후|자발\s*보고", 0, "빈도 불명 (시판 후 보고)"),
]
LEVELS = {4: "높음", 3: "가능성 있음", 2: "낮음", 1: "매우 드묾"}
ADR_TITLE = r"이상\s*(반응|사례)|부작용|중지|중단"
COMPILED = [(pid, cat, name, [re.compile(s) for s in syns]) for pid, cat, name, syns in PROBLEMS]

def section_text(nb):
    """이상반응·경고 항목을 문단 단위 (kind, text) 목록으로. 경고 항목 앞에는 ('warnhdr','')."""
    arts = re.findall(r'<ARTICLE title="([^"]*)">(.*?)</ARTICLE>', nb or "", re.S)
    arts = sorted(arts, key=lambda a: 1 if re.search(r"경고", a[0]) else 0)
    out = []
    for title, body in arts:
        if re.search(r"경고", title) and not re.search(r"이상\s*(반응|사례)|부작용", title):
            out.append(("warnhdr", ""))
        elif not re.search(ADR_TITLE, title):
            continue
        for tag, cdata in re.findall(r'<PARAGRAPH tagName="(\w+)"[^>]*><!\[CDATA\[(.*?)\]\]></PARAGRAPH>', body, re.S):
            if tag == "table":
                for row in re.findall(r"<tr[^>]*>(.*?)</tr>", cdata, re.S):
                    cells = [re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", c))).strip()
                             for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
                    out.append(("row", " | ".join(cells)))
            else:
                out.append(("p", re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", cdata))).strip()))
    return out

def _freq_before(text, pos, default):
    best = None
    for rx, score, label in FREQ:
        for m in re.finditer(rx, text[:pos]):
            if best is None or m.start() > best[0]:
                best = (m.start(), score, label)
    if best:
        return best[1], best[2]
    tail = re.split(r"[.]\s", text[pos:pos + 120])[0]
    for rx, score, label in FREQ:
        if re.search(rx, tail):
            return score, label
    return default

def _pct_near(text, pos, kind):
    if kind == "row":
        m = re.search(r"\(\s*(\d+(?:\.\d+)?)\s*%?\s*\)|(\d+(?:\.\d+)?)\s*%", text[pos:])
    else:
        m = re.match(r"[^,;.]{0,25}?\(?\s*(?:이 약\s*)?(\d+(?:\.\d+)?)\s*%", text[pos:])
    if not m:
        return None
    if re.match(r"\s*(이상|이하|초과|미만)", text[pos + m.end():pos + m.end() + 4]):
        return None
    v = float(next(g for g in m.groups() if g))
    return v if v <= 100 else None

def level_of(sc, pct):
    if pct is not None and sc is None:
        sc = 5 if pct >= 10 else 4 if pct >= 1 else 3 if pct >= 0.1 else 2
    if sc is None or sc == 0:
        return 3
    return {5: 4, 4: 4, 3: 3, 2: 2, 1: 1}[sc]

def extract_adr(nb):
    """{problem_id: [level, 첨부문서 빈도 표현, 근거 문장]} (부정문 의심은 제외)"""
    found = {}
    default = (None, "빈도 표기 없음")
    warn = False
    for kind, t in section_text(nb):
        if kind == "warnhdr":
            warn = True; default = (0, "경고 항목에 기재 (빈도 불명)"); continue
        if kind == "p" and len(t) < 250 and re.search(r"가장\s*흔(하게|한)|흔하게\s*(나타난|보고된)|흔한\s*이상(반응|사례)", t) and not re.search(r"시판\s*후", t):
            default = (4, "흔하게 (임상시험 주요 이상반응)")
        elif kind == "p" and len(t) < 200 and re.search(r"시판\s*후|자발\s*보고|빈도\s*불명", t):
            default = (0, "빈도 불명 (시판 후 보고)")
        elif kind == "p" and len(t) < 300 and re.search(r"임상\s*시험", t):
            default = (None, "빈도 표기 없음")
        for pid, cat, name, rxs in COMPILED:
            for rx in rxs:
                m = None
                for mm in rx.finditer(t):
                    if re.match(r"([가-힣\s]{0,4}|\s*(또는|및|이나|,)[가-힣\s]{0,12})(환자|자는|자에|자의|자\b)", t[mm.end():mm.end() + 24]):
                        continue
                    w = t[max(0, mm.start() - 50):mm.start()]
                    if re.search(r"(주사|투여|적용|접종)\s*부위[^.)]{0,40}$", w) and not re.search(r"전신[^.]{0,15}(투여|적용)\s*부위", w):
                        continue  # 주사 부위 멍·발진 같은 국소 반응은 전신 문제로 세지 않음
                    m = mm; break
                if not m:
                    continue
                sc, lab = _freq_before(t, m.start(), default if kind == "p" else (None, "임상시험 표"))
                pct = _pct_near(t, m.end(), kind)
                if pct is not None and sc is None:
                    sc = 5 if pct >= 10 else 4 if pct >= 1 else 3 if pct >= 0.1 else 2
                    lab = f"임상시험 {pct}%"
                s = max(0, m.start() - 60)
                ev = ("…" if s else "") + t[s:m.end() + 80] + ("…" if m.end() + 80 < len(t) else "")
                neg = bool(re.search(r"(않았|않는|없었|없다|관찰되지)", t[m.start():m.start() + 60]))
                cur = found.get(pid)
                if warn and cur is not None:
                    break
                if cur is None or (cur[3] and not neg) or (neg == cur[3] and (sc if sc is not None else -1) > (cur[0] if cur[0] is not None else -1)):
                    found[pid] = (sc, lab, pct, neg, ev)
                break
    return {pid: [level_of(sc, pct), lab, ev.replace(" | ", " · ")[:200]] for pid, (sc, lab, pct, neg, ev) in found.items() if not neg}

def adr_paragraphs(nb):
    return [t for k, t in section_text(nb) if t and k != "warnhdr"]

# ---- 신기능·간기능 ----
def _clean(c):
    t = re.sub(r"<[^>]+>", " ", c); t = html.unescape(html.unescape(t)); t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", t).strip()
def _paras(doc):
    out = []
    for title, body in re.findall(r'<ARTICLE title="([^"]*)">(.*?)</ARTICLE>', doc or "", re.S):
        title = _clean(title)
        for tag, c in re.findall(r'<PARAGRAPH tagName="(\w+)"[^>]*><!\[CDATA\[(.*?)\]\]></PARAGRAPH>', body, re.S):
            out.append((title, _clean(c)))
    return out
ORG = {"renal": r"(?<![정전])(?<![정전]\s)신\s?장애|신기능|신부전|신\s?손상|크레아티닌\s*청소율|eGFR|CrCl|Ccr|사구체\s*여과율|투석|신장\s*(기능|질환)",
       "hepatic": r"간\s?장애|간기능\s*(장애|저하|부전|이상)|간부전|간경변|Child[- ]?Pugh|간\s*질환|간질환"}
ADJ = r"감량|용량\s*(을\s*)?(조절|조정|감소|줄)|감소시|투여\s*간격|최대\s*\d|\d+\s*m[gL].{0,20}(투여|으로)|권장되지|1일\s*\d|저용량"
ORDER = ["금기", "용량 조절", "주의", "조절 불필요"]
def _sents(t):
    return [s.strip() for s in re.split(r"(?<=[.다])\s+", t) if s.strip()]

def extract_organ(nb, ud):
    res = {}
    for org, rx in ORG.items():
        tags, ev = [], []
        def add(tag, s):
            if tag not in tags: tags.append(tag)
            if s[:220] not in [e[1] for e in ev]: ev.append((tag, s[:220]))
        for title, t in _paras(nb):
            contra = re.search(r"투여하지\s*말", title); caut = re.search(r"신중히", title)
            if not (contra or caut): continue
            for s in _sents(t):
                if re.search(rx, s) and not re.search(r"고령자\s*$", s):
                    add("금기" if contra else "주의", s)
        for title, t in _paras(ud):
            for s in _sents(t):
                if re.search(rx, s) or (re.search(rx, title) and len(s) > 8):
                    if re.search(r"필요(치|하지)\s*않|필요\s*없|조절할\s*필요는?\s*없", s): add("조절 불필요", s)
                    elif re.search(r"금기|투여하지\s*말", s): add("금기", s)
                    elif re.search(ADJ, s) or re.search(rx, title): add("용량 조절", s if re.search(rx, s) else f"[{title}] {s}")
                    else: add("주의", s)
        if "조절 불필요" in tags and "용량 조절" in tags: tags.remove("조절 불필요")
        tags = sorted(tags, key=ORDER.index)
        ev = sorted(ev, key=lambda e: ORDER.index(e[0]))[:3]
        res[org] = {"t": tags, "e": [[a, b[:200]] for a, b in ev]}
    return res
