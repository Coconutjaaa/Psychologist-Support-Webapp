import type { Resource } from "../hooks/useResource";
import Icon from "./Icon";

/**
 * Placeholder while `useResource` data is loading, or an error with a retry button if it failed.
 * Usage: `if (!notes.data) return <LoadState resources={[notes]} />;`
 */
export default function LoadState({ resources, compact }: { resources: Pick<Resource<unknown>, "data" | "error" | "reload">[]; compact?: boolean }) {
  const failed = resources.find((resource) => resource.error && resource.data === undefined);
  if (!failed) return <p className={`loading-note ${compact ? "" : "loading-page"}`} role="status">กำลังโหลด…</p>;
  return (
    <div className="panel empty-state load-error" role="alert">
      <span><Icon name="info" size={22} /></span>
      <strong>โหลดข้อมูลไม่สำเร็จ</strong>
      <p>{failed.error?.message}</p>
      <button className="secondary-button" onClick={() => resources.forEach((resource) => resource.error && resource.reload())}>
        <Icon name="refresh" size={17} />ลองใหม่
      </button>
    </div>
  );
}
