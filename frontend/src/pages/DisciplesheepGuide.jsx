import { useState, useRef, useEffect, useCallback } from "react";

// ══ SESSION DATA ══
const GENZ_SESSIONS = [
  {
    title: '"Who Is This Guy?"', ref: "Mark 1:14–28",
    passage: "Mark 1:14–28 · NASB — Jesus calls His first disciples, teaches with authority, and casts out an unclean spirit.",
    keyVerses: [
      { num: "15", text: "The time is fulfilled, and the kingdom of God is at hand; repent and believe in the gospel.", highlight: true },
      { num: "17", text: 'Jesus said to them, "Follow Me, and I will make you become fishers of men."', highlight: true },
      { num: "18", text: "Immediately they left their nets and followed Him.", highlight: true },
      { num: "22", text: "They were amazed at His teaching; for He was teaching them as one having authority, and not as the scribes.", highlight: true },
    ],
    connect: "What's one thing people always get wrong about you?",
    discover: "Read Mark 1:14–28 together.",
    questions: [
      "What surprises you about how Jesus called his first disciples?",
      'Verse 22: "He taught as one who had authority." Who do you actually trust in life — and why?',
      "What do you think Simon and Andrew gave up when they left their nets?",
    ],
    apply: "If Jesus said to you today, 'Follow me' — what would you be leaving behind?",
    pray: "Pray for one thing they shared in the Connect time.",
    tip: "Keep it light and relational. Don't rush to conclusions. Your goal is curiosity, not conviction. Let the text do the work.",
  },
  {
    title: '"Why Is Everyone Rejected?"', ref: "Mark 3:20–35",
    passage: "Mark 3:20–35 · NASB — Jesus' own family thinks He's lost His mind. He redefines family as those who do God's will.",
    keyVerses: [
      { num: "21", text: 'When His own people heard of this, they went out to take custody of Him; for they were saying, "He has lost His senses."', highlight: true },
      { num: "34–35", text: '"Behold My mother and My brothers! For whoever does the will of God, this is My brother and sister and mother."', highlight: true },
    ],
    connect: "Tell me about a time you felt misunderstood by your family or people close to you.",
    discover: "Read Mark 3:20–35.",
    questions: [
      "Even Jesus' family thought he was 'out of his mind.' Does that change how you see your own family tension about faith?",
      "Who does Jesus call 'my brother, sister, mother'? What does that mean to you personally?",
    ],
    apply: "Is there anyone in your life you can't fully be yourself around? What would a community where you could look like?",
    pray: "Pray for the relationship they mentioned.",
    tip: "Family tension around faith is very common for Gen Z. If they open up about painful family dynamics, listen fully before responding.",
  },
  {
    title: '"The Feeding and the Storm"', ref: "Mark 4:35–41; 6:30–44",
    passage: "Mark 4:35–41 · NASB — A fierce storm terrifies the disciples; Jesus calms it with a word.",
    keyVerses: [
      { num: "37–38", text: 'A fierce gale arose, waves breaking over the boat... Jesus was asleep. They woke Him: "Teacher, do You not care that we are perishing?"', highlight: true },
      { num: "40", text: '"Why are you afraid? Do you still have no faith?"', highlight: true },
    ],
    connect: "When was the last time you felt genuinely overwhelmed — like you couldn't handle something?",
    discover: "Read Mark 4:35–41.",
    questions: [
      "The disciples were experienced fishermen — and still terrified. When has your own skill or preparation not been enough?",
      "Jesus asked 'Why are you afraid? Do you still have no faith?' Is that harsh or kind? Why?",
    ],
    apply: "What storm in your life right now do you need to bring to Jesus instead of trying to manage alone?",
    pray: "Pray for the specific storm they named.",
    tip: "After this session, share your own story of a time God came through unexpectedly.",
  },
  {
    title: '"The Outsiders"', ref: "Mark 7:24–37",
    passage: "Mark 7:24–30 · NASB — A Syrophoenician woman's bold faith wins healing for her daughter.",
    keyVerses: [
      { num: "26", text: "The woman was a Gentile, of the Syrophoenician race. She kept asking Him to cast the demon out of her daughter.", highlight: true },
      { num: "28–29", text: '"Yes, Lord, but even the dogs under the table feed on the children\'s crumbs." And He said: "Because of this answer go; the demon has gone out."', highlight: true },
    ],
    connect: "Have you ever felt like an outsider — in a friend group, school, family, or place of worship?",
    discover: "Read Mark 7:24–30.",
    questions: [
      "What is bold about this woman's request? What does she understand about Jesus that others miss?",
      "Why do you think Jesus heals her daughter? What does this tell you about who Jesus is for?",
    ],
    apply: "Do you ever feel like God is not for people like you? Be honest. What would it mean to believe that He is?",
    pray: "Pray for the feeling of belonging they named.",
    tip: "Many Gen Z students feel like outsiders. Let them sit in the identification before moving to application.",
  },
  {
    title: '"The Cost"', ref: "Mark 8:27–38",
    passage: "Mark 8:34–38 · NASB — Jesus defines what it truly means to follow Him.",
    keyVerses: [
      { num: "34", text: '"If anyone wishes to come after Me, he must deny himself, and take up his cross and follow Me."', highlight: true },
      { num: "35–36", text: '"Whoever wishes to save his life will lose it, but whoever loses his life for My sake will save it. What does it profit a man to gain the whole world, and forfeit his soul?"', highlight: true },
    ],
    connect: "What's something you've sacrificed for something you really believed in?",
    discover: "Read Mark 8:34–38.",
    questions: [
      "What does 'deny yourself and take up your cross' mean to you in 2026?",
      'Jesus says, "What good is it to gain the whole world and lose yourself?" Where do you see people — or yourself — doing that?',
    ],
    apply: "Is there an area where you know God is asking you to surrender something but you've been avoiding it?",
    pray: "Pray for courage to take the step they named.",
    tip: "Do not soften the cost of discipleship — but also do not weaponize it. Share your own cross.",
  },
  {
    title: '"It Is Finished — Now What?"', ref: "Mark 16:1–8",
    passage: "Mark 16:1–8 · NASB — Women arrive at the empty tomb and flee in trembling and astonishment.",
    keyVerses: [
      { num: "6", text: '"You are looking for Jesus the Nazarene, who has been crucified. He has risen; He is not here."', highlight: true },
      { num: "8", text: "They went out and fled from the tomb, for trembling and astonishment had gripped them.", highlight: true },
    ],
    connect: "If you knew something life-changing, what would stop you from telling people about it?",
    discover: "Read Mark 16:1–8.",
    questions: [
      "The women ran from the tomb 'trembling and bewildered.' Why do you think resurrection was confusing, not just exciting?",
      "What do you make of this Jesus now — after reading through Mark together?",
    ],
    apply: "What is one thing from this study that has genuinely changed how you think, feel, or want to live?",
    pray: "Celebrate! Pray for the next step.",
    tip: "This is a milestone session — celebrate openly! Ask: 'What do you want to do with what you've discovered?' Let them lead.",
  },
];

const MILL_SESSIONS = [
  {
    title: '"I\'m Drowning"', ref: "Psalm 18:1–19",
    passage: "Psalm 18:1–6, 16–19 · NASB — David cries out in distress and God rescues him.",
    keyVerses: [
      { num: "1", text: '"I love You, O Lord, my strength."', highlight: true },
      { num: "6", text: "In my distress I called upon the Lord and cried to my God for help; He heard my voice.", highlight: true },
      { num: "19", text: "He brought me forth also into a broad place; He rescued me, because He delighted in me.", highlight: true },
    ],
    connect: "What's one area of life right now where you feel most stretched or tired?",
    discover: "Read Psalm 18:1–6 and 16–19.",
    questions: [
      "David writes from a place of genuine crisis. When have you been most honest with God?",
      "He says 'He rescued me because He delighted in me' (v.19). Not because of performance. How does that land for you?",
      "What would it look like to believe God actually delights in you — right now?",
    ],
    apply: "Write or say out loud one honest thing you'd say to God today if you believed He was actually listening.",
    pray: "Pray that prayer together.",
    tip: 'The phrase "He delighted in me" can be genuinely shocking. Give it space. Ask: "What does it feel like to hear that?"',
  },
  {
    title: '"The Comparison Trap"', ref: "Psalm 73",
    passage: "Psalm 73:1–17 · NASB — Asaph almost loses his faith envying the wicked, until he enters the sanctuary.",
    keyVerses: [
      { num: "3", text: "For I was envious of the arrogant as I saw the prosperity of the wicked.", highlight: true },
      { num: "17", text: "Until I came into the sanctuary of God; then I perceived their end.", highlight: true },
    ],
    connect: "Social media, work, your neighbor's new car — where do you feel the comparison trap most?",
    discover: "Read Psalm 73:1–17.",
    questions: [
      "Asaph almost loses his faith watching 'the wicked prosper.' Where do you feel like the faithful are losing?",
      "Verse 17: Everything changed 'until I entered the sanctuary of God.' What changes your perspective?",
    ],
    apply: "What is one comparison you need to lay down this week?",
    pray: "Pray specifically about the comparison they named.",
    tip: "Validate that comparison and envy are real, not shameful.",
  },
  {
    title: '"The Wisdom of Small Decisions"', ref: "Proverbs 4:20–27",
    passage: "Proverbs 4:20–27 · NASB — The teacher calls for guarding your heart and watching the path of your feet.",
    keyVerses: [
      { num: "23", text: "Watch over your heart with all diligence, for from it flow the springs of life.", highlight: true },
      { num: "26", text: "Watch the path of your feet and all your ways will be established.", highlight: true },
    ],
    connect: "What's one small decision in your past that changed the direction of your life?",
    discover: "Read Proverbs 4:20–27.",
    questions: [
      "'Guard your heart, for everything you do flows from it.' What are you feeding your heart daily?",
      "What does a level path look like in your current life stage?",
    ],
    apply: "Name one habit, relationship, or input into your life that you know is pulling you in the wrong direction.",
    pray: "Pray about the specific thing they named.",
    tip: "Let them lead the depth. Your role is to ask, not tell.",
  },
  {
    title: '"When Work or Marriage Feels Broken"', ref: "Psalm 62; Colossians 3:23–24",
    passage: "Psalm 62 & Colossians 3:23–24 · NASB — Rest in God alone; work as for the Lord.",
    keyVerses: [
      { num: "Ps 62:1", text: "My soul waits in silence for God only; from Him is my salvation.", highlight: true },
      { num: "Col 3:23", text: "Whatever you do, do your work heartily, as for the Lord rather than for men.", highlight: true },
    ],
    connect: "Where in your work or closest relationships do you feel most unappreciated or invisible?",
    discover: "Read Psalm 62:1–8 and Colossians 3:23–24.",
    questions: [
      "'My soul finds rest in God alone.' What's the difference between looking to people for rest vs. God?",
      "'Work as for the Lord.' How does that change the meaning of ordinary, unrewarded work?",
    ],
    apply: "Which relationship or role do you most need to re-frame as an act of worship this week?",
    pray: "Pray for their specific work burden and relationships.",
    tip: "Unmet expectations in marriage and work are deeply sensitive. If they begin to open up, listen carefully and do not offer quick solutions.",
  },
  {
    title: '"Raising Arrows"', ref: "Psalm 127–128",
    passage: "Psalm 127:1–3 · NASB — Unless the Lord builds the house, children are God's gift.",
    keyVerses: [
      { num: "127:1", text: "Unless the Lord builds the house, they labor in vain who build it.", highlight: true },
      { num: "127:3", text: "Behold, children are a gift of the Lord, the fruit of the womb is a reward.", highlight: true },
    ],
    connect: "What's one fear you have as a parent — or what kind of person do you want to be remembered as?",
    discover: "Read Psalm 127:1–5 and 128:1–4.",
    questions: [
      "'Unless the Lord builds the house, the builders labor in vain.' What does it mean to build a family with God at the center?",
      "What does a 'blessed' home look like to you?",
    ],
    apply: "What is one thing you want to start doing differently in your home starting this week?",
    pray: "Pray for their family by name — each person.",
    tip: "Pray for each child by name at the end — this is often deeply moving.",
  },
  {
    title: '"The Good Life"', ref: "Psalm 1; John 15:1–11",
    passage: "Psalm 1:1–3 & John 15:4–5 · NASB — The blessed person is like a tree by streams; apart from Christ we can do nothing.",
    keyVerses: [
      { num: "Ps 1:2–3", text: "His delight is in the law of the Lord... He will be like a tree firmly planted by streams of water, which yields its fruit in its season.", highlight: true },
      { num: "Jn 15:5", text: '"Apart from Me you can do nothing."', highlight: true },
    ],
    connect: "How do you define a successful life? Has that definition changed in the last 5 years?",
    discover: "Read Psalm 1 and John 15:4–5.",
    questions: [
      "Psalm 1 describes the person who meditates on God's Word as 'like a tree planted by streams.' What does being rooted mean in a fast-moving world?",
      "Jesus says 'apart from me you can do nothing.' Is that discouraging or freeing?",
    ],
    apply: "What is one discipline — daily or weekly — that would help you stay connected to God?",
    pray: "Let your friend pray for you too. Mutual prayer is a sign of real relationship.",
    tip: "This is your final session. Share what you've seen grow in them. Plant the seed of multiplication.",
  },
];

const GENX_SESSIONS = [
  {
    title: '"What Have I Actually Built?"', ref: "Ecclesiastes 1:1–11; 2:1–11",
    passage: "Ecclesiastes 2:10–11 · NASB — Qohelet surveys all he built and calls it 'vanity and striving after wind.'",
    keyVerses: [
      { num: "2:11", text: "Behold all was vanity and striving after wind and there was no profit under the sun.", highlight: true },
    ],
    connect: "Looking back at the last 20 years — what are you most proud of? What do you wish had been different?",
    discover: "Read Ecclesiastes 1:2–4 and 2:10–11.",
    questions: [
      "Qohelet built everything and called it 'meaningless.' Does that resonate? Why or why not?",
      "What do you think gives a life real meaning — not just success or achievement?",
    ],
    apply: "If you had 10 more years, what would you want to invest them in — and why?",
    pray: "Sit with the answer they give. Don't rush past it.",
    tip: "This session is slow — do not rush it. Gen X will fill the silence with their real thoughts — often gold.",
  },
  {
    title: '"When Faith Gets Tested"', ref: "Job 1:1–12; 13:15",
    passage: "Job 1–2 & 13:15 · NASB — Job loses everything; yet declares, 'Though He slay me, I will hope in Him.'",
    keyVerses: [
      { num: "13:15", text: '"Though He slay me, I will hope in Him."', highlight: true },
    ],
    connect: "Has there been a season in your life where God felt silent, absent, or unfair?",
    discover: "Read Job 1:1–5 and 2:9–10.",
    questions: [
      "Job loses everything and still says 'Shall we accept good from God and not trouble?' Where does that kind of faith come from?",
      "Read Job 13:15 — 'Though He slay me, yet will I trust Him.' Is that despair, defiance, or faith?",
    ],
    apply: "Is there a place in your life where you've been holding back from God because of something painful?",
    pray: "Pray for the painful place they named — slowly, specifically.",
    tip: "Your willingness to stay present in the pain is the ministry.",
  },
  {
    title: '"The Weight of Regret"', ref: "Psalm 51; Romans 8:1",
    passage: "Psalm 51 & Romans 8:1 · NASB — David's prayer for a clean heart; no condemnation in Christ.",
    keyVerses: [
      { num: "Ps 51:10", text: "Create in me a clean heart, O God, and renew a steadfast spirit within me.", highlight: true },
      { num: "Rom 8:1", text: "Therefore there is now no condemnation for those who are in Christ Jesus.", highlight: true },
    ],
    connect: "Is there something in your life — a choice, a relationship — that you still carry guilt or regret about?",
    discover: "Read Psalm 51:1–13.",
    questions: [
      "David wrote this after one of his worst moral failures. What strikes you about the honesty of his prayer?",
      "He asks God to 'create in me a clean heart' — not just forgive the action, but change the person. What's the difference?",
      "Read Romans 8:1. What does that verse do to the weight you carry?",
    ],
    apply: "Is there something specific you need to receive forgiveness for — from God, or perhaps from yourself?",
    pray: "Be present. Do not rush. Allow silence.",
    tip: "Be present. Tissues may be needed. Do not rush.",
  },
  {
    title: '"Legacy: What Will Remain?"', ref: "Psalm 71:17–18; 2 Timothy 1:5",
    passage: "Psalm 71:18 & 2 Timothy 1:5 · NASB — Declaring God's strength to the next generation; faith passed down through Lois to Timothy.",
    keyVerses: [
      { num: "71:18", text: "Even when I am old and gray, O God, do not forsake me, until I declare Your strength to this generation.", highlight: true },
    ],
    connect: "What's one thing you learned from your parents or grandparents — positive or negative — that shaped who you are?",
    discover: "Read Psalm 71:17–18 and 2 Timothy 1:5.",
    questions: [
      "What do you hope the next generation takes from watching your life?",
      "Paul notes Timothy's faith first lived in his grandmother Lois. Who poured faith into you?",
    ],
    apply: "Who in the next generation is watching your life? What story of faith are you passing on to them right now?",
    pray: "Pray for the specific legacy moment they named.",
    tip: "Hold both grief about parents and hope about children gently.",
  },
  {
    title: '"Anger, Disappointment, and God"', ref: "Psalm 88; Lamentations 3:19–24",
    passage: "Psalm 88 & Lamentations 3:19–24 · NASB — The only Psalm without resolution; yet Lamentations finds hope in God's faithfulness.",
    keyVerses: [
      { num: "Lam 3:21–23", text: 'This I recall to my mind, therefore I have hope. The Lord\'s lovingkindnesses never cease... They are new every morning; great is Your faithfulness.', highlight: true },
    ],
    connect: "What's something in the world or your personal life that makes you genuinely angry or sad right now?",
    discover: "Read Psalm 88 — the only Psalm that ends without resolution.",
    questions: [
      "This psalm ends in darkness. No 'but God.' Just lament. Does it comfort or disturb you that this is in the Bible?",
      "How does the writer of Lamentations move from despair to 'great is Your faithfulness'?",
    ],
    apply: "Where are you right now — in the darkness of Psalm 88 or beginning to see the dawn of Lamentations 3?",
    pray: "Stay with wherever they are. Do not rush to resolution.",
    tip: "Not every session needs a tidy resolution. Naming the darkness is itself a form of hope.",
  },
  {
    title: '"Finishing Well"', ref: "2 Timothy 4:6–8; Hebrews 12:1–3",
    passage: "2 Timothy 4:7 & Hebrews 12:1–3 · NASB — Paul's final testimony; running with a cloud of witnesses.",
    keyVerses: [
      { num: "4:7", text: '"I have fought the good fight, I have finished the course, I have kept the faith."', highlight: true },
    ],
    connect: "When you imagine the end of your life — what would 'finished well' look like?",
    discover: "Read 2 Timothy 4:6–8 and Hebrews 12:1–3.",
    questions: [
      '"I have fought the good fight, I have finished the race, I have kept the faith." Which of these three do you most want to say?',
      "We run with 'a great cloud of witnesses' — cheering. Who do you picture in that crowd for you?",
    ],
    apply: "What is one thing you want to change or strengthen in the next season to make sure you finish well?",
    pray: "Pray for your friend's legacy — name it. Invite them to pray — even one sentence.",
    tip: "Name what you've seen in them. Speak their legacy out loud before they do. Then ask them to do the same for you.",
  },
];

const REAL_TALK_TOPICS = [
  { id: "mental",   num: 1,  title: "Calm in the Storm",              sub: "Mental Health, Anxiety & Inner Peace",                         gen: "All — especially Gen Z",          color: "#5B8DD9" },
  { id: "social",   num: 2,  title: "More Than a Highlight Reel",     sub: "Social Media, Identity & the Comparison Trap",                 gen: "Gen Z & Millennials",             color: "#E06B9A" },
  { id: "tech",     num: 3,  title: "Human in the Age of AI",         sub: "Artificial Intelligence & What Makes Us Uniquely Human",       gen: "All generations",                 color: "#7B68EE" },
  { id: "money",    num: 4,  title: "Rich or Free?",                  sub: "Money, Debt, the OFW Dream & True Contentment",                gen: "Millennials & Gen X",             color: "#5C7A3E" },
  { id: "sex",      num: 5,  title: "Love, Sex & the Lonely Screen",  sub: "Dating Apps, Pornography & God's Design for Intimacy",         gen: "Gen Z & Millennials",             color: "#C0392B" },
  { id: "politics", num: 6,  title: "Kingdom Citizens",               sub: "Politics, Elections, Corruption & Christian Civic Duty",       gen: "All — especially Gen X",          color: "#1F4E6B" },
  { id: "creation", num: 7,  title: "This Is God's World",            sub: "Climate Crisis, Creation & Filipino Ecological Responsibility", gen: "Gen Z — all ages welcome",        color: "#2E8B57" },
  { id: "family",   num: 8,  title: "Honor, Obligation & Love",       sub: "Filipino Family Pressure, Utang na Loob & the Gospel of Grace", gen: "All — deeply Filipino in context", color: "#E67E22" },
  { id: "work",     num: 9,  title: "The Art of Stopping",            sub: "Hustle Culture, Overwork, Burnout & the Biblical Sabbath",     gen: "Millennials & Gen X",             color: "#8B2E2E" },
  { id: "grief",    num: 10, title: "When Someone Is Gone",           sub: "Death, Grief, OFW Separation & the Hope of Resurrection",     gen: "Gen X & older Millennials",       color: "#555" },
  { id: "faith",    num: 11, title: "Starting Over",                  sub: "Prodigal Stories, Doubt & Coming Back to Faith",              gen: "All — especially returning",       color: "#C9A84C" },
  { id: "purpose",  num: 12, title: "What Am I Here For?",            sub: "Calling, Purpose & Discovering Your God-given Vocation",      gen: "Gen Z & Millennials",             color: "#9B59B6" },
];

// ══ COLOUR MAP ══
const COLORS = {
  genz: { primary: "#2D6A8F", gradient: "linear-gradient(150deg,#0D2233 0%,#1A3D54 50%,#2D6A8F 100%)", light: "#EBF4FA", text: "#1A3D54" },
  mill: { primary: "#5C7A3E", gradient: "linear-gradient(150deg,#1A2810 0%,#2A3D1A 50%,#5C7A3E 100%)", light: "#EDF4E8", text: "#2A3D1A" },
  genx: { primary: "#7A4A2A", gradient: "linear-gradient(150deg,#1A0A04 0%,#3D1A08 50%,#7A4A2A 100%)", light: "#F6EDE5", text: "#3D1A08" },
  real: { primary: "#C9A84C", gradient: "linear-gradient(155deg,#0A0A0A 0%,#1A1208 40%,#2C1A0A 70%,#1F4E6B 100%)", light: "#FFFBEB", text: "#3D2A1A" },
};

const PART_COLORS = {
  connect:  { bg: "#FEF3E2", color: "#B45309" },
  discover: { bg: "#EBF4FA", color: "#1A5276" },
  apply:    { bg: "#ECFDF5", color: "#065F46" },
  pray:     { bg: "#F5F3FF", color: "#5B21B6" },
};

// ══ TIMER ══
function useTimer(initialMin = 45) {
  const [total, setTotal] = useState(initialMin * 60);
  const [remaining, setRemaining] = useState(initialMin * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => { if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; } return r - 1; });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const toggle = () => { if (remaining <= 0) { setRemaining(total); return; } setRunning(r => !r); };
  const reset = () => { clearInterval(intervalRef.current); setRunning(false); setRemaining(total); };
  const setMin = useCallback((min) => { clearInterval(intervalRef.current); setRunning(false); const t = min * 60; setTotal(t); setRemaining(t); }, []);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return { remaining, running, toggle, reset, setMin, fmt, total };
}

// ══ SUB-COMPONENTS ══
function SessionCard({ session, num, color, isOpen, onToggle }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: "white", borderRadius: isOpen ? "10px 10px 0 0" : 10,
          padding: "16px 18px", textAlign: "left", cursor: "pointer", display: "flex",
          alignItems: "center", gap: 14, border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 1px 5px rgba(0,0,0,0.06)", transition: "all 0.2s",
        }}
      >
        <div style={{ width: 35, height: 35, borderRadius: "50%", background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "serif", fontSize: 15, fontWeight: 600, flexShrink: 0 }}>{num}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 17, color: "#1A1208" }}>{session.title}</div>
          <div style={{ fontSize: 14, opacity: 0.7, fontStyle: "italic", marginTop: 2 }}>{session.ref}</div>
        </div>
        <span style={{ opacity: 0.3, transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "none", fontSize: 18 }}>▾</span>
      </button>
      {isOpen && (
        <div style={{ background: "white", borderRadius: "0 0 10px 10px", padding: "20px", border: "1px solid rgba(0,0,0,0.07)", borderTop: "none" }}>
          <p style={{ fontSize: 13, fontStyle: "italic", color: "#666", marginBottom: 14, borderLeft: `3px solid ${color}`, paddingLeft: 10 }}>{session.passage}</p>
          {session.keyVerses?.map((v, i) => (
            <div key={i} style={{ background: "#FAF6EE", borderLeft: `3px solid #C9A84C`, borderRadius: "0 6px 6px 0", padding: "10px 13px", marginBottom: 8, fontSize: 14, lineHeight: 1.5, fontStyle: "italic", color: "#3D2A1A" }}>
              <strong style={{ fontStyle: "normal", fontFamily: "serif", fontSize: 12, opacity: 0.6, marginRight: 6 }}>{v.num}</strong>{v.text}
            </div>
          ))}
          {[
            { key: "connect",  label: "Connect",  content: session.connect, type: "text" },
            { key: "discover", label: "Discover", content: session.discover, questions: session.questions, type: "discover" },
            { key: "apply",    label: "Apply",    content: session.apply,   type: "text" },
            { key: "pray",     label: "Pray",     content: session.pray,    type: "text" },
          ].map(({ key, label, content, questions, type }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <span style={{ ...PART_COLORS[key], fontFamily: "serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, padding: "2px 8px", borderRadius: 4, display: "inline-block", marginBottom: 6 }}>{label}</span>
              <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.85, fontStyle: type === "text" ? "italic" : "normal" }}>{content}</p>
              {questions && <ul style={{ listStyle: "none", marginTop: 6 }}>{questions.map((q, i) => <li key={i} style={{ fontSize: 14, lineHeight: 1.5, padding: "4px 0 4px 18px", position: "relative", opacity: 0.8 }}><span style={{ position: "absolute", left: 4, opacity: 0.4 }}>·</span>{q}</li>)}</ul>}
            </div>
          ))}
          {session.tip && (
            <div style={{ background: "#FFFBEB", borderLeft: "3px solid #C9A84C", padding: "10px 13px", borderRadius: "0 6px 6px 0", fontSize: 13, lineHeight: 1.4, fontStyle: "italic", color: "#5C3D2E", marginTop: 8 }}>
              💡 <strong style={{ fontStyle: "normal" }}>Leader Note:</strong> {session.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GuideScreen({ guide, sessions, meta, colors, onBack }) {
  const [openIdx, setOpenIdx] = useState(null);
  const timer = useTimer(45);
  const [timerOpen, setTimerOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EE", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: colors.gradient, color: "white", padding: "48px 24px 36px", textAlign: "center" }}>
        <p style={{ fontFamily: "serif", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#E8D196", opacity: 0.8, marginBottom: 10 }}>{meta.tag}</p>
        <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "clamp(36px,7vw,56px)", lineHeight: 1.1, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: meta.title }} />
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", fontStyle: "italic", marginBottom: 14 }}>{meta.sub}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {meta.badges.map((b, i) => <span key={i} style={{ padding: "4px 12px", border: "1px solid rgba(201,168,76,0.38)", borderRadius: 100, fontSize: 13, color: "#E8D196" }}>{b}</span>)}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {meta.who.map((box, i) => (
            <div key={i} style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderTop: `3px solid ${colors.primary}` }}>
              <h4 style={{ fontFamily: "serif", fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: colors.primary, marginBottom: 8 }}>{box.title}</h4>
              {box.list
                ? <ul style={{ listStyle: "none" }}>{box.list.map((t, j) => <li key={j} style={{ fontSize: 14, lineHeight: 1.4, padding: "4px 0 4px 22px", position: "relative", opacity: 0.8 }}><span style={{ position: "absolute", left: 0, opacity: 0.5 }}>→</span>{t}</li>)}</ul>
                : <p style={{ fontSize: 14, lineHeight: 1.4, opacity: 0.78 }}>{box.text}</p>
              }
            </div>
          ))}
        </div>
        <div style={{ background: colors.light, borderLeft: `4px solid ${colors.primary}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 24, fontSize: 14, lineHeight: 1.4, fontStyle: "italic", color: colors.text }}>{meta.bookNote}</div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 40px" }}>
        <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "clamp(26px,4vw,34px)", margin: "24px 0 16px", paddingBottom: 10, borderBottom: `2px solid ${colors.primary}22`, color: colors.text }}>
          Session Series: {meta.seriesName}
        </h2>
        {sessions.map((s, i) => (
          <SessionCard key={i} session={s} num={i + 1} color={colors.primary} isOpen={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
        ))}
        <div style={{ background: "white", borderRadius: 10, padding: 22, marginTop: 28 }}>
          <h4 style={{ fontFamily: "serif", fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: colors.primary, marginBottom: 8 }}>Group Meeting Tip</h4>
          <p style={{ fontSize: 14, lineHeight: 1.4, opacity: 0.78 }}>{meta.groupTip}</p>
        </div>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 500, margin: "32px auto 0" }}>
          <p style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: 18, lineHeight: 1.6, fontStyle: "italic", color: "#3D2A1A" }}>{meta.footerVerse}</p>
          <cite style={{ display: "block", marginTop: 10, fontFamily: "serif", fontSize: 12, letterSpacing: 2, color: "#C9A84C", fontStyle: "normal" }}>{meta.footerRef}</cite>
        </div>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "white", borderTop: "1px solid rgba(0,0,0,0.08)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -2px 12px rgba(0,0,0,0.07)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#5C3D2E", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          <button onClick={() => setTimerOpen(!timerOpen)} style={{ fontFamily: "serif", fontSize: 17, fontWeight: 600, color: timer.running ? colors.primary : "#1A1208", letterSpacing: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>
            {timer.fmt(timer.remaining)}
          </button>
          <button onClick={timer.toggle} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: colors.primary, color: "white", fontSize: 13 }}>
            {timer.running ? "⏸" : "▶"}
          </button>
          <button onClick={timer.reset} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", background: "#FAF6EE", color: "#3D2A1A", fontSize: 13 }}>↺</button>
          {timerOpen && (
            <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0, background: "white", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.14)", border: "1px solid rgba(0,0,0,0.08)", padding: 14, zIndex: 200, display: "flex", gap: 8, flexWrap: "wrap", minWidth: 200 }}>
              {[30, 45, 60].map(m => (
                <button key={m} onClick={() => { timer.setMin(m); setTimerOpen(false); }} style={{ padding: "6px 13px", borderRadius: 100, border: "1.5px solid rgba(0,0,0,0.1)", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>{m} min</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RealTalkGrid({ onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EE", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "linear-gradient(155deg,#0A0A0A 0%,#1A1208 40%,#2C1A0A 70%,#1F4E6B 100%)", color: "white", padding: "48px 24px 36px", textAlign: "center" }}>
        <p style={{ fontFamily: "serif", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#E8D196", opacity: 0.8, marginBottom: 10 }}>All Generations · Leader's Guide</p>
        <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "clamp(36px,7vw,56px)", lineHeight: 1.1, marginBottom: 8 }}>Real <em style={{ color: "#C9A84C" }}>Talk</em></h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", fontStyle: "italic", marginBottom: 14 }}>12 Conversation Guides on Real-Life Issues · All Ages</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {["All Generations", "Any Setting", "Stand-alone or Supplemental"].map((b, i) => (
            <span key={i} style={{ padding: "4px 12px", border: "1px solid rgba(201,168,76,0.38)", borderRadius: 100, fontSize: 13, color: "#E8D196" }}>{b}</span>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
        <p style={{ fontFamily: "serif", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#C9A84C", marginBottom: 16, opacity: 0.8 }}>Choose a Topic</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {REAL_TALK_TOPICS.map(topic => (
            <div key={topic.id} style={{ background: "white", borderRadius: 10, padding: "18px 18px 14px", boxShadow: "0 1px 5px rgba(0,0,0,0.06)", cursor: "pointer", borderLeft: `4px solid ${topic.color}`, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 5px rgba(0,0,0,0.06)"; }}
            >
              <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "serif", fontSize: 26, fontWeight: 600, opacity: 0.15, flexShrink: 0, marginTop: 2 }}>{topic.num}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.5, marginBottom: 3 }}>Topic {topic.num}</div>
                  <h3 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: 18, marginBottom: 3, lineHeight: 1.2 }}>{topic.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.58 }}>{topic.sub}</p>
                  <span style={{ display: "inline-block", marginTop: 7, padding: "2px 8px", background: "#FAF6EE", borderRadius: 100, fontSize: 12, opacity: 0.65 }}>{topic.gen}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "sticky", bottom: 0, background: "white", borderTop: "1px solid rgba(0,0,0,0.08)", padding: "12px 16px", boxShadow: "0 -2px 12px rgba(0,0,0,0.07)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#5C3D2E", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
      </div>
    </div>
  );
}

// ══ GUIDE META DATA ══
const GUIDE_META = {
  genz: {
    tag: "Approach 1 of 3 · Leader's Guide",
    title: "Discovery &amp; <em style='color:#C9A84C;font-style:italic'>Dialogue</em>",
    sub: "Real Life, Real Faith · Book of Mark · 6 Sessions",
    badges: ["Gen Z · Ages 21–29", "WPU & PSU Students", "Coffee Shop · Campus · Home"],
    bookNote: "📖 Why Mark? It's the shortest gospel — action-packed, no long speeches. Jesus is always moving, always surprising. Perfect for a generation that values authenticity and action over ritual.",
    seriesName: '"Real Life, Real Faith"',
    groupTip: "Keep groups at 4–7 people. Use round table or floor seating over rows. Open every group with a fun icebreaker. End with a 'prayer request in one sentence' round. After Part 2, add a 5-min 'Share Round' — each person says one word that stood out. No pressure to explain.",
    footerVerse: '"Two are better than one, because they have a good return for their labor."',
    footerRef: "— Ecclesiastes 4:9",
    who: [
      { title: "Who They Are", text: "Gen Z (born 1997–2005) are digital natives who grew up with smartphones and a world that feels uncertain. They are deeply curious, socially conscious, and spiritually open — but suspicious of institutions and quick to detect inauthenticity. They respond to honest questions, real stories, and being treated as equals in the conversation." },
      { title: "Relationship-Building Tips", list: ["Meet them where they are — coffee shop, campus canteen, or online. Don't start in a church setting.", "Be curious about their world before talking about yours. Ask about their course, dreams, frustrations.", "Don't have all the answers. 'I don't know — let's figure it out together' builds more trust.", "Keep sessions to 45–60 minutes maximum. Shorter and consistent beats longer and irregular."] },
    ],
  },
  mill: {
    tag: "Approach 2 of 3 · Leader's Guide",
    title: "Life-Connect <em style='color:#C9A84C;font-style:italic'>Method</em>",
    sub: "Life on Purpose · Psalms & Proverbs · 6 Sessions",
    badges: ["Millennials · Ages 30–44", "Working Professionals", "Home · Workplace · Life Group"],
    bookNote: "📖 Why Psalms & Proverbs? Millennials resonate with raw emotional honesty (Psalms) and practical wisdom for real-world decisions (Proverbs). These books meet them where they live.",
    seriesName: '"Life on Purpose"',
    groupTip: "Rotate hosts — this builds ownership and belonging faster than a static venue. Quarterly social events (dinner, game night, beach trip) deepen the study itself. Groups work best at 4–8 people. After Part 2, add a 5-min 'Share Round' where each person says one word that stood out. No pressure to explain.",
    footerVerse: '"And let us consider how we may spur one another on toward love and good deeds."',
    footerRef: "— Hebrews 10:24",
    who: [
      { title: "Who They Are", text: "Millennials (born 1981–1996) are navigating adulting — careers, marriage, children, debt, and burnout. Many grew up with religion but drifted in young adulthood. They are drawn back by life experiences: marriage difficulties, the birth of a child, the loss of a parent, or a deep sense that something is missing. They want truth that works in real life, not just theory." },
      { title: "Relationship-Building Tips", list: ["Earn trust through consistency, not charisma. Show up when you say you will. Remember what they told you last time.", "Connect over shared life stages — parenting struggles, work pressure, identity questions.", "Offer value before asking for investment. Help them move, share a resource, before inviting them.", "Meet at the home or over a meal when possible — Millennials bond over shared food and real environments."] },
    ],
  },
  genx: {
    tag: "Approach 3 of 3 · Leader's Guide",
    title: "Wisdom &amp; <em style='color:#C9A84C;font-style:italic'>Legacy</em>",
    sub: "Unfinished Business · Ecclesiastes, Job & Epistles · 6 Sessions",
    badges: ["Gen X · Ages 45–51", "Mentorship & Depth", "Home · Merienda · Mentorship Setting"],
    bookNote: "📖 Why Ecclesiastes & Job? These books wrestle honestly with disappointment, mortality, and the search for meaning — exactly where Gen X lives in midlife.",
    seriesName: '"Unfinished Business"',
    groupTip: "Gen X groups are best at 3–5 people. A living room or veranda with merienda is ideal. No projectors needed. End with a 'one-word prayer' round. These are slow, deep sessions — allow silence.",
    footerVerse: '"And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others."',
    footerRef: "— 2 Timothy 2:2",
    who: [
      { title: "Who They Are", text: "Gen X (born 1975–1980) are pragmatic, self-reliant, and quietly carrying a lot. By their mid-40s they may be dealing with aging parents, teenagers at home, career ceilings, and the early stirrings of legacy thinking. They are less likely to share publicly but deeply loyal in private. They respect earned trust, dislike hype, and respond to one-on-one sincerity." },
      { title: "Relationship-Building Tips", list: ["Never talk down to them. They are wise, experienced, and may know more than you. Lead with deep respect.", "Show genuine interest in their story — what they've built, survived, and learned.", "Share a meal in their home or take them to a familiar local place — not a trendy coffee shop.", "The best entry point: ask them to share wisdom with you. Gen X thrives when valued for their experience."] },
    ],
  },
};

const SESSIONS_MAP = { genz: GENZ_SESSIONS, mill: MILL_SESSIONS, genx: GENX_SESSIONS };

// ══ TABS ══
const DS_TABS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "genz", icon: "✨", label: "Gen Z" },
  { id: "mill", icon: "🌿", label: "Millennials" },
  { id: "genx", icon: "🪵", label: "Gen X" },
  { id: "real", icon: "💬", label: "Real Talk" },
];

// ══ MAIN EXPORT ══
export default function DisciplesheepGuide() {
  const [screen, setScreen] = useState("home");

  const navigate = (id) => setScreen(id);
  const goHome = () => setScreen("home");

  if (screen === "genz" || screen === "mill" || screen === "genx") {
    return (
      <>
        <GuideScreen guide={screen} sessions={SESSIONS_MAP[screen]} meta={GUIDE_META[screen]} colors={COLORS[screen]} onBack={goHome} />
        <DSBottomNav active={screen} onNav={navigate} />
      </>
    );
  }

  if (screen === "real") {
    return (
      <>
        <RealTalkGrid onBack={goHome} />
        <DSBottomNav active="real" onNav={navigate} />
      </>
    );
  }

  return (
    <>
      <DSHomeScreen onNav={navigate} />
      <DSBottomNav active="home" onNav={navigate} />
    </>
  );
}

function DSHomeScreen({ onNav }) {
  return (
    <div style={{ minHeight: "calc(100vh - 68px)", background: "linear-gradient(160deg,#1A1208 0%,#3D2310 50%,#5C3D2E 100%)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 28px 32px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ position: "relative", maxWidth: 460 }}>
        <p style={{ fontFamily: "Cinzel, serif", fontSize: 14, letterSpacing: 4, textTransform: "uppercase", color: "#C9A84C", marginBottom: 8, animation: "fadeUp 0.7s 0.1s both", opacity: 0 }}>Leader's Guide</p>
        <p style={{ fontFamily: "Cinzel, serif", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#E8D196", marginBottom: 24, animation: "fadeUp 0.7s 0.2s both", opacity: 0 }}>by Ptr. Reynold Viernes</p>
        <h1 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "clamp(48px,10vw,80px)", lineHeight: 1.08, marginBottom: 32, animation: "fadeUp 0.7s 0.35s both", opacity: 0 }}>Disciple<span style={{ color: "#C9A84C", fontStyle: "italic" }}>sheep</span></h1>

        <div style={{ display: "grid", gap: 12, marginBottom: 24, animation: "fadeUp 0.7s 0.5s both", opacity: 0 }}>
          {[
            { id: "genz", label: "Gen Z · Ages 21–29",        sub: "Discovery & Dialogue · Book of Mark",          color: COLORS.genz.primary, emoji: "✨" },
            { id: "mill", label: "Millennials · Ages 30–44",  sub: "Life-Connect Method · Psalms & Proverbs",       color: COLORS.mill.primary, emoji: "🌿" },
            { id: "genx", label: "Gen X · Ages 45–51",        sub: "Wisdom & Legacy · Ecclesiastes & Job",          color: COLORS.genx.primary, emoji: "🪵" },
            { id: "real", label: "Real Talk · All Generations", sub: "12 Conversation Guides on Real-Life Issues", color: COLORS.real.primary, emoji: "💬" },
          ].map(g => (
            <button key={g.id} onClick={() => onNav(g.id)} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
              padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
              color: "white", textAlign: "left", transition: "all 0.2s", backdropFilter: "blur(8px)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = ""; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: g.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{g.emoji}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{g.label}</div>
                <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2, fontStyle: "italic" }}>{g.sub}</div>
              </div>
              <span style={{ marginLeft: "auto", opacity: 0.3 }}>→</span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, opacity: 0.35, letterSpacing: 1 }}>Discipleship Guide · Puerto Princesa City</p>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

function DSBottomNav({ active, onNav }) {
  const activeColor = (id) => {
    const map = { home: "#C9A84C", genz: COLORS.genz.primary, mill: COLORS.mill.primary, genx: COLORS.genx.primary, real: "#1F4E6B" };
    return map[id] || "#C9A84C";
  };
  return (
    <div style={{ position: "sticky", bottom: 0, background: "#FFFDF8", borderTop: "2px solid rgba(0,0,0,0.08)", boxShadow: "0 -2px 14px rgba(0,0,0,0.10)", zIndex: 200, display: "flex" }}>
      {DS_TABS.map(tab => (
        <button key={tab.id} onClick={() => onNav(tab.id)} style={{
          flex: 1, padding: "13px 8px 11px", border: "none", background: "transparent", cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
          color: active === tab.id ? activeColor(tab.id) : "#aaa",
          borderTop: `3px solid ${active === tab.id ? activeColor(tab.id) : "transparent"}`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all 0.22s",
        }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
          <span style={{ fontSize: 10, letterSpacing: 0.5 }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}