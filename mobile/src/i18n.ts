import { EXTRA } from './i18n_extra';
import { DIARY } from './i18n_diary';
import { CLASSICAL } from './i18n_classical';
import { XWORD } from './i18n_xword';
// Translations ported 1:1 from the Claude Design prototype. Korean is the source language;
// D maps each Korean string to [en, zh, ja].

export type Lang = 'ko' | 'en' | 'zh' | 'ja';
export const LANGS: Lang[] = ['ko', 'en', 'zh', 'ja'];
export const UI = {
 date: ["11월 18일 수요일", "Wednesday, November 18", "11月18日 星期三", "11月18日（水）"],
 greet: ["좋은 아침이에요,", "Good morning,", "早上好，", "おはようございます、"],
 nim: [" 님", "", "", " さん"],
 done: ["복용 완료", "Mark as taken", "已服用", "服用完了"],
 allDone: ["오늘 복용을 모두 마쳤어요", "All doses taken today", "今天的药已全部服用", "今日の服薬はすべて完了しました"],
 undo: ["기록 되돌리기", "Undo", "撤销记录", "記録を取り消す"],
 today: ["오늘의 복약", "Today's doses", "今日服药", "今日の服薬"],
 times: ["회", " doses", "次", "回"],
 notebook: ["건강 수첩", "Health notebook", "健康手册", "健康手帳"],
 bp: ["혈압", "Blood pressure", "血压", "血圧"],
 glu: ["혈당", "Glucose", "血糖", "血糖"],
 recentScan: ["최근 스캔 · 오늘 08:12", "Last scan · Today 08:12", "最近扫描 · 今天 08:12", "最近のスキャン · 今日 08:12"],
 rxTitle: ["서울내과의원 처방전", "Seoul Internal Medicine prescription", "首尔内科医院处方", "ソウル内科医院の処方箋"],
 rxSub: ["4개 약 · 주의할 이상반응 3건", "4 drugs · 3 side effects to watch", "4种药 · 3项需注意的不良反应", "4種類の薬 · 注意すべき副作用 3件"],
 disclaimer: ["식품의약품안전처 의약품 허가정보(첨부문서) 기준 · 진단이나 처방 변경은 의사·약사와 상의하세요.", "Based on MFDS drug approval information (package inserts). Talk to your doctor or pharmacist before changing any treatment.", "依据韩国食品药品安全处药品许可信息（说明书）。诊断或更改处方请咨询医生或药师。", "韓国食品医薬品安全処の医薬品許可情報（添付文書）に基づきます。診断や処方の変更は医師・薬剤師にご相談ください。"],
 back: ["뒤로", "Back", "返回", "戻る"],
 found: ["4개의 약을 찾았어요", "Found 4 medicines", "找到了4种药", "4種類の薬が見つかりました"],
 foundSub: ["서울내과의원 · 2026.11.18 · 처방전 글자 인식", "Seoul Internal Medicine · 2026.11.18 · Prescription text", "首尔内科医院 · 2026.11.18 · 处方文字识别", "ソウル内科医院 · 2026.11.18 · 処方箋の文字認識"],
 addSched: ["복약 일정에 추가", "Add to schedule", "加入服药计划", "スケジュールに追加"],
 bySym: ["증상으로 확인", "Check by symptom", "按症状查看", "症状から確認"],
 evidence: ["첨부문서 근거", "From the package insert", "说明书依据", "添付文書の根拠"],
 source: ["식약처 원문 보기 ↗", "View MFDS original ↗", "查看原文 ↗", "原文を見る ↗"],
 compare: ["새로 생긴 증상과 비교하기", "Compare with new symptoms", "与新出现的症状对比", "新しい症状と比較する"],
 organNote: ["첨부문서 용법용량과 금기·신중투여 항목에서 찾은 내용입니다.", "Taken from the dosage, contraindication and precaution sections of the package insert.", "摘自说明书的用法用量及禁忌、慎用项目。", "添付文書の用法・用量および禁忌・慎重投与の項目から抽出した内容です。"],
 symQ: ["새로 생긴 증상이 있나요?", "Any new symptoms?", "有新出现的症状吗？", "新しい症状はありますか？"],
 symSub: ["복용 중인 약 중 원인일 수 있는 약을 찾아드려요.", "We'll find which of your medicines could be the cause.", "帮您找出可能导致症状的药物。", "服用中の薬から原因となりうる薬を探します。"],
 symEmpty: ["위에서 증상을 하나 이상 골라주세요", "Pick at least one symptom above", "请在上方选择至少一个症状", "上から症状を1つ以上選んでください"],
 sched: ["복약 일정", "Dose schedule", "服药计划", "服薬スケジュール"],
 schedNote: ["알림을 켜면 이 앱이 열려 있거나 백그라운드에 있을 때 복용 시간에 휴대폰 알림을 보내드려요. 앱을 완전히 닫으면 울리지 않아요.", "With reminders on, you get a phone notification at each dose time while this app is open or in the background. It cannot ring once the app is fully closed.", "开启提醒后，本应用打开或在后台时会在服药时间发送手机通知。完全关闭应用后不会提醒。", "通知をオンにすると、アプリが開いているかバックグラウンドにある間、服用時間にスマホ通知を送ります。アプリを完全に閉じると鳴りません。"],
 records: ["기록", "Records", "记录", "記録"],
 weekRate: ["이번 주 복약률", "Adherence this week", "本周服药率", "今週の服薬率"],
 reportLink: ["건강 리포트 ›", "Health report ›", "健康报告 ›", "健康レポート ›"],
 scanRec: ["스캔 기록", "Scan history", "扫描记录", "スキャン履歴"],
 reportTitle: ["11월 건강 리포트", "November health report", "11月健康报告", "11月の健康レポート"],
 monthRate: ["이번 달 복약률", "Adherence this month", "本月服药率", "今月の服薬率"],
 symLog: ["기록한 증상", "Logged symptoms", "记录的症状", "記録した症状"],
 pdf: ["진료 때 보여줄 PDF 만들기", "Create a PDF for your doctor", "生成就诊用PDF", "診察用PDFを作成"],
 chatTitle: ["AI 복약 상담", "AI medication chat", "AI用药咨询", "AI服薬相談"],
 family: ["가족 · 보호자", "Family · Caregivers", "家人 · 监护人", "家族 · 介護者"],
 manage: ["관리", "Manage", "管理", "管理"],
 dataNote: ["데이터 2026.11.02 갱신 · 사진과 처방 내용은 이 기기 안에서만 처리합니다.", "Data updated 2026.11.02 · Photos and prescriptions are processed only on this device.", "数据更新于2026.11.02 · 照片和处方仅在本设备上处理。", "データ更新 2026.11.02 · 写真と処方内容はこの端末内でのみ処理します。"],
 familyTitle: ["가족 · 보호자 관리", "Family & caregivers", "家人 · 监护人管理", "家族・介護者の管理"],
 missAlert: ["복용 누락 시 나에게 알림", "Notify me if a dose is missed", "漏服时通知我", "飲み忘れたら私に通知"],
 invite: ["초대 링크로 가족 추가", "Add family by invite link", "通过邀请链接添加家人", "招待リンクで家族を追加"],
 vitalsTitle: ["혈압 · 당뇨 수첩", "BP & diabetes notebook", "血压 · 血糖手册", "血圧・血糖手帳"],
 recent: ["최근 기록", "Latest", "最近记录", "最新の記録"],
 criteria: ["판정 기준: 대한고혈압학회·대한당뇨병학회 진료지침의 일반 성인 기준. 목표 수치는 담당 의사와 상의하세요.", "Ranges follow general adult guidelines from the Korean hypertension and diabetes societies. Ask your doctor about your own targets.", "判定标准参照韩国高血压学会·糖尿病学会诊疗指南中的一般成人标准。目标值请咨询主治医生。", "判定基準：大韓高血圧学会・大韓糖尿病学会の診療ガイドラインにおける一般成人の基準。目標値は主治医にご相談ください。"],
 nearby: ["가까운 약국 · 병원", "Nearby pharmacies & clinics", "附近的药店 · 医院", "近くの薬局・病院"],
 askPh: ["약에 대해 물어보세요", "Ask about your medicines", "询问关于药物的问题", "お薬について質問する"],
 save: ["저장", "Save", "保存", "保存"],
 editHint: ["시간을 누르면 바꿀 수 있어요", "Tap a time to change it", "点击时间即可修改", "時間をタップすると変更できます"],
 timeTitle: ["복용 시간 변경", "Change dose time", "修改服药时间", "服用時間を変更"],
 hour: ["시", "Hour", "时", "時"], minute: ["분", "Minute", "分", "分"],
 langLabel: ["언어 · Language", "Language", "语言 · Language", "言語 · Language"]
};
const D: Record<string, [string, string, string]> = {
 "높음": ["High", "高", "高"], "가능성 있음": ["Possible", "可能", "可能性あり"], "낮음": ["Low", "低", "低"], "매우 드묾": ["Very rare", "非常罕见", "非常にまれ"],
 "1% 이상": ["≥1%", "≥1%", "1%以上"], "때때로·빈도 미기재": ["Sometimes / not stated", "偶尔·未注明频率", "時々・頻度記載なし"], "드물게": ["Uncommon", "少见", "まれ"], "매우 드물게": ["Very rarely", "极少", "非常にまれ"],
 "금기": ["Contraindicated", "禁忌", "禁忌"], "용량": ["Adjust dose", "调整剂量", "用量調整"], "주의": ["Caution", "注意", "注意"], "불필요": ["No change", "无需调整", "調整不要"], "정상": ["Normal", "正常", "正常"],
 "아모잘탄정 5/50mg": ["Amosartan 5/50mg tablet", "Amosartan 5/50mg 片", "アモザルタン錠 5/50mg"], "아모잘탄": ["Amosartan", "Amosartan", "アモザルタン"], "암로디핀·로살탄": ["Amlodipine · Losartan", "氨氯地平·氯沙坦", "アムロジピン・ロサルタン"],
 "고혈압": ["Hypertension", "高血压", "高血圧"], "1일 1회 아침": ["Once daily, morning", "每日1次 早上", "1日1回 朝"], "1정": ["1 tablet", "1片", "1錠"],
 "말초부종(발목 부음)": ["Peripheral edema (ankle swelling)", "外周水肿（脚踝肿胀）", "末梢浮腫（足首のむくみ）"], "어지러움": ["Dizziness", "头晕", "めまい"], "빈도 미기재": ["Not stated", "未注明频率", "頻度記載なし"],
 "두통": ["Headache", "头痛", "頭痛"], "고칼륨혈증": ["Hyperkalemia", "高钾血症", "高カリウム血症"], "혈관부종": ["Angioedema", "血管性水肿", "血管浮腫"], "0.01% 미만": ["<0.01%", "<0.01%", "0.01%未満"],
 "중증 신장애 환자는 신중투여. 칼륨과 크레아티닌 수치를 정기적으로 확인합니다.": ["Use with care in severe renal impairment. Check potassium and creatinine regularly.", "重度肾功能损害患者慎用。定期检查血钾和肌酐。", "重度の腎障害患者には慎重投与。カリウムとクレアチニン値を定期的に確認します。"],
 "간장애 환자는 혈중농도가 높아질 수 있어 저용량부터 시작합니다.": ["Blood levels can rise in hepatic impairment, so start at a low dose.", "肝功能损害患者血药浓度可能升高，应从低剂量开始。", "肝障害患者では血中濃度が上がることがあるため、低用量から開始します。"],
 "복용": ["Dosing", "服用", "服用"], "1일 1회 1정, 매일 같은 시간": ["1 tablet once daily, same time each day", "每日1次，每次1片，每天同一时间", "1日1回1錠、毎日同じ時間に"], "식사": ["Food", "饮食", "食事"],
 "식사와 관계없이 복용 가능": ["Can be taken with or without food", "饭前饭后均可服用", "食事に関係なく服用可能"], "잊었을 때": ["If missed", "漏服时", "飲み忘れたとき"],
 "생각난 즉시 복용, 다음 복용이 가까우면 건너뛰기": ["Take it as soon as you remember; skip it if the next dose is near.", "想起时立即服用；如接近下次服药时间则跳过。", "気づいたらすぐ服用。次の服用が近ければ飛ばします。"],
 "보관": ["Storage", "保存", "保管"], "실온, 습기를 피해 보관": ["Room temperature, away from moisture", "室温保存，避免潮湿", "室温で湿気を避けて保管"],
 "말초부종은 암로디핀 투여 시 용량 의존적으로 나타나는 가장 흔한 이상반응이다.": ["Peripheral edema is the most common adverse reaction to amlodipine and is dose-dependent.", "外周水肿是氨氯地平最常见的不良反应，呈剂量依赖性。", "末梢浮腫はアムロジピン投与時に用量依存的に現れる最も一般的な副作用である。"],
 "리리카캡슐 75mg": ["Lyrica 75mg capsule", "Lyrica 75mg 胶囊", "リリカカプセル 75mg"], "리리카": ["Lyrica", "Lyrica", "リリカ"], "프레가발린": ["Pregabalin", "普瑞巴林", "プレガバリン"],
 "신경병증 통증": ["Neuropathic pain", "神经病理性疼痛", "神経障害性疼痛"], "1일 2회": ["Twice daily", "每日2次", "1日2回"], "1캡슐": ["1 capsule", "1粒", "1カプセル"],
 "졸림": ["Drowsiness", "嗜睡", "眠気"], "말초부종": ["Peripheral edema", "外周水肿", "末梢浮腫"], "체중 증가": ["Weight gain", "体重增加", "体重増加"], "시야 흐림": ["Blurred vision", "视物模糊", "かすみ目"],
 "크레아티닌 청소율 60mL/min 미만이면 감량. 30 미만은 1일 1~2회로 줄입니다.": ["Reduce the dose if creatinine clearance is below 60 mL/min. Below 30, reduce to once or twice daily.", "肌酐清除率低于60 mL/min时减量；低于30时减为每日1～2次。", "クレアチニンクリアランス60 mL/min未満で減量。30未満では1日1〜2回に減らします。"],
 "간에서 거의 대사되지 않아 용량 조절이 필요하지 않습니다.": ["Barely metabolized by the liver, so no dose change is needed.", "几乎不经肝脏代谢，无需调整剂量。", "肝臓でほとんど代謝されないため用量調整は不要です。"],
 "1일 2회, 아침·저녁": ["Twice daily, morning and evening", "每日2次，早晚各一次", "1日2回、朝・夕"], "운전·기계 조작 주의, 갑자기 끊지 않기": ["Be careful driving or using machinery; don't stop suddenly.", "驾驶及操作机械时注意，不可突然停药。", "運転・機械操作に注意、急に中止しない"],
 "실온 보관": ["Room temperature", "室温保存", "室温保管"],
 "어지러움 및 졸음이 흔하게 나타나며, 자동차 운전 등 위험을 수반하는 기계 조작에 주의하도록 한다.": ["Dizziness and somnolence are common; patients should be cautious when driving or operating hazardous machinery.", "常见头晕和嗜睡，驾驶汽车等危险机械操作时应注意。", "めまい及び傾眠がよくみられるため、自動車の運転など危険を伴う機械の操作に注意させること。"],
 "다이아벡스정 500mg": ["Diabex 500mg tablet", "Diabex 500mg 片", "ダイアベックス錠 500mg"], "다이아벡스": ["Diabex", "Diabex", "ダイアベックス"], "메트포르민": ["Metformin", "二甲双胍", "メトホルミン"],
 "당뇨": ["Diabetes", "糖尿病", "糖尿病"], "1일 2회 식후": ["Twice daily after meals", "每日2次 饭后", "1日2回 食後"], "설사·구역": ["Diarrhea · Nausea", "腹泻·恶心", "下痢・吐き気"],
 "복부 불편감": ["Abdominal discomfort", "腹部不适", "腹部不快感"], "금속성 맛": ["Metallic taste", "金属味", "金属味"], "비타민 B12 감소": ["Low vitamin B12", "维生素B12减少", "ビタミンB12低下"],
 "장기 복용": ["Long-term use", "长期服用", "長期服用"], "젖산산증": ["Lactic acidosis", "乳酸酸中毒", "乳酸アシドーシス"],
 "eGFR 30 미만은 투여 금기. 30~45는 새로 시작하지 않고 용량을 줄입니다.": ["Contraindicated if eGFR is below 30. At 30–45, don't start it and reduce the dose.", "eGFR低于30时禁用；30～45时不宜新开始用药并应减量。", "eGFR 30未満は投与禁忌。30〜45では新規に開始せず減量します。"],
 "간기능 장애는 젖산산증 위험을 높일 수 있어 신중히 투여합니다.": ["Hepatic impairment can raise the risk of lactic acidosis, so use with care.", "肝功能障碍可能增加乳酸酸中毒风险，应慎用。", "肝機能障害は乳酸アシドーシスのリスクを高めるため慎重に投与します。"],
 "1일 2회, 아침·저녁 식후": ["Twice daily, after breakfast and dinner", "每日2次，早晚饭后", "1日2回、朝・夕食後"], "식사 직후 복용하면 위장 증상이 줄어요": ["Taking it right after a meal reduces stomach upset", "饭后立即服用可减轻胃肠道症状", "食直後に服用すると胃腸症状が減ります"],
 "조영제 검사 전후 일시 중단": ["Pause before and after contrast imaging", "造影检查前后暂停服用", "造影剤検査の前後は一時中止"],
 "설사, 구역, 구토, 복통 등 위장관계 증상이 투여 초기에 흔히 나타나며 대부분 자연 소실된다.": ["Gastrointestinal symptoms such as diarrhea, nausea, vomiting and abdominal pain are common early in treatment and usually resolve on their own.", "腹泻、恶心、呕吐、腹痛等胃肠道症状在用药初期常见，大多可自行消失。", "下痢、悪心、嘔吐、腹痛などの消化器症状は投与初期によくみられ、多くは自然に消失する。"],
 "크레스토정 10mg": ["Crestor 10mg tablet", "Crestor 10mg 片", "クレストール錠 10mg"], "크레스토": ["Crestor", "Crestor", "クレストール"], "로수바스타틴": ["Rosuvastatin", "瑞舒伐他汀", "ロスバスタチン"],
 "고지혈증": ["High cholesterol", "高脂血症", "脂質異常症"], "1일 1회 취침 전": ["Once daily at bedtime", "每日1次 睡前", "1日1回 就寝前"], "근육통": ["Muscle pain", "肌肉痛", "筋肉痛"],
 "간수치(ALT) 상승": ["Raised liver enzymes (ALT)", "肝酶（ALT）升高", "肝酵素（ALT）上昇"], "횡문근융해증": ["Rhabdomyolysis", "横纹肌溶解症", "横紋筋融解症"],
 "중증 신장애(CrCl 30 미만)는 1일 5mg부터 시작하며 40mg은 금기입니다.": ["In severe renal impairment (CrCl below 30), start at 5 mg daily; 40 mg is contraindicated.", "重度肾功能损害（CrCl低于30）从每日5 mg开始，禁用40 mg。", "重度腎障害（CrCl 30未満）は1日5 mgから開始し、40 mgは禁忌です。"],
 "활동성 간질환 또는 원인 불명의 지속적 간수치 상승 시 투여 금기.": ["Contraindicated in active liver disease or unexplained persistent rises in liver enzymes.", "活动性肝病或不明原因的持续肝酶升高时禁用。", "活動性肝疾患または原因不明の持続的な肝酵素上昇がある場合は投与禁忌。"],
 "1일 1회, 매일 같은 시간": ["Once daily, same time each day", "每日1次，每天同一时间", "1日1回、毎日同じ時間に"], "설명되지 않는 근육통 시 바로 상담": ["Get advice right away for unexplained muscle pain", "出现原因不明的肌肉痛时立即咨询", "原因不明の筋肉痛があればすぐ相談"],
 "원인을 알 수 없는 근육통, 근육 압통 또는 근무력이 나타나면 즉시 의사에게 알리도록 한다.": ["Patients should report unexplained muscle pain, tenderness or weakness to their doctor promptly.", "如出现不明原因的肌肉痛、肌肉压痛或无力，应立即告知医生。", "原因不明の筋肉痛、筋肉の圧痛または脱力感が現れた場合は直ちに医師に知らせるよう指導すること。"],
 "아침 식후": ["After breakfast", "早饭后", "朝食後"], "저녁 식후": ["After dinner", "晚饭后", "夕食後"], "취침 전": ["Bedtime", "睡前", "就寝前"],
 "다리 부음": ["Leg swelling", "腿部肿胀", "脚のむくみ"], "간수치 상승": ["Raised liver enzymes", "肝酶升高", "肝酵素上昇"], "eGFR 감소": ["Lower eGFR", "eGFR下降", "eGFR低下"],
 "김지현": ["Jihyun Kim", "金智贤", "キム・ジヒョン"], "이순자": ["Soonja Lee", "李顺子", "イ・スンジャ"], "박준우": ["Junwoo Park", "朴俊宇", "パク・ジュヌ"],
 "김": ["J", "金", "キ"], "이": ["S", "李", "イ"], "준": ["J", "俊", "ジ"], "나": ["Me", "我", "自分"], "어머니": ["Mother", "母亲", "母"], "아들": ["Son", "儿子", "息子"],
 "1978년생 · 복용 중 4개": ["Born 1978 · 4 medicines", "1978年生 · 正在服用4种药", "1978年生まれ · 服用中 4種類"], "1951년생 · 복용 중 6개": ["Born 1951 · 6 medicines", "1951年生 · 正在服用6种药", "1951年生まれ · 服用中 6種類"],
 "2012년생 · 복용 중 1개": ["Born 2012 · 1 medicine", "2012年生 · 正在服用1种药", "2012年生まれ · 服用中 1種類"], "복용 중 4개": ["4 medicines", "正在服用4种药", "服用中 4種類"],
 "복용 중 6개 · 오늘 저녁 누락": ["6 medicines · Missed tonight", "正在服用6种药 · 今晚漏服", "服用中 6種類 · 今夜飲み忘れ"], "복용 중 1개": ["1 medicine", "正在服用1种药", "服用中 1種類"],
 "리리카 먹고 졸려요": ["Lyrica makes me sleepy", "吃了Lyrica后犯困", "リリカを飲むと眠いです"],
 "리리카(프레가발린)는 첨부문서에서 졸림과 어지러움이 1% 이상 흔하게 보고된 약이에요.\n\n복용 초기나 용량을 올린 직후에 특히 흔하니 운전과 기계 조작은 피하세요. 계속되면 처방의와 용량 조정을 상의해 보세요.": ["Lyrica (pregabalin) lists drowsiness and dizziness as common (1% or more) in its package insert.\n\nThey're most common when you first start or right after a dose increase, so avoid driving and operating machinery. If it continues, ask your prescriber about adjusting the dose.", "根据说明书，Lyrica（普瑞巴林）常见（1%以上）嗜睡和头晕。\n\n刚开始服用或刚加量时尤其常见，请避免驾驶和操作机械。如持续存在，请与处方医生商量调整剂量。", "リリカ（プレガバリン）は添付文書で眠気とめまいが1%以上と多く報告されている薬です。\n\n飲み始めや増量直後に特に多いので、運転や機械の操作は避けてください。続く場合は処方医と用量調整をご相談ください。"],
 "술 마셔도 되나요?": ["Can I drink alcohol?", "可以喝酒吗？", "お酒を飲んでもいいですか？"],
 "지금 드시는 약 중 두 가지가 술과 겹쳐요.\n\n· 다이아벡스(메트포르민): 과음 시 젖산산증 위험이 커집니다.\n· 리리카: 졸림과 어지러움이 심해질 수 있어요.\n\n가능하면 피하시는 걸 권해요.": ["Two of your current medicines interact with alcohol.\n\n· Diabex (metformin): heavy drinking raises the risk of lactic acidosis.\n· Lyrica: drowsiness and dizziness can get worse.\n\nIt's best to avoid it if you can.", "您目前服用的药中有两种与酒精相互作用。\n\n· Diabex（二甲双胍）：过量饮酒会增加乳酸酸中毒风险。\n· Lyrica：嗜睡和头晕可能加重。\n\n建议尽量避免饮酒。", "今飲んでいる薬のうち2つがお酒と影響し合います。\n\n· ダイアベックス（メトホルミン）：多量の飲酒で乳酸アシドーシスのリスクが高まります。\n· リリカ：眠気やめまいが強くなることがあります。\n\nできれば控えることをおすすめします。"],
 "다이아벡스 언제 먹어요?": ["When do I take Diabex?", "Diabex什么时候吃？", "ダイアベックスはいつ飲みますか？"],
 "식사 직후 드세요. 식사와 함께 먹으면 설사·구역 같은 위장 증상이 줄어요. 지금 일정은 아침 08:00, 저녁 19:00입니다.": ["Take it right after a meal. Taking it with food reduces stomach upset like diarrhea and nausea. Your schedule is 08:00 in the morning and 19:00 in the evening.", "请在饭后立即服用。随餐服用可减轻腹泻、恶心等胃肠道症状。您目前的计划是早上08:00和晚上19:00。", "食直後に飲んでください。食事と一緒に飲むと下痢や吐き気などの胃腸症状が減ります。現在のスケジュールは朝08:00、夕方19:00です。"],
 "안녕하세요, 김지현 님. 복용 중인 4개 약의 허가정보를 바탕으로 답해드릴게요. 무엇이 궁금하세요?": ["Hello, Jihyun. I'll answer based on the approval information for your 4 medicines. What would you like to know?", "您好，金智贤。我会根据您正在服用的4种药的许可信息来回答。想了解什么呢？", "こんにちは、キム・ジヒョンさん。服用中の4種類の薬の許可情報をもとにお答えします。何が知りたいですか？"],
 "복용 중인 4개 약의 허가정보에서 관련 내용을 찾아봤어요. 해당 내용과 직접 연결되는 기재 사항은 없었습니다. 증상이 계속되면 의사·약사와 상의해 주세요.": ["I searched the approval information for your 4 medicines and found nothing directly related. If symptoms continue, please talk to your doctor or pharmacist.", "我查阅了您4种药的许可信息，没有找到直接相关的记载。如症状持续，请咨询医生或药师。", "服用中の4種類の薬の許可情報を確認しましたが、直接関係する記載はありませんでした。症状が続く場合は医師・薬剤師にご相談ください。"],
 "온누리 정문약국": ["Onnuri Main Gate Pharmacy", "Onnuri正门药店", "オンヌリ正門薬局"], "서울내과의원": ["Seoul Internal Medicine", "首尔内科医院", "ソウル内科医院"], "푸른숲약국": ["Green Forest Pharmacy", "绿林药店", "緑の森薬局"],
 "한강 24시약국": ["Hangang 24h Pharmacy", "汉江24小时药店", "漢江24時薬局"], "22:00까지": ["Until 22:00", "营业至22:00", "22:00まで"], "18:30까지": ["Until 18:30", "营业至18:30", "18:30まで"], "20:00까지": ["Until 20:00", "营业至20:00", "20:00まで"],
 "24시간": ["24 hours", "24小时", "24時間"], "영업 중": ["Open", "营业中", "営業中"], "진료 중": ["Open", "门诊中", "診療中"], "야간": ["Late night", "夜间", "夜間"], "전체": ["All", "全部", "すべて"],
 "성찰하지 않는 삶은 살 가치가 없다.": ["The unexamined life is not worth living.", "未经审视的人生不值得过。", "吟味されない生に、生きる価値はない。"], "소크라테스": ["Socrates", "苏格拉底", "ソクラテス"],
 "오늘 하루를 생의 마지막 날처럼 살되, 서두르지도 게으르지도 말라.": ["Live each day as if it were your last, without haste and without idleness.", "把每一天都当作生命的最后一天来过，既不慌张，也不懈怠。", "毎日を人生最後の日のように生きよ。ただし急がず、怠けずに。"], "마르쿠스 아우렐리우스": ["Marcus Aurelius", "马可·奥勒留", "マルクス・アウレリウス"],
 "우리를 괴롭히는 것은 일 자체가 아니라 그 일에 대한 우리의 생각이다.": ["It is not things that disturb us, but our judgments about them.", "困扰我们的不是事情本身，而是我们对事情的看法。", "人を悩ませるのは物事そのものではなく、物事についての考えである。"], "에픽테토스": ["Epictetus", "爱比克泰德", "エピクテトス"],
 "삶은 짧은 것이 아니라, 우리가 그것을 짧게 만드는 것이다.": ["Life is not short; we make it short.", "生命并不短暂，是我们让它变短了。", "人生は短いのではない。我々が短くしているのだ。"], "세네카": ["Seneca", "塞涅卡", "セネカ"],
 "천 리 길도 한 걸음에서 시작된다.": ["A journey of a thousand miles begins with a single step.", "千里之行，始于足下。", "千里の道も一歩から。"], "노자": ["Laozi", "老子", "老子"],
 "아는 것을 안다 하고 모르는 것을 모른다 하는 것, 그것이 앎이다.": ["To know what you know and to know what you do not know, that is true knowledge.", "知之为知之，不知为不知，是知也。", "知るを知るとなし、知らざるを知らずとなす。これ知るなり。"], "공자": ["Confucius", "孔子", "孔子"],
 "같은 강물에 두 번 발을 담글 수는 없다.": ["No one steps in the same river twice.", "人不能两次踏进同一条河流。", "同じ川に二度入ることはできない。"], "헤라클레이토스": ["Heraclitus", "赫拉克利特", "ヘラクレイトス"],
 "삶은 뒤돌아볼 때 이해되지만, 앞을 향해 살아야 한다.": ["Life can only be understood backwards, but it must be lived forwards.", "人生只能向后理解，却必须向前生活。", "人生は後ろ向きにしか理解できないが、前向きにしか生きられない。"], "키르케고르": ["Kierkegaard", "克尔凯郭尔", "キルケゴール"],
 "살아야 할 이유를 아는 사람은 어떤 상황도 견딜 수 있다.": ["He who has a why to live can bear almost any how.", "知道为什么而活的人，几乎能忍受任何境遇。", "生きる理由を持つ者は、ほとんどどんな状況にも耐えられる。"], "니체": ["Nietzsche", "尼采", "ニーチェ"],
 "행복은 스스로 만족하는 사람의 것이다.": ["Happiness belongs to the self-sufficient.", "幸福属于自足的人。", "幸福は自ら満ち足りる者のものである。"], "아리스토텔레스": ["Aristotle", "亚里士多德", "アリストテレス"],
 "화면을 누르면 건너뜁니다": ["Tap to skip", "轻触屏幕跳过", "タップしてスキップ"], "내약노트": ["My Meds Note", "我的药记", "マイ薬ノート"],
 "공복": ["Fasting", "空腹", "空腹時"], "식후 2시간": ["2h after meal", "餐后2小时", "食後2時間"], "혈압": ["Blood pressure", "血压", "血圧"], "혈당": ["Glucose", "血糖", "血糖"],
 "맥박 {0}": ["Pulse {0}", "脉搏 {0}", "脈拍 {0}"], "맥박 {0} bpm": ["Pulse {0} bpm", "脉搏 {0} bpm", "脈拍 {0} bpm"],
 "혈압 기록하기": ["Log blood pressure", "记录血压", "血圧を記録"], "혈당 기록하기": ["Log glucose", "记录血糖", "血糖を記録"],
 "7일 평균": ["7-day avg", "7日平均", "7日平均"], "최고 수축기": ["Peak systolic", "最高收缩压", "最高収縮期"], "평균 맥박": ["Avg pulse", "平均脉搏", "平均脈拍"],
 "혈압약 아모잘탄(1일 1회 아침)을 복용 중이에요. 약 먹기 전, 아침에 같은 시간에 재면 변화를 비교하기 좋아요.": ["You take Amosartan (once daily, morning) for blood pressure. Measuring at the same time each morning, before your dose, makes changes easier to compare.", "您正在服用降压药Amosartan（每日1次，早上）。每天早上服药前在同一时间测量，更便于比较变化。", "血圧の薬アモザルタン（1日1回朝）を服用中です。服用前、毎朝同じ時間に測ると変化を比べやすくなります。"],
 "공복 평균": ["Fasting avg", "空腹平均", "空腹時平均"], "7일 최고": ["7-day high", "7日最高", "7日最高"], "측정 횟수": ["Readings", "测量次数", "測定回数"],
 "당뇨약 다이아벡스(1일 2회 식후)를 복용 중이에요. 금색은 공복, 녹색은 식후 2시간 측정값이에요.": ["You take Diabex (twice daily after meals) for diabetes. Gold bars are fasting readings; green bars are 2 hours after a meal.", "您正在服用降糖药Diabex（每日2次，饭后）。金色为空腹值，绿色为餐后2小时值。", "糖尿病の薬ダイアベックス（1日2回食後）を服用中です。金色は空腹時、緑色は食後2時間の測定値です。"],
 "수축기": ["Systolic", "收缩压", "収縮期"], "이완기": ["Diastolic", "舒张压", "拡張期"], "맥박": ["Pulse", "脉搏", "脈拍"],
 "혈압 {0}/{1}을 기록했어요": ["Logged blood pressure {0}/{1}", "已记录血压 {0}/{1}", "血圧 {0}/{1} を記録しました"], "혈당 {0} mg/dL을 기록했어요": ["Logged glucose {0} mg/dL", "已记录血糖 {0} mg/dL", "血糖 {0} mg/dL を記録しました"],
 "오늘 복용 완료": ["Taken today", "今日已服用", "本日服用済み"], "복용 전": ["Not yet taken", "未服用", "服用前"],
 "신기능 저하": ["Reduced kidney function", "肾功能下降", "腎機能低下"], "간기능 저하": ["Reduced liver function", "肝功能下降", "肝機能低下"],
 "주의할 이상반응 {0}": ["{0} to watch", "需注意的不良反应 {0}", "注意すべき副作用 {0}"],
 "홈": ["Home", "首页", "ホーム"], "기록": ["Records", "记录", "記録"], "스캔": ["Scan", "扫描", "スキャン"], "상담": ["Chat", "咨询", "相談"], "마이": ["Me", "我的", "マイ"],
 "처방전·약봉투": ["Rx / pill bag", "处方·药袋", "処方箋・薬袋"], "처방전이나 약봉투의 글자가 네모 안에 들어오게 비춰주세요": ["Fit the text of the prescription or pill bag inside the frame", "请将处方或药袋上的文字对准方框", "処方箋や薬袋の文字が枠内に入るように写してください"],
 "바코드": ["Barcode", "条形码", "バーコード"], "약 상자의 바코드를 가로로 맞춰주세요": ["Line up the barcode on the box horizontally", "请将药盒上的条形码横向对准", "薬箱のバーコードを横向きに合わせてください"],
 "알약 모양": ["Pill shape", "药片外观", "錠剤の形"], "알약 하나를 어두운 바탕 위에 올려 가까이 비춰주세요": ["Place one pill on a dark surface and hold the camera close", "请将一粒药片放在深色背景上近距离拍摄", "錠剤を1つ暗い背景の上に置き、近づけて写してください"],
 "{0} {1} 복용을 기록했어요": ["Logged {0} · {1}", "已记录 {0} {1} 服药", "{0} {1} の服用を記録しました"],
 "처방약 스캔": ["Scan Rx", "扫描处方药", "処方薬スキャン"], "증상 체크": ["Symptoms", "症状检查", "症状チェック"], "복약 일정": ["Schedule", "服药计划", "服薬予定"], "약국 찾기": ["Pharmacies", "查找药店", "薬局を探す"],
 "이상반응": ["Side effects", "不良反应", "副作用"], "신·간기능": ["Kidney · Liver", "肾·肝功能", "腎・肝機能"], "복용법": ["How to take", "服用方法", "飲み方"],
 "월": ["M", "一", "月"], "화": ["T", "二", "火"], "수": ["W", "三", "水"], "목": ["T", "四", "木"], "금": ["F", "五", "金"], "토": ["S", "六", "土"], "일": ["S", "日", "日"],
 "서울내과의원 처방전": ["Seoul Internal Medicine Rx", "首尔内科医院处方", "ソウル内科医院の処方箋"], "4개 약 · 주의 3건": ["4 drugs · 3 alerts", "4种药 · 3项注意", "4種類 · 注意3件"], "처방전": ["Rx", "处方", "処方箋"],
 "타이레놀 8시간 ER": ["Tylenol 8HR ER", "泰诺 8小时 ER", "タイレノール 8時間 ER"], "1개 약 · 주의 없음": ["1 drug · No alerts", "1种药 · 无需注意", "1種類 · 注意なし"],
 "흰색 원형 알약 \"YH\"": ["White round pill \"YH\"", "白色圆形药片 \"YH\"", "白い円形錠剤「YH」"], "후보 2개": ["2 matches", "2个候选", "候補2件"], "알약": ["Pill", "药片", "錠剤"],
 "푸른숲약국 약봉투": ["Green Forest Pharmacy bag", "绿林药店药袋", "緑の森薬局の薬袋"], "3개 약 · 주의 1건": ["3 drugs · 1 alert", "3种药 · 1项注意", "3種類 · 注意1件"], "약봉투": ["Pill bag", "药袋", "薬袋"],
 "복용 완료": ["Taken", "已服用", "服用済み"], "누락": ["Missed", "漏服", "飲み忘れ"], "증상 기록": ["Symptoms", "症状记录", "症状記録"],
 "리리카 의심": ["Possibly Lyrica", "疑似Lyrica", "リリカの疑い"], "발목 부음": ["Ankle swelling", "脚踝肿胀", "足首のむくみ"], "아모잘탄 의심": ["Possibly Amosartan", "疑似Amosartan", "アモザルタンの疑い"],
 "PDF를 만들었어요 · 다운로드 폴더": ["PDF saved · Downloads", "已生成PDF · 下载文件夹", "PDFを作成しました · ダウンロード"], "{0} 님 화면으로 전환했어요": ["Switched to {0}", "已切换到{0}", "{0}さんの画面に切り替えました"],
 "복약 알림 설정": ["Reminder settings", "服药提醒设置", "服薬通知の設定"], "2개 켜짐": ["2 on", "已开启2个", "2件オン"], "혈압·당뇨 수첩": ["BP & diabetes notebook", "血压·血糖手册", "血圧・血糖手帳"],
 "가족·보호자 관리": ["Family & caregivers", "家人·监护人管理", "家族・介護者の管理"], "3명": ["3 people", "3人", "3人"], "병원·약국 찾기": ["Find clinics & pharmacies", "查找医院·药店", "病院・薬局を探す"],
 "건강 리포트": ["Health report", "健康报告", "健康レポート"], "11월": ["Nov", "11月", "11月"], "오늘의 문장 다시 보기": ["Replay today's line", "重看今日一句", "今日の言葉をもう一度"], "개인정보 처리방침": ["Privacy policy", "隐私政策", "プライバシーポリシー"],
 "{0} 복용 시간을 {1}(으)로 바꿨어요": ["{0} dose moved to {1}", "{0}服药时间已改为{1}", "{0}の服用時間を{1}に変更しました"],
 "병원": ["Clinics", "医院", "病院"], "약국": ["Pharmacy", "药店", "薬局"], "맑은눈 안과의원": ["Clear Eye Clinic", "明眸眼科诊所", "クリアアイ眼科医院"], "서울중앙병원 응급실": ["Seoul Central Hospital ER", "首尔中央医院急诊", "ソウル中央病院 救急外来"], "19:00까지": ["Until 19:00", "营业至19:00", "19:00まで"],
 "읽는 중… 사진은 이 기기 안에서만 처리합니다": ["Reading… Photos are processed only on this device", "识别中… 照片仅在本设备上处理", "読み取り中… 写真はこの端末内でのみ処理します"]
};

Object.assign(D, EXTRA);
for (const [k, v] of Object.entries(DIARY)) if (!(k in D)) D[k] = v;
for (const [k, v] of Object.entries(CLASSICAL)) if (!(k in D)) D[k] = v;
for (const [k, v] of Object.entries(XWORD)) if (!(k in D)) D[k] = v;

export type UiKey = keyof typeof UI;
export type UiStrings = Record<UiKey, string>;

/** Translate a Korean source string into `lang`; unknown strings pass through unchanged. */
export const translate = (lang: Lang, s: string): string => {
  if (lang === 'ko') return s;
  const r = D[s];
  return r ? r[LANGS.indexOf(lang) - 1] : s;
};

/** Translate a template like "혈압 {0}/{1}을 기록했어요" and fill its placeholders. */
export const format = (lang: Lang, key: string, ...args: (string | number)[]): string =>
  translate(lang, key).replace(/\{(\d)\}/g, (_m, i) => String(args[Number(i)]));

export const uiStrings = (lang: Lang): UiStrings => {
  const i = LANGS.indexOf(lang);
  const out = {} as UiStrings;
  (Object.keys(UI) as UiKey[]).forEach(k => { out[k] = UI[k][i]; });
  return out;
};
