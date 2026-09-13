export default function LogoBadge({ size = 36, iconSize }: { size?: number; iconSize?: number }) {
  // iconSize defaults to size-12 (matching the original fixed padding) so
  // every existing caller that doesn't pass it looks exactly as before —
  // only a caller that explicitly sets iconSize gets a bigger logo inside
  // the same white box.
  const resolvedIconSize = iconSize ?? size - 12;

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <img
        src="/images/logo-transparent.png"
        alt=""
        className="object-contain"
        style={{ width: resolvedIconSize, height: resolvedIconSize }}
      />
    </div>
  );
}
