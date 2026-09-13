export default function LogoBadge({ size = 60 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm"
      style={{ width: size, height: size }}
    >
      <img src="/images/logo-transparent.png" alt="" className="h-full w-full object-contain" />
    </div>
  );
}
