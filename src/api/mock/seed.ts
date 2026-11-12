// Demo data for the mock backend. Everything is fictional; a real backend replaces all of it.
import { patients } from "../../config";
import { addDays, iso, nowTime } from "../../lib/date";
import { initials } from "../../lib/labels";
import type { Appointment, Highlights, MoodLog, Note, Patient, PatientMessage } from "../../types";

/** This patient's app ships with a sample chat, mood log and highlights; other accounts start empty. */
export const DEMO_HISTORY_PATIENT_ID = "a";

export const seedPatients: Patient[] = [
  {
    id: "a", name: patients.a.name, initials: initials(patients.a.name), age: 29, occupation: "พนักงานบริษัท", hn: "HN-240038", status: "ควรติดตาม", color: "coral", email: patients.a.email,
    askExample: `อะไรเป็นตัวกระตุ้นความกังวลของ${patients.a.name}?`,
    summary: { symptom: "ความกังวล & นอนไม่หลับ", belief: "“ฉันไม่เก่งพอ”", beliefNote: "สัมพันธ์กับการถูกวิจารณ์", protective: "พี่สาว & การออกกำลังกาย", protectiveNote: "ช่วยลดความกังวลได้ดี" },
    sessions: [
      { number: 1, date: "2026-08-04", duration: 50, summary: "ถูกตำหนิต่อหน้าทีม · นอนไม่หลับ · อยากลาออก", insight: "Session แรก: เห็นวงจรความกังวลและการทำงานหนักชัดเจน" },
      { number: 2, date: "2026-08-18", duration: 50, summary: "เริ่มวิ่งตอนเช้า · เห็นความเชื่อมโยงระหว่างพ่อและหัวหน้า", insight: "Session 2: เริ่มพบปัจจัยจากครอบครัวและทรัพยากรที่ช่วยให้อาการดีขึ้น" },
      { number: 3, date: "2026-09-01", duration: 55, summary: "คุยกับหัวหน้าแล้ว · ทำงานดึกลดลง · ได้โปรเจกต์ใหม่", insight: "Session 3: ความกังวลลดลง และมีโปรเจกต์ใหม่เป็นตัวกระตุ้นล่าสุด" },
    ],
    nodes: [
      { id: "criticized", col: 0, row: 0, label: "ถูกตำหนิต่อหน้าทีม", type: "เหตุการณ์", since: 1, category: "เหตุการณ์กระตุ้น", quote: "“วันนั้นหัวหน้าพูดต่อหน้าทุกคนว่างานเราใช้ไม่ได้ ตั้งแต่นั้นก็นอนไม่ค่อยหลับ”", session: 1, time: "04:12", keywords: ["ตำหนิ", "หัวหน้า", "วิจารณ์", "ต่อหน้าทีม", "ถูกว่า", "ที่ทำงาน"] },
      { id: "project", col: 0, row: 2, label: "ได้โปรเจกต์ใหม่", type: "เหตุการณ์", since: 3, category: "เหตุการณ์ใหม่", quote: "“อาทิตย์นี้ได้โปรเจกต์ใหม่ ต้องพรีเซนต์ผู้บริหารเดือนหน้า”", session: 3, time: "02:30", keywords: ["โปรเจกต์", "โปรเจค", "พรีเซนต์", "นำเสนอ", "ผู้บริหาร", "งานใหม่"] },
      { id: "notgood", col: 1, row: 0, label: "“ฉันไม่เก่งพอ”", type: "ความคิด", since: 1, category: "ความเชื่อเกี่ยวกับตนเอง", quote: "“ลึก ๆ คิดว่าตัวเองไม่เก่งพอสำหรับตำแหน่งนี้”", session: 1, time: "11:02", score: "ความเชื่อลดลง 5 → 3", keywords: ["ไม่เก่ง", "เก่งพอ", "คุณค่า", "มั่นใจ", "ตัวเอง"] },
      { id: "anxious", col: 1, row: 1, label: "กังวลว่าจะพลาด", type: "อารมณ์", since: 1, category: "อารมณ์", quote: "“ยังกังวลเรื่องพรีเซนต์อยู่ แต่ไม่ถึงขั้นนอนไม่หลับแล้ว”", session: 3, time: "04:10", keywords: ["กังวล", "วิตก", "พลาด", "กลัว", "เครียด"] },
      { id: "avoid", col: 2, row: 0, label: "ไม่กล้าถามหัวหน้า", type: "พฤติกรรม", since: 1, category: "พฤติกรรมหลีกเลี่ยง", quote: "“ขอคุยแบบตัวต่อตัวแล้วค่ะ ตื่นเต้นมากแต่ก็ทำได้”", session: 3, time: "06:20", score: "ดีขึ้นจากครั้งก่อน", keywords: ["ไม่กล้า", "หลีกเลี่ยง", "ถามหัวหน้า", "เลี่ยง"] },
      { id: "overwork", col: 2, row: 1, label: "ทำงานถึงตีสอง", type: "พฤติกรรม", since: 1, category: "พฤติกรรมชดเชย", quote: "“อาทิตย์นี้เลิกงานก่อนสี่ทุ่มได้สามวัน”", session: 3, time: "12:05", score: "ความถี่ลดลง 5 → 2", keywords: ["ทำงานหนัก", "ทำงานดึก", "ตีสอง", "ดึก", "เลิกงาน", "โอที"] },
      { id: "sleep", col: 3, row: 2, label: "นอนไม่หลับ", type: "อาการ", since: 1, category: "อาการหลัก", quote: "วันที่ได้วิ่งตอนเช้า คืนนั้นหลับง่ายขึ้น", session: 2, time: "02:10", keywords: ["นอนไม่หลับ", "นอน", "หลับ", "วิ่ง", "ออกกำลัง"] },
      { id: "sister", col: 1, row: 2, label: "พี่สาวรับฟัง", type: "ปัจจัยปกป้อง", since: 1, category: "ปัจจัยปกป้อง", quote: "คุยกับพี่สาวแล้วความอายและความกังวลเบาลง", session: 1, time: "21:45", keywords: ["พี่สาว", "ครอบครัว", "รับฟัง", "คนสนิท"] },
    ],
    edges: [["criticized", "notgood", "กระตุ้น"], ["project", "anxious", "กระตุ้น"], ["notgood", "avoid", "นำไปสู่"], ["notgood", "anxious", "ทำให้รู้สึก"], ["anxious", "overwork", "ชดเชยด้วย"], ["overwork", "sleep", "ส่งผลให้"], ["sister", "anxious", "ช่วยลด"]],
  },
  {
    id: "chin", name: patients.chin.name, initials: initials(patients.chin.name), age: 34, occupation: "ครูประถม", hn: "HN-240021", status: "ปกติ", color: "mint", email: patients.chin.email,
    askExample: `อะไรทำให้${patients.chin.name}หงุดหงิดง่าย?`,
    summary: { symptom: "อ่อนเพลีย & หงุดหงิดง่าย", belief: "“ต้องดูแลพ่อให้ดีกว่านี้”", beliefNote: "ความรู้สึกผิดในบทบาทผู้ดูแล", protective: "น้องชายช่วยแบ่งเวร", protectiveNote: "ได้พักผ่อนสม่ำเสมอขึ้น" },
    sessions: [
      { number: 1, date: "2026-07-07", duration: 50, summary: "พ่อเริ่มจำคนในบ้านไม่ได้ · รู้สึกผิดที่ไม่มีเวลาให้", insight: "Session แรก: ภาระการดูแลพ่อเชื่อมกับความรู้สึกผิดและความเหนื่อยล้า" },
      { number: 2, date: "2026-07-21", duration: 50, summary: "หงุดหงิดกับนักเรียน · ปฏิเสธนัดเพื่อนบ่อยขึ้น", insight: "Session 2: ความหงุดหงิดเริ่มส่งผลต่องานและความสัมพันธ์" },
      { number: 3, date: "2026-08-04", duration: 50, summary: "ฝึกขอความช่วยเหลือ · คุยกับน้องชายเรื่องแบ่งเวร", insight: "Session 3: เริ่มเปิดใจขอความช่วยเหลือจากครอบครัว" },
      { number: 4, date: "2026-08-18", duration: 45, summary: "น้องชายรับเวรสุดสัปดาห์ · นอนได้คืนละ 6 ชั่วโมง", insight: "Session 4: มีคนช่วยแบ่งเวร ทำให้ได้พักผ่อนมากขึ้น" },
    ],
    nodes: [
      { id: "father", col: 0, row: 0, label: "พ่อป่วยสมองเสื่อม", type: "เหตุการณ์", since: 1, category: "สถานการณ์ต่อเนื่อง", quote: "“ช่วงนี้พ่อเริ่มจำหน้าหนูไม่ได้แล้ว บางวันก็ถามหาแม่ที่เสียไปแล้ว”", session: 1, time: "03:40", keywords: ["พ่อ", "สมองเสื่อม", "ป่วย", "ผู้ดูแล"] },
      { id: "nightcare", col: 0, row: 2, label: "ตื่นดูแลพ่อกลางดึก", type: "เหตุการณ์", since: 1, category: "ภาระการดูแล", quote: "“พ่อตื่นตอนตีสามเกือบทุกคืน ต้องลุกไปดูตลอด”", session: 1, time: "08:15", keywords: ["กลางดึก", "ตื่น", "กลางคืน", "เวร"] },
      { id: "guilt", col: 1, row: 0, label: "“ต้องดูแลพ่อให้ดีกว่านี้”", type: "ความคิด", since: 1, category: "ความรู้สึกผิด", quote: "“ถ้าหนูดูแลดีกว่านี้ พ่อคงไม่แย่ลงเร็วขนาดนี้”", session: 1, time: "14:22", score: "ความเชื่อลดลง 5 → 3", keywords: ["รู้สึกผิด", "ผิด", "ดีกว่านี้", "ดูแลพ่อ"] },
      { id: "irritable", col: 1, row: 1, label: "หงุดหงิดง่าย", type: "อารมณ์", since: 1, category: "อารมณ์", quote: "“เดี๋ยวนี้ใครพูดอะไรนิดหน่อยก็หงุดหงิด เผลอขึ้นเสียงกับนักเรียน”", session: 2, time: "05:10", keywords: ["หงุดหงิด", "โกรธ", "อารมณ์เสีย", "ขึ้นเสียง", "นักเรียน"] },
      { id: "withdraw", col: 2, row: 1, label: "ปฏิเสธนัดเพื่อน", type: "พฤติกรรม", since: 2, category: "การแยกตัว", quote: "“เพื่อนชวนไปไหนก็ไม่ไป รู้สึกว่าไม่มีสิทธิ์ไปสนุก”", session: 2, time: "11:30", keywords: ["เพื่อน", "แยกตัว", "ปฏิเสธ", "เก็บตัว"] },
      { id: "overload", col: 2, row: 0, label: "ทำทุกอย่างเองจนดึก", type: "พฤติกรรม", since: 1, category: "พฤติกรรมชดเชย", quote: "“ไม่อยากรบกวนใคร เลยทำเองหมดทั้งงานบ้านทั้งตรวจการบ้านนักเรียน”", session: 1, time: "18:05", score: "ลดลงหลังแบ่งเวร", keywords: ["ทำเอง", "ทำทุกอย่าง", "งานบ้าน", "ดึก"] },
      { id: "fatigue", col: 3, row: 1, label: "อ่อนเพลียเรื้อรัง", type: "อาการ", since: 1, category: "อาการหลัก", quote: "“อาทิตย์นี้นอนได้คืนละหกชั่วโมง ตื่นมาไม่ปวดหัวแล้ว”", session: 4, time: "02:45", keywords: ["อ่อนเพลีย", "เหนื่อย", "ล้า", "นอน", "ปวดหัว"] },
      { id: "brother", col: 1, row: 2, label: "น้องชายช่วยแบ่งเวร", type: "ปัจจัยปกป้อง", since: 3, category: "ปัจจัยปกป้อง", quote: "“น้องชายรับเวรเสาร์อาทิตย์ให้ ได้ออกไปกินข้าวกับเพื่อนครั้งแรกในรอบหลายเดือน”", session: 4, time: "06:30", keywords: ["น้องชาย", "ครอบครัว", "แบ่งเวร"] },
    ],
    edges: [["father", "guilt", "กระตุ้น"], ["nightcare", "irritable", "ทำให้"], ["guilt", "overload", "นำไปสู่"], ["irritable", "withdraw", "ทำให้เลี่ยง"], ["overload", "fatigue", "ส่งผลให้"], ["brother", "irritable", "ช่วยลด"]],
  },
  {
    id: "non", name: patients.non.name, initials: initials(patients.non.name), age: 25, occupation: "นักศึกษาปริญญาโท", hn: "HN-240045", status: "ปกติ", color: "blue", email: patients.non.email,
    askExample: `อะไรช่วยลดอาการแพนิกของ${patients.non.name}?`,
    summary: { symptom: "แพนิก & ใจสั่น", belief: "“ใจสั่นแบบนี้ต้องเป็นอะไรแน่”", beliefNote: "ตีความอาการทางกายว่าอันตราย", protective: "การฝึกหายใจ", protectiveNote: "ช่วยให้อาการสงบเร็วขึ้น" },
    sessions: [
      { number: 1, date: "2026-08-12", duration: 50, summary: "แพนิกบนรถไฟฟ้า 2 ครั้ง · กลัวว่าเป็นโรคหัวใจ", insight: "Session แรก: การตีความอาการทางกายกระตุ้นวงจรแพนิก" },
      { number: 2, date: "2026-08-26", duration: 50, summary: "ผลตรวจหัวใจปกติ · เริ่มฝึกหายใจ 4-7-8", insight: "Session 2: เริ่มมีเครื่องมือรับมือ และเข้าใจว่าอาการไม่อันตราย" },
    ],
    nodes: [
      { id: "crowd", col: 0, row: 0, label: "รถไฟฟ้าแออัด", type: "เหตุการณ์", since: 1, category: "สถานการณ์กระตุ้น", quote: "“พอคนเบียดเยอะ ๆ ประตูปิด ใจก็เริ่มเต้นแรงทันที”", session: 1, time: "03:15", keywords: ["รถไฟฟ้า", "แออัด", "คนเยอะ", "เดินทาง"] },
      { id: "deadline", col: 0, row: 2, label: "ใกล้ส่งวิทยานิพนธ์", type: "เหตุการณ์", since: 1, category: "ความกดดัน", quote: "“อีกสองเดือนต้องส่งเล่ม แต่บทที่สามยังไม่เริ่มเลย”", session: 1, time: "16:40", keywords: ["วิทยานิพนธ์", "ธีสิส", "เดดไลน์", "ส่งงาน", "เรียน"] },
      { id: "danger", col: 1, row: 0, label: "“ใจสั่นแบบนี้ต้องเป็นอะไรแน่”", type: "ความคิด", since: 1, category: "การตีความอาการผิดพลาด", quote: "“ตอนนั้นคิดว่าหัวใจวายแน่ ๆ จะตายบนรถไฟฟ้า”", session: 1, time: "05:02", score: "ความเชื่อลดลง 5 → 2", keywords: ["หัวใจ", "ตาย", "อันตราย", "โรค"] },
      { id: "panic", col: 1, row: 1, label: "ตื่นตระหนก", type: "อารมณ์", since: 1, category: "อารมณ์", quote: "“ครั้งล่าสุดยังตกใจอยู่ แต่รู้ว่าเดี๋ยวมันจะผ่านไป”", session: 2, time: "07:20", keywords: ["แพนิก", "ตื่นตระหนก", "ตกใจ", "กลัว"] },
      { id: "avoidtrain", col: 2, row: 0, label: "เลี่ยงขึ้นรถไฟฟ้า", type: "พฤติกรรม", since: 1, category: "พฤติกรรมหลีกเลี่ยง", quote: "“ตอนนี้นั่งแท็กซี่ไปมหาลัยทุกวัน เสียเงินเยอะมาก”", session: 1, time: "09:48", keywords: ["เลี่ยง", "หลีกเลี่ยง", "แท็กซี่", "ไม่กล้า"] },
      { id: "allnighter", col: 2, row: 2, label: "ปั่นงานถึงเช้า", type: "พฤติกรรม", since: 1, category: "พฤติกรรมชดเชย", quote: "“ดื่มกาแฟสี่แก้วแล้วนั่งทำงานถึงหกโมงเช้า”", session: 1, time: "18:30", score: "ความถี่ 4 คืน/สัปดาห์", keywords: ["ปั่นงาน", "อดนอน", "กาแฟ", "ดึก"] },
      { id: "palpitation", col: 3, row: 1, label: "ใจสั่น หายใจไม่อิ่ม", type: "อาการ", since: 1, category: "อาการหลัก", quote: "“หมอบอกว่าหัวใจปกติดี แต่ใจสั่นบ่อยตอนดื่มกาแฟเยอะ”", session: 2, time: "03:05", keywords: ["ใจสั่น", "หายใจไม่อิ่ม", "แน่นหน้าอก"] },
      { id: "breathing", col: 2, row: 1, label: "ฝึกหายใจ 4-7-8", type: "ปัจจัยปกป้อง", since: 2, category: "ปัจจัยปกป้อง", quote: "“ลองหายใจ 4-7-8 ตอนรอรถไฟฟ้า ใจเย็นลงภายในสองนาที”", session: 2, time: "12:10", keywords: ["ฝึกหายใจ", "หายใจ", "ผ่อนคลาย", "รับมือ"] },
    ],
    edges: [["crowd", "danger", "กระตุ้น"], ["danger", "panic", "ทำให้"], ["danger", "avoidtrain", "นำไปสู่"], ["deadline", "allnighter", "กดดันให้"], ["allnighter", "palpitation", "ส่งผลให้"], ["breathing", "panic", "ช่วยลด"]],
  },
  { id: "pim", name: patients.pim.name, initials: initials(patients.pim.name), age: 41, occupation: "เจ้าของร้านอาหาร", hn: "HN-240052", status: "นัดหมายใหม่", color: "purple", email: patients.pim.email, sessions: [], nodes: [], edges: [] },
];

export function seedAppointments(today: Date): Appointment[] {
  const day = (offset: number) => iso(addDays(today, offset));
  return [
    { id: "ap-1", patientId: "chin", date: day(0), time: "14:00", mode: "ที่คลินิก", note: "Session 5 · ติดตามการแบ่งเวรดูแลพ่อ" },
    { id: "ap-2", patientId: "non", date: day(1), time: "16:00", mode: "ออนไลน์", note: "Session 3 · ทบทวนการฝึกหายใจ" },
    { id: "ap-3", patientId: "pim", date: day(2), time: "09:30", mode: "ที่คลินิก", note: "นัดครั้งแรก · ประเมินเบื้องต้น" },
    { id: "ap-4", patientId: "a", date: day(5), time: "10:30", mode: "ที่คลินิก", note: "Session 4 · เตรียมพรีเซนต์โปรเจกต์ใหม่" },
  ];
}

export const seedNotes = (): Record<string, Note[]> => ({
  a: [
    { id: "n-2", date: "2026-09-01", text: "เป้าหมายครั้งหน้า: เตรียมพรีเซนต์โปรเจกต์ใหม่ และฝึกปรับความคิด “ฉันไม่เก่งพอ” ด้วย thought record" },
    { id: "n-1", date: "2026-08-18", text: "เริ่มวิ่งตอนเช้า 3 วัน/สัปดาห์ สังเกตว่านอนหลับง่ายขึ้นในวันที่ได้วิ่ง" },
  ],
  chin: [{ id: "n-3", date: "2026-08-18", text: "ติดตามการแบ่งเวรกับน้องชาย และชวนกลับไปทำกิจกรรมที่ชอบสัปดาห์ละครั้ง" }],
});

// Mood check-ins for the demo patient: 4 of the last 7 days, about 18% better than the week before.
export function seedMoods(today: Date): MoodLog {
  const entries: [number, number][] = [[-13, 3], [-12, 3], [-11, 4], [-9, 3], [-8, 3], [-7, 3], [-6, 3], [-5, 4], [-3, 4], [-1, 4]];
  return Object.fromEntries(entries.map(([offset, score]) => [iso(addDays(today, offset)), score]));
}

export const greeting = (name: string) => `สวัสดีค่ะ${name} วันนี้เป็นอย่างไรบ้าง? เล่าให้เราฟังได้เต็มที่เลยนะคะ`;

export function seedChat(name: string, demo: boolean): PatientMessage[] {
  const date = iso(new Date());
  if (!demo) return [{ from: "bot", text: greeting(name), date, time: nowTime() }];
  return [
    { from: "bot", text: greeting(name), date, time: "14:20" },
    { from: "user", text: "วันนี้ได้พรีเซนต์งานค่ะ ตอนแรกกังวลมาก แต่สุดท้ายก็ผ่านไปได้ดี", date, time: "14:20" },
    { from: "bot", text: "ขอบคุณที่เล่าให้ฟังนะคะ ฟังดูเหมือนคุณจะรับมือกับความกังวลได้ดีขึ้น ระหว่างพรีเซนต์ ความกังวลอยู่ที่ระดับไหนจาก 1–5 คะ?", date, time: "14:21" },
  ];
}

export const demoHighlights: Highlights = {
  text: "คุณออกกำลังกาย 3 วัน และเลิกงานก่อน 4 ทุ่มได้ตามเป้าหมาย",
  items: [
    { icon: "activity", label: "ออกกำลังกาย", value: "3 วัน" },
    { icon: "clock", label: "เข้านอนเร็วขึ้น", value: "2 ชม." },
  ],
};
