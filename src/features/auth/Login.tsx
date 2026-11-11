import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { api, ApiError, errorMessage } from "../../api";
import Brand from "../../components/Brand";
import Icon from "../../components/Icon";
import { appName } from "../../config";
import { roleLabels, withKhun } from "../../lib/labels";
import type { Role, Session } from "../../types";

const points = [
  ["ปลอดภัย", "ข้อมูลเป็นส่วนตัว"],
  ["เข้าใจง่าย", "เห็นภาพรวมชัดเจน"],
  ["ต่อเนื่อง", "ติดตามได้ทุกวัน"],
];

type Mode = "login" | "signup";
type Field = "name" | "email" | "password";
type Errors = Partial<Record<Field | "form", string>>;

function validate(mode: Mode, name: string, email: string, password: string): Errors {
  const errors: Errors = {};
  if (mode === "signup" && !name.trim()) errors.name = "กรุณากรอกชื่อที่ใช้แสดง";
  if (!email) errors.email = "กรุณากรอกอีเมล";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
  if (!password) errors.password = "กรุณากรอกรหัสผ่าน";
  else if (mode === "signup" && password.length < 6) errors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  return errors;
}

export default function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("clinician");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const switchMode = (next: Mode) => { setMode(next); setErrors({}); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    const found = validate(mode, name, address, password);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      // The role comes from the account, so a clinician account only ever opens the clinician side and a patient account the patient side.
      const session = mode === "login"
        ? await api.auth.login(address, password)
        : await api.auth.signUp({ role, email: address, password, name: role === "patient" ? withKhun(name.trim()) : name.trim() });
      onLogin(session);
    } catch (error) {
      const field = error instanceof ApiError && (error.field === "name" || error.field === "email" || error.field === "password") ? error.field : "form";
      setErrors({ [field]: errorMessage(error) });
      setSubmitting(false);
    }
  };

  const field = (key: Field, label: string, input: ReactNode) => (
    <div className={`field ${errors[key] ? "invalid" : ""}`}>
      <label className="field-label" htmlFor={key}>{label}</label>
      {input}
      {errors[key] && <p className="field-error" id={`${key}-error`}>{errors[key]}</p>}
    </div>
  );
  const inputProps = (key: Field, value: string, set: (value: string) => void) => ({
    id: key, value, "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? `${key}-error` : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement>) => { set(event.target.value); setErrors({ ...errors, [key]: undefined, form: undefined }); },
  });
  const demoAccounts = api.auth.demoAccounts;

  return (
    <main className="auth">
      <div className="auth-card">
        <section className="auth-aside" aria-label={`เกี่ยวกับ ${appName}`}>
          <div className="auth-brand"><Brand height={42} onDark /></div>
          <div className="auth-pitch">
            <span className="auth-tag">พื้นที่ดูแลสุขภาพใจอย่างเป็นระบบ</span>
            <h1>เชื่อมทุกบทสนทนา<br />สู่การดูแลที่เข้าใจ</h1>
            <p>พื้นที่ปลอดภัยสำหรับนักจิตวิทยาและผู้รับคำปรึกษา<br />เพื่อมองเห็นความก้าวหน้าและก้าวต่อไปด้วยกัน</p>
          </div>
          <div className="auth-points">
            {points.map(([title, text]) => <div key={title}><strong>{title}</strong><span>{text}</span></div>)}
          </div>
        </section>
        <section className="auth-main">
          <div className="auth-mobile-brand"><Brand height={38} /></div>
          <span className="auth-eyebrow">ยินดีต้อนรับ</span>
          <h2>Welcome, {appName}</h2>
          <p className="auth-sub">แพลตฟอร์มช่วยสนับสนุนการทำงานของนักจิตวิทยา</p>
          <div className="auth-tabs" role="group" aria-label="เข้าสู่ระบบหรือสมัครสมาชิก">
            <button className={mode === "login" ? "active" : ""} aria-pressed={mode === "login"} onClick={() => switchMode("login")}>เข้าสู่ระบบ</button>
            <button className={mode === "signup" ? "active" : ""} aria-pressed={mode === "signup"} onClick={() => switchMode("signup")}>สมัครสมาชิก</button>
          </div>
          <form onSubmit={submit} noValidate>
            {mode === "signup" && (
              <>
                <div className="field">
                  <span className="field-label" id="role-label">ประเภทบัญชี</span>
                  <div className="role-options" role="radiogroup" aria-labelledby="role-label">
                    {(["clinician", "patient"] as const).map((item) => (
                      <button type="button" role="radio" aria-checked={role === item} className={role === item ? "active" : ""} onClick={() => setRole(item)} key={item}>
                        <Icon name={item === "clinician" ? "brain" : "user"} size={17} />{roleLabels[item]}
                      </button>
                    ))}
                  </div>
                </div>
                {field("name", "ชื่อที่ใช้แสดง", <input {...inputProps("name", name, setName)} autoComplete="name" placeholder={role === "clinician" ? "เช่น ดร. สมใจ" : "เช่น บี"} />)}
              </>
            )}
            {field("email", "อีเมล", <input {...inputProps("email", email, setEmail)} type="email" autoComplete="email" placeholder="name@example.com" />)}
            {field("password", "รหัสผ่าน", <input {...inputProps("password", password, setPassword)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "login" ? "กรอกรหัสผ่าน" : "อย่างน้อย 6 ตัวอักษร"} />)}
            {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
            <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "กำลังดำเนินการ…" : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</button>
          </form>
          {mode === "login" && demoAccounts && (
            <div className="demo-hint">
              {demoAccounts.length ? <span>บัญชีทดลอง:</span> : <span>ยังไม่ได้ตั้งค่าบัญชีทดลอง — คัดลอก .env.example เป็น .env แล้ว build ใหม่</span>}
              {demoAccounts.map((account) => (
                <button type="button" onClick={() => { setEmail(account.email); setPassword(account.password); setErrors({}); }} key={account.email}>{account.role === "clinician" ? roleLabels.clinician : account.name}</button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
