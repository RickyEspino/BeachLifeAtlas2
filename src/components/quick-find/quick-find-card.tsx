"use client";

type QuickFindResult = {
  id: string;
  place_id: string | null;
  name: string;
  category: string | null;
  description: string | null;
  lat: number;
  lng: number;
  points_reward: number | null;
  sort_order: number;
};

export default function QuickFindCard({
  item,
  index,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onMoreLikeThis,
}: {
  item: QuickFindResult;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onMoreLikeThis: () => void;
}) {
  return (
    <article
      onClick={onSelect}
      className={`cursor-pointer overflow-hidden rounded-[2rem] border bg-white shadow-sm transition ${
        isSelected ? "ring-2 ring-black" : "hover:-translate-y-0.5 hover:shadow-lg"
      }`}
    >
      <div
        className="p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(253,230,138,.5), rgba(191,219,254,.45), rgba(233,213,255,.45))",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              Pick {index + 1}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {item.name}
            </h2>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-sm font-semibold">
            {index + 1}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs capitalize">
            {item.category ?? "place"}
          </span>
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs">
            +{item.points_reward ?? 0} BeachPoints
          </span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-neutral-700">
          {isExpanded
            ? item.description ?? ""
            : `${(item.description ?? "").slice(0, 120)}$${
                (item.description ?? "").length > 120 ? "..." : ""
              }`}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoreLikeThis();
            }}
            className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            More like this
          </button>
        </div>
      </div>
    </article>
  );
}
