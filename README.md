# MindLink

ต้นแบบเว็บแอปสำหรับนักจิตวิทยาและผู้เข้ารับคำปรึกษา: Knowledge Graph จาก Transcript, แชทค้นหาข้อมูลจาก KG (RAG) และแอปบันทึกอาการของผู้เข้ารับคำปรึกษา

> ค่าเริ่มต้นยังไม่ต่อ backend: แอปใช้ mock ที่เก็บข้อมูลสมมติไว้ในเบราว์เซอร์ (localStorage) ห้ามใช้กับข้อมูลผู้ป่วยจริง ถ้าจะต่อ server จริง ดูหัวข้อ [ต่อ backend](#ต่อ-backend)

## เปิดด้วย Docker

ต้องมี Docker Desktop (หรือ Docker Engine) ที่เปิดอยู่

```bash
docker compose up --build
```

แล้วเปิด http://localhost:8090

> Docker เสิร์ฟเว็บที่ build เสร็จแล้ว (ไฟล์นิ่ง) จึงไม่อัปเดตตามโค้ด แก้อะไรแล้วต้องรัน `docker compose up --build` ใหม่ทุกครั้ง ระหว่างแก้งานให้ใช้ [รันแบบพัฒนา](#รันแบบพัฒนา) ที่อัปเดตทันที

ถ้าพอร์ต 8090 ถูกโปรแกรมอื่นใช้อยู่ ให้เลือกพอร์ตอื่นผ่าน `MINDFLOW_PORT`:

```bash
MINDFLOW_PORT=3000 docker compose up --build          # bash / macOS / Linux
$env:MINDFLOW_PORT=3000; docker compose up --build    # PowerShell
```

ถ้าไม่ใช้ compose:

```bash
docker build -t mindlink .
docker run --rm -p 8090:80 mindlink
```

## Deploy บน GitHub Pages

มี workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) ที่ build และขึ้นเว็บให้อัตโนมัติทุกครั้งที่ push เข้า `main`

ทำครั้งแรกครั้งเดียว:

1. สร้าง repository เปล่าบน GitHub (ไม่ต้องให้ GitHub สร้าง README หรือ .gitignore ให้) ถ้าเป็นบัญชีฟรีต้องตั้งเป็น **public** เพราะ GitHub Pages ของ repo แบบ private ต้องใช้แพ็กเกจเสียเงิน
2. push โค้ดขึ้นไป

   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

3. ใน repo ไปที่ **Settings → Pages → Build and deployment → Source** เลือก **GitHub Actions**
4. ไปที่แท็บ **Actions → Deploy to GitHub Pages → Run workflow** (รอบที่รันเองตอน push อาจ fail เพราะยังไม่ได้ตั้งข้อ 3) เสร็จแล้วเว็บอยู่ที่ `https://<user>.github.io/<repo>/`

หลังจากนั้น push เข้า `main` เมื่อไหร่ เว็บอัปเดตเองภายในไม่กี่นาที

ข้อควรรู้:

- เว็บบน Pages ใช้บัญชีทดลองจาก `.env.example` ไม่ใช่ `.env` ในเครื่อง (`.env` ไม่ถูก commit) และใครเปิดเว็บก็อ่านค่าเหล่านี้ได้
- เป็นโหมด mock: ข้อมูลที่เพิ่มระหว่างใช้งานเก็บอยู่ในเบราว์เซอร์ของแต่ละคน คนอื่นไม่เห็น ห้ามใส่ข้อมูลผู้ป่วยจริง
- หน้าเว็บตั้ง `noindex` ไว้ Google จะไม่เก็บเข้าผลค้นหา แต่ใครมีลิงก์ก็เปิดได้
- path ของเว็บ (`/<repo>/`) ตั้งให้อัตโนมัติจากชื่อ repo เปลี่ยนชื่อ repo ได้โดยไม่ต้องแก้โค้ด

## รันแบบพัฒนา

ต้องมี Node 22 ขึ้นไป และ pnpm 10

```bash
cp .env.example .env   # ถ้ายังไม่มีไฟล์ .env
pnpm install
pnpm dev               # http://localhost:8443
```

แก้ไฟล์ใน `src/` แล้วกดบันทึก หน้าเว็บจะอัปเดตเองทันทีโดยไม่ต้อง build ส่วนการแก้ `.env` dev server จะรีสตาร์ทตัวเอง กด refresh หน้าเว็บหนึ่งครั้ง

ถ้าเครื่องไม่มี pnpm ใช้ npm เรียกคำสั่งเดียวกันได้: `npm run dev`, `npm run build`, `npm run typecheck` ถ้ายังไม่มีโฟลเดอร์ `node_modules` ให้ติดตั้งด้วย `npx pnpm@10 install` (ไม่ต้องลง pnpm ถาวร) อย่าใช้ `npm install` เพราะจะไม่ได้เวอร์ชันตาม `pnpm-lock.yaml`

คำสั่งอื่น: `pnpm typecheck` (ตรวจ type), `pnpm build` (build ลง `dist/`), `pnpm preview` (เปิดดูผล build)

## บัญชีทดลอง (โหมด mock)

อีเมลและรหัสผ่านของบัญชีทดลองอยู่ในไฟล์ `.env` (แม่แบบคือ [`.env.example`](.env.example)) ค่าเริ่มต้นคือ:

| บทบาท | อีเมล | รหัสผ่าน |
|---|---|---|
| นักจิตวิทยา (ดร. มนัสวี) | `manatsawee@mindflow.demo` | `mindflow` |
| ผู้เข้ารับคำปรึกษา (คุณเอ) | `khun.a@mindflow.demo` | `mindflow` |
| ผู้เข้ารับคำปรึกษา (คุณชิน) | `khun.chin@mindflow.demo` | `mindflow` |
| ผู้เข้ารับคำปรึกษา (คุณนนท์) | `khun.non@mindflow.demo` | `mindflow` |
| ผู้เข้ารับคำปรึกษา (คุณพิม) | `khun.pim@mindflow.demo` | `mindflow` |

คุณเอมีประวัติแชทและบันทึกอารมณ์ตัวอย่างอยู่แล้ว คนอื่นเริ่มจากหน้าว่าง หน้า login มีปุ่ม "บัญชีทดลอง" ให้กดกรอกอัตโนมัติ แต่ละบัญชีเห็นเฉพาะฝั่งของตัวเอง

> ค่าใน `.env` ที่ขึ้นต้นด้วย `VITE_` จะถูกฝังลงในเว็บตอน build ใครเปิดเว็บก็ดูได้ ใช้เฉพาะรหัสสำหรับสาธิต ห้ามใส่รหัสผ่านจริง

ข้อมูลที่เพิ่มระหว่างสาธิตจะค้างอยู่ในเบราว์เซอร์ ล้างได้ที่ ตั้งค่า → รีเซ็ตข้อมูลทดลอง (ปุ่มนี้มีเฉพาะโหมด mock)

## แก้ไขตรงไหน

| อยากแก้ | ไฟล์ |
|---|---|
| ชื่อแอป, ชื่อนักจิตวิทยา/ผู้เข้ารับคำปรึกษาในเดโม | [`src/config.ts`](src/config.ts) (ชื่อแท็บตั้งต้นอยู่ใน [`index.html`](index.html) ด้วย) |
| เปิด/ปิดฟีเจอร์ (ตอนนี้ **ปิดระบบนัดหมาย** ไว้ เพราะยังไม่อยู่ใน requirement) | `features` ใน [`src/config.ts`](src/config.ts) |
| โลโก้ในหน้าเว็บ (header, หน้า login) | [`src/assets/logo-mark.png`](src/assets/logo-mark.png), แสดงผลโดย [`src/components/Brand.tsx`](src/components/Brand.tsx) |
| ไอคอนบนแท็บเบราว์เซอร์ / หน้าจอโฮม iPhone | [`public/favicon.ico`](public/favicon.ico) (16/32/48 px), [`public/apple-touch-icon.png`](public/apple-touch-icon.png) |
| โทนสีหลัก | ตัวแปรใน `:root` บนสุดของ [`src/index.css`](src/index.css) (`--navy`, `--brand-teal`, `--teal-*`) |
| อีเมล/รหัสผ่านบัญชีทดลอง, URL ของ backend | `.env` |
| ข้อมูลตัวอย่าง (เคส, Knowledge Graph, นัดหมาย, โน้ต) | [`src/api/mock/seed.ts`](src/api/mock/seed.ts) |
| Transcript ตัวอย่างของแต่ละ Session | [`src/api/mock/transcripts.ts`](src/api/mock/transcripts.ts) |
| สรุปจับใจความตัวอย่างของแต่ละ Session | [`src/api/mock/summaries.ts`](src/api/mock/summaries.ts) |
| รูปแบบข้อมูล (type) ที่ UI กับ backend ใช้ร่วมกัน | [`src/types.ts`](src/types.ts) |
| รายการ API ทั้งหมด | [`src/api/contract.ts`](src/api/contract.ts) |
| หน้าจอฝั่งนักจิตวิทยา | [`src/features/clinician/`](src/features/clinician/) |
| หน้าเคสผู้รับคำปรึกษา (แท็บ, KG, แชทถาม KG) | [`src/features/workspace/`](src/features/workspace/) |
| แอปฝั่งผู้เข้ารับคำปรึกษา | [`src/features/patient/`](src/features/patient/) |
| หน้า login / สมัครสมาชิก | [`src/features/auth/Login.tsx`](src/features/auth/Login.tsx) |
| สี และสไตล์ทั้งหมด | [`src/index.css`](src/index.css) (มีสารบัญอยู่บนสุด) |

ถ้าเปิดผ่าน `pnpm dev` การแก้ทุกไฟล์ (รวม `.env` และ `config.ts`) จะเห็นผลเอง ถ้าเปิดผ่าน Docker ต้องรัน `docker compose up --build` ใหม่

### โครงสร้างโค้ด

```
src/
  types.ts         รูปแบบข้อมูลที่ใช้ร่วมกันทั้งแอป
  api/             ชั้นข้อมูล: หน้าจอเรียกผ่าน `api` เท่านั้น
    contract.ts    รายการฟังก์ชันทั้งหมด + endpoint ของแต่ละตัว
    http.ts        ตัวเรียก REST API จริง
    mock/          backend จำลองในเบราว์เซอร์ (localStorage + ข้อมูลตัวอย่าง)
  components/      UI ที่ใช้ร่วมกัน (Icon, Modal, Toast, Header ฯลฯ)
  hooks/           useResource (โหลดข้อมูลจาก api), usePersistentState, useDismiss
  lib/             ฟังก์ชันช่วย: วันที่, ป้ายกำกับ, ดาวน์โหลดไฟล์
  features/        หน้าจอแยกตามส่วน: auth, clinician, workspace, patient
```

หลักการ: หน้าจอไม่อ่าน/เขียน localStorage หรือเรียก `fetch` เอง ทุกอย่างผ่าน `api` จึงสลับจาก mock ไป server จริงได้โดยไม่ต้องแก้หน้าจอ

## ต่อ backend

1. ใส่ URL ของ backend ใน `.env` แล้ว build ใหม่

   ```bash
   VITE_API_URL=https://api.example.com
   ```

   เว้นว่าง = ใช้ mock ในเบราว์เซอร์เหมือนเดิม

2. ให้ backend ทำ endpoint ตามตารางด้านล่าง (รายละเอียดอยู่ใน [`src/api/contract.ts`](src/api/contract.ts) ถ้าไม่ตรงกันให้ยึดไฟล์นั้น รูปแบบข้อมูลดูที่ [`src/types.ts`](src/types.ts))
   - รับ/ส่ง JSON ยกเว้นอัปโหลดไฟล์ (multipart, ฟิลด์ `file`)
   - `POST /auth/login` และ `/auth/signup` คืน `Session` ที่มี `token` หลังจากนั้นทุก request จะส่ง `Authorization: Bearer <token>`
   - เวลา error ให้ตอบ status 4xx/5xx พร้อม `{ "message": "ข้อความภาษาไทย", "field": "email" }` (`field` ใส่หรือไม่ใส่ก็ได้ ถ้าใส่ ข้อความจะแสดงใต้ช่องนั้นในฟอร์ม)
   - "me" หมายถึงผู้ใช้ที่ login อยู่ (ดูจาก token)

   | ใช้ที่ | Method & path | Body → ผลลัพธ์ |
   |---|---|---|
   | Login | `POST /auth/login` | `{email, password}` → `Session` |
   | สมัครสมาชิก | `POST /auth/signup` | `{role, name, email, password}` → `Session` |
   | รายชื่อผู้รับคำปรึกษา | `GET /patients` | → `Patient[]` |
   | เพิ่มผู้รับคำปรึกษา | `POST /patients` | `{name, age, occupation}` → `Patient` |
   | นัดหมาย | `GET /appointments` | → `Appointment[]` |
   | สร้าง / เลื่อนนัด | `POST /appointments`, `PUT /appointments/:id` | `{patientId, date, time, mode, note}` → `Appointment` |
   | ยกเลิกนัด | `DELETE /appointments/:id` | |
   | โน้ตของเคส | `GET /patients/:id/notes` | → `Note[]` |
   | เพิ่ม / ลบโน้ต | `POST /patients/:id/notes`, `DELETE /patients/:id/notes/:noteId` | `{text}` → `Note` |
   | Transcript ที่อัปโหลด | `GET /patients/:id/transcripts` | → `TranscriptUpload[]` |
   | อัปโหลด Transcript | `POST /patients/:id/transcripts` | multipart `file` → `TranscriptUpload` |
   | Transcript เต็มของ Session | `GET /patients/:id/sessions/:number/transcript` | → `TranscriptLine[]` (ทุกประโยคเรียงตามเวลา ประโยคที่ KG อ้างอิงต้องมี `time` ตรงกับ `time` ของ node) |
   | สรุปจับใจความแต่ละ Session (หน้าภาพรวม) | `GET /patients/:id/session-summaries` | → `SessionSummary[]` (สร้างตอนประมวลผล Transcript เช่นด้วย LLM แล้วให้นักจิตวิทยาตรวจ) |
   | ถามคำถามจาก KG | `POST /patients/:id/kg/ask` | `{question}` → `RagAnswer` |
   | บันทึกจากแอปผู้ป่วย (รายเคส) | `GET /patients/:id/checkins` | → `PatientCheckins` |
   | บันทึกอารมณ์ทุกเคส (หน้าภาพรวม) | `GET /checkins/moods` | → `{ [patientId]: MoodLog }` |
   | ติดต่อทีมงาน | `POST /support` | `{message}` |
   | หน้าแรกแอปผู้ป่วย | `GET /me/home` | → `PatientHome` |
   | ส่งข้อความในแชท | `POST /me/messages` | `{text}` → `PatientMessage` (คำตอบของบอท) |
   | ล้างแชท | `DELETE /me/messages` | → `PatientMessage[]` |
   | บันทึกอารมณ์วันนี้ | `PUT /me/moods/:date` | `{score}` |
   | ขอเลื่อนนัด | `POST /me/appointments/:id/reschedule-request` | → `Appointment` |
   | ส่งสรุปถึงนักจิตวิทยา | `POST /me/summary` | |
   | การตั้งค่าการแจ้งเตือน | `GET /me/preferences`, `PUT /me/preferences` | `Preferences` |

   > ตอนนี้ปิดระบบนัดหมายไว้ (`features.appointments` ใน `src/config.ts`) แอปจึงไม่เรียก `/appointments` และ `/me/appointments/...` เลย ยังไม่ต้องทำสองกลุ่มนี้ และ `nextAppointment` ใน `GET /me/home` ไม่ต้องส่งมาก็ได้

3. เรื่อง CORS เลือกอย่างใดอย่างหนึ่ง
   - ให้ backend อนุญาต origin ของเว็บนี้ หรือ
   - ตอนพัฒนา: ตั้ง `VITE_API_URL=/api` และ `API_PROXY_TARGET=http://localhost:3000` ใน `.env` แล้ว `pnpm dev` จะส่งต่อ `/api/*` ไปที่ backend ให้ (backend ต้องรับ path ที่ขึ้นต้นด้วย `/api`)
   - ตอนใช้ Docker: เพิ่มใน [`nginx.conf`](nginx.conf) แล้ว build ด้วย `VITE_API_URL=/api`

     ```nginx
     location /api/ {
       proxy_pass http://backend:3000;
     }
     ```

ถ้าจะเพิ่ม API ใหม่: เพิ่มฟังก์ชันใน `Api` ที่ `src/api/contract.ts` แล้วเขียนใน `src/api/http.ts` และ `src/api/mock/index.ts` (TypeScript จะแจ้ง error จนกว่าจะเขียนครบทั้งสองที่)
