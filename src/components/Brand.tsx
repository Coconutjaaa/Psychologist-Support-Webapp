import logoMark from "../assets/logo-mark.png";
import { brandName } from "../config";

/** The app logo: the mark plus the two-tone wordmark. Use `onDark` on navy backgrounds (white "Mind"). */
export default function Brand({ height = 34, onDark }: { height?: number; onDark?: boolean }) {
  return (
    <span className={`brand-logo ${onDark ? "on-dark" : ""}`}>
      {/* Size via style: Tailwind's base reset (img { height: auto }) would override a height attribute. */}
      <img src={logoMark} alt="" style={{ height }} />
      <span className="brand-name">{brandName[0]}<span className="brand-accent">{brandName[1]}</span></span>
    </span>
  );
}
