import type { KgNode, NodeType, Patient, RagAnswer } from "../../types";
import { thaiDate } from "../../lib/date";

// Retrieval over the Knowledge Graph: match the question to nodes (keywords, labels, node types), detect what is being
// asked (causes, effects, protective factors, progress, a session, a summary), walk the graph edges, and answer only
// from what was retrieved, citing nodes and transcript quotes. Answers are templated; a real backend would run this
// server-side (POST /patients/:id/kg/ask) and could hand the same retrieved nodes to an LLM to write freer prose.

const intents = {
  protective: ["ปัจจัยปกป้อง", "ปกป้อง", "อะไรช่วย", "ช่วยให้", "ช่วยลด", "จุดแข็ง", "แหล่งสนับสนุน", "ทรัพยากร"],
  cause: ["ตัวกระตุ้น", "กระตุ้น", "สาเหตุ", "ต้นเหตุ", "ทำไม", "เพราะอะไร", "มาจาก", "อะไรทำให้", "trigger"],
  effect: ["ส่งผล", "ผลกระทบ", "นำไปสู่", "ทำให้เกิด", "ผลที่ตามมา", "ผลต่อ", "กระทบ"],
  progress: ["ดีขึ้น", "แย่ลง", "เปลี่ยนแปลง", "เปลี่ยนไป", "ความก้าวหน้า", "พัฒนาการ", "แนวโน้ม", "ลดลง", "คะแนน", "ความรุนแรง", "progress"],
  latest: ["ล่าสุด", "ครั้งก่อน", "ครั้งที่แล้ว"],
  summary: ["สรุป", "ภาพรวม", "overview", "เล่าเคส"],
};

const typeWords: [string[], NodeType][] = [
  [["ความคิด", "ความเชื่อ", "แก่น"], "ความคิด"],
  [["อารมณ์", "ความรู้สึก"], "อารมณ์"],
  [["พฤติกรรม"], "พฤติกรรม"],
  [["อาการ"], "อาการ"],
  [["เหตุการณ์", "สถานการณ์"], "เหตุการณ์"],
  [["ปัจจัยปกป้อง"], "ปัจจัยปกป้อง"],
];

// Thai has no spaces between words, so matching works on substrings of the question with spaces and punctuation removed.
const compact = (text: string) => text.toLowerCase().replace(/[\s“”"'?!.,]/g, "");
const quoteLabel = (node: KgNode) => (node.label.startsWith("“") ? node.label : `“${node.label}”`);
const unique = <T>(items: T[]) => [...new Set(items)];
const lines = (...items: (string | false | 0 | undefined)[]) => items.filter((item): item is string => typeof item === "string");

function scoreNode(node: KgNode, question: string) {
  const keywordScore = node.keywords.reduce((sum, word) => (question.includes(compact(word)) ? sum + word.length : sum), 0);
  return keywordScore + (question.includes(compact(node.label)) ? 20 : 0);
}

export function askKg(patient: Patient, question: string): RagAnswer {
  const { nodes, edges, sessions, name, summary } = patient;
  if (!nodes.length) return { text: `ยังไม่มี Knowledge Graph ของ${name} จึงยังค้นหาคำตอบไม่ได้`, bullets: ["อัปโหลด Transcript หลังการพูดคุย ระบบจะสร้างแผนผังความเข้าใจและใช้ตอบคำถามได้"], evidence: [], sources: [], meta: "ไม่มีข้อมูลใน Knowledge Graph" };

  const q = compact(question);
  const has = (words: string[]) => words.some((word) => q.includes(compact(word)));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const parents = (node: KgNode) => edges.filter(([, to]) => to === node.id).flatMap(([from]) => byId.get(from) ?? []);
  const children = (node: KgNode) => edges.filter(([from]) => from === node.id).flatMap(([, to]) => byId.get(to) ?? []);
  const isHelper = (node: KgNode) => node.type === "ปัจจัยปกป้อง";
  // Answers quote the graph as triples: "source —relation→ target".
  const relation = (from: KgNode, to: KgNode) => edges.find(([a, b]) => a === from.id && b === to.id)?.[2] ?? "";
  const triple = (from: KgNode, to: KgNode) => `${from.label} —${relation(from, to)}→ ${to.label}`;
  const chainText = (chain: KgNode[]) => chain.map((node, index) => (index ? ` —${relation(chain[index - 1], node)}→ ${node.label}` : node.label)).join("");
  const latest = sessions[sessions.length - 1];
  const typed = typeWords.filter(([words]) => has(words)).map(([, type]) => type);
  const ranked = nodes.map((node) => ({ node, score: scoreNode(node, q) + (typed.includes(node.type) ? 3 : 0) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  const focus = ranked.filter((item) => item.score >= ranked[0].score / 2).slice(0, 3).map((item) => item.node);

  const chainsInto = (target: KgNode) => {
    const found: KgNode[][] = [];
    const walk = (chain: KgNode[]) => {
      const next = parents(chain[0]).filter((node) => !isHelper(node) && !chain.includes(node));
      if (!next.length || chain.length > 4) { if (chain.length > 1) found.push(chain); return; }
      next.forEach((node) => walk([node, ...chain]));
    };
    walk([target]);
    return found;
  };
  const chainsFrom = (start: KgNode) => {
    const found: KgNode[][] = [];
    const walk = (chain: KgNode[]) => {
      const next = children(chain[chain.length - 1]).filter((node) => !chain.includes(node));
      if (!next.length || chain.length > 4) { if (chain.length > 1) found.push(chain); return; }
      next.forEach((node) => walk([...chain, node]));
    };
    walk([start]);
    return found;
  };
  const answer = (text: string, bullets: string[], cited: KgNode[], evidence: KgNode[] = cited): RagAnswer => {
    const sources = unique(cited).map((node) => node.id);
    const quotes = unique(evidence).slice(0, 3);
    const sessionCount = unique(quotes.map((node) => node.session)).length;
    return { text, bullets, evidence: quotes, sources, meta: `ค้นจาก ${nodes.length} โหนด · อ้างอิง ${sources.length} โหนด${sessionCount ? ` จาก ${sessionCount} Session` : ""}` };
  };

  if (has(intents.protective)) {
    const helpers = nodes.filter(isHelper);
    if (!helpers.length) return answer(`ยังไม่พบปัจจัยปกป้องใน Knowledge Graph ของ${name}`, ["ลองสอบถามแหล่งสนับสนุน เช่น ครอบครัว เพื่อน หรือกิจกรรมที่ช่วยให้รู้สึกดีขึ้นใน Session ถัดไป"], []);
    return answer(
      `ปัจจัยปกป้องของ${name}ที่พบใน Knowledge Graph มี ${helpers.length} อย่าง`,
      lines(...helpers.flatMap((node) => (children(node).length ? children(node).map((child) => triple(node, child)) : [node.label])), summary && `ภาพรวม: ${summary.protective} — ${summary.protectiveNote}`),
      [...helpers, ...helpers.flatMap(children)], helpers);
  }

  if (has(intents.cause)) {
    const target = focus.find((node) => node.type !== "เหตุการณ์" && !isHelper(node));
    if (!target) {
      const triggers = nodes.filter((node) => node.type === "เหตุการณ์");
      return answer(
        `ตัวกระตุ้นใน Knowledge Graph ของ${name} มี ${triggers.length} เหตุการณ์`,
        triggers.flatMap((node) => children(node).map((child) => `${triple(node, child)}${node.since > 1 ? ` (พบใหม่ใน Session ${node.since})` : ""}`)),
        [...triggers, ...triggers.flatMap(children)], triggers);
    }
    const chains = chainsInto(target);
    const helpers = parents(target).filter(isHelper);
    if (!chains.length) return answer(`ยังไม่พบต้นเหตุของ ${quoteLabel(target)} ใน Knowledge Graph`, [`${target.label} เป็น${target.category} พบตั้งแต่ Session ${target.since}`], [target]);
    return answer(
      `${quoteLabel(target)} มีต้นทางจาก ${chains.length} เส้นทางใน Knowledge Graph`,
      lines(...chains.map((chain) => chainText(chain) + (chain[0].since > 1 ? ` (เริ่มพบใน Session ${chain[0].since})` : "")), ...helpers.map((node) => triple(node, target))),
      [...chains.flat(), ...helpers], [...chains.map((chain) => chain[0]), target, ...chains.flat()]);
  }

  if (has(intents.effect)) {
    const start = focus[0] ?? nodes.find((node) => node.type === "เหตุการณ์") ?? nodes[0];
    const chains = chainsFrom(start);
    if (!chains.length) return answer(`ยังไม่พบผลที่ตามมาของ ${quoteLabel(start)} ใน Knowledge Graph`, [`${start.label} เป็น${start.category} พบตั้งแต่ Session ${start.since}`], [start]);
    return answer(`${quoteLabel(start)} ส่งผลต่อเนื่องใน ${chains.length} เส้นทาง`, chains.map(chainText), chains.flat(), [start, ...chains.map((chain) => chain[chain.length - 1])]);
  }

  if (has(intents.progress)) {
    const first = sessions[0];
    const scored = (focus.some((node) => node.score) ? focus : nodes).filter((node) => node.score);
    const delta = first.severity - latest.severity;
    const trend = delta > 0 ? `มีแนวโน้มดีขึ้น ความรุนแรงลดลงจาก ${first.severity}/5 เหลือ ${latest.severity}/5` : delta < 0 ? `มีแนวโน้มแย่ลง ความรุนแรงเพิ่มจาก ${first.severity}/5 เป็น ${latest.severity}/5` : `ความรุนแรงคงที่ที่ ${latest.severity}/5`;
    return answer(
      `ตลอด ${sessions.length} Session ${name}${trend}`,
      [`ความรุนแรงรายครั้ง: ${sessions.map((session) => `S${session.number} ${session.severity}/5`).join(" → ")}`, ...scored.map((node) => `${node.label}: ${node.score}`)],
      scored, [...scored.filter((node) => node.session === latest.number), ...scored]);
  }

  const sessionNo = Number(q.match(/(?:session|เซสชัน|เซสชั่น|ครั้งที่)(\d+)/)?.[1] ?? 0) || (has(intents.latest) ? latest.number : 0);
  if (sessionNo) {
    const record = sessions.find((session) => session.number === sessionNo);
    if (!record) return answer(`ไม่พบ Session ${sessionNo} — ${name}มีทั้งหมด ${sessions.length} Session`, [], []);
    const related = nodes.filter((node) => node.session === sessionNo || node.since === sessionNo);
    const fresh = nodes.filter((node) => node.since === sessionNo && sessionNo > 1);
    return answer(
      `Session ${sessionNo} (${thaiDate(record.date)}): ${record.summary}`,
      lines(`ความรุนแรง ${record.severity}/5`, record.insight, fresh.length > 0 && `ประเด็นใหม่: ${fresh.map((node) => node.label).join(", ")}`),
      related, related.filter((node) => node.session === sessionNo));
  }

  if (has(intents.summary)) {
    const loop = nodes.filter((node) => node.type === "เหตุการณ์").flatMap(chainsFrom).sort((a, b) => b.length - a.length)[0] ?? [];
    const helpers = nodes.filter(isHelper);
    return answer(
      `สรุปเคส${name} จาก ${sessions.length} Session และ ${nodes.length} ประเด็นใน Knowledge Graph`,
      lines(
        summary && `อาการหลัก: ${summary.symptom} (ความรุนแรงล่าสุด ${latest.severity}/5)`,
        summary && `แก่นความเชื่อ: ${summary.belief} — ${summary.beliefNote}`,
        loop.length > 0 && `วงจรหลัก: ${chainText(loop)}`,
        helpers.length > 0 && `ปัจจัยปกป้อง: ${helpers.map((node) => node.label).join(", ")}`,
        `ล่าสุด Session ${latest.number}: ${latest.summary}`,
      ),
      [...loop, ...helpers], nodes.filter((node) => node.session === latest.number));
  }

  const target = focus[0];
  if (target) {
    const causes = parents(target).filter((node) => !isHelper(node));
    const effects = children(target);
    const helpers = parents(target).filter(isHelper);
    return answer(
      `${quoteLabel(target)} เป็น${target.category} พบตั้งแต่ Session ${target.since}`,
      lines(
        ...causes.map((node) => triple(node, target)),
        ...effects.map((node) => triple(target, node)),
        ...helpers.map((node) => triple(node, target)),
        target.score && `แนวโน้มล่าสุด: ${target.score}`,
        ...focus.slice(1).map((node) => `เกี่ยวข้อง: ${node.label} (${node.type})`),
      ),
      [target, ...causes, ...effects, ...helpers, ...focus.slice(1)], focus);
  }

  return {
    text: `ไม่พบข้อมูลที่ตรงกับคำถามนี้ใน Knowledge Graph ของ${name}`,
    bullets: [`ลองระบุประเด็นในแผนผัง เช่น ${nodes.slice(0, 3).map(quoteLabel).join(", ")}`, "หรือถามเรื่องตัวกระตุ้น ปัจจัยปกป้อง ความเปลี่ยนแปลง หรือสรุปราย Session"],
    evidence: [], sources: [], meta: `ค้นจาก ${nodes.length} โหนด · ไม่พบข้อมูลที่เกี่ยวข้อง`,
  };
}
