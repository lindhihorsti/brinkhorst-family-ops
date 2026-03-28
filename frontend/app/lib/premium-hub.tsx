import Link from "next/link";
import { PremiumPillNav } from "./ui";

export type PremiumHubTile = {
  href: string;
  icon: string;
  title: string;
  sub: string;
};

export function PremiumHubLayout({
  icon,
  title,
  subtitle,
  gradientFrom,
  gradientTo,
  tiles,
  backHref = "/",
  navCurrent,
}: {
  icon: string;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  tiles: PremiumHubTile[];
  backHref?: string;
  navCurrent?: string;
}) {
  return (
    <div className="p-hub-premium">
      {/* Gradient Header */}
      <div
        className="p-hub-header"
        style={{ background: `linear-gradient(160deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }}
      >
        {/* Top bar */}
        <div className="p-hub-topbar">
          <Link href={backHref} className="p-hub-back">
            <span>‹</span> Home
          </Link>
        </div>

        {/* Hero */}
        <div className="p-hub-hero">
          <div className="p-hub-icon-wrap">
            <span className="p-hub-icon">{icon}</span>
          </div>
          <h1 className="p-hub-title">{title}</h1>
          <p className="p-hub-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Content card that slides over the header */}
      <div className="p-hub-content">
        <div className="p-hub-card">
          {tiles.map((tile, i) => (
            <Link key={tile.href} href={tile.href} className="p-hub-row">
              <span
                className="p-hub-row-icon"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}cc, ${gradientTo}cc)` }}
              >
                {tile.icon}
              </span>
              <div className="p-hub-row-text">
                <span className="p-hub-row-title">{tile.title}</span>
                <span className="p-hub-row-sub">{tile.sub}</span>
              </div>
              <span className="p-hub-row-chevron">›</span>
              {i < tiles.length - 1 && <div className="p-hub-row-divider" />}
            </Link>
          ))}
        </div>
      </div>
      <PremiumPillNav current={navCurrent} />
    </div>
  );
}
