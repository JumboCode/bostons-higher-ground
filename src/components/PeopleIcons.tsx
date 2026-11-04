import { UserRound } from "lucide-react";

// One icon per `perIcon` families. Remainder fills the last icon proportionally.
export default function PeopleIcons({
    count,
    perIcon = 5,
    label,
    className = "text-bhg-pink",
}: {
    count: number;
    perIcon?: number;
    label: string;
    className?: string;
}) {
    const full = Math.floor(count / perIcon);
    const rest = count % perIcon;
    const icon = (filled: boolean) => (
        <UserRound size={28} fill={filled ? "currentColor" : "none"} aria-hidden />
    );

    return (
        <div role="img" aria-label={`${count} ${label}`}>
            <div className={`flex flex-wrap gap-1 ${className}`}>
                {Array.from({ length: full }, (_, i) => (
                    <span key={i}>{icon(true)}</span>
                ))}
                {rest > 0 && (
                    <span className="relative inline-block">
                        <span className="opacity-30">{icon(false)}</span>
                        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(rest / perIcon) * 100}%` }}>{icon(true)}</span>
                    </span>
                )}
            </div>
            <p className="mt-2 text-xs text-bhg-gray-300">1 icon = {perIcon} families</p>
        </div>
    );
}
