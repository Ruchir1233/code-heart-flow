import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Menu,
  Search,
  MapPin,
  Phone,
  Plus,
  X,
  Users,
  Calendar,
  FileText,
  Handshake,
  CheckCircle2,
  ChevronDown,
  PhoneCall,
  Pencil,
  Trash2,
} from "lucide-react";
import { supabase, STAGES, type Enquiry, type Stage } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  component: EnquiriesPage,
});

const STAGE_META: Record<
  Stage,
  {
    icon: typeof Users;
    text: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  "New Enquiry": {
    icon: Users,
    text: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-400",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
  },
  "Site Visit Done": {
    icon: Calendar,
    text: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-400",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
  },
  "Estimate Sent": {
    icon: FileText,
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-400",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
  },
  "Price Negotiation": {
    icon: Handshake,
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-400",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  "Order Final": {
    icon: CheckCircle2,
    text: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-500",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
  },
};

const AVATAR_PALETTES = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
];

function avatarColor(name: string) {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date}, ${time}`;
}

type EditTarget = Enquiry | "new" | null;

function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Stage | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditTarget>(null);
  const [confirmDelete, setConfirmDelete] = useState<Enquiry | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) console.error(error);
      else setEnquiries((data ?? []) as Enquiry[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("enquiries-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "enquiries" },
        (payload: { eventType: string; new: unknown; old: unknown }) => {
          setEnquiries((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Enquiry;
              if (prev.some((e) => e.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Enquiry;
              return prev.map((e) => (e.id === row.id ? row : e));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Enquiry;
              return prev.filter((e) => e.id !== row.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<Stage, number> = {
      "New Enquiry": 0,
      "Site Visit Done": 0,
      "Estimate Sent": 0,
      "Price Negotiation": 0,
      "Order Final": 0,
    };
    for (const e of enquiries) {
      if (c[e.stage] !== undefined) c[e.stage] += 1;
    }
    return c;
  }, [enquiries]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (filter && e.stage !== filter) return false;
      if (!q) return true;
      return (
        e.customer_name.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    });
  }, [enquiries, search, filter]);

  async function updateStage(id: number, stage: Stage) {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, stage } : e)),
    );
    const { error } = await supabase
      .from("enquiries")
      .update({ stage })
      .eq("id", id);
    if (error) console.error(error);
  }

  async function deleteEnquiry(id: number) {
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    setConfirmDelete(null);
    const { error } = await supabase.from("enquiries").delete().eq("id", id);
    if (error) console.error(error);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-5 pb-3">
          <button
            aria-label="Menu"
            className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-base font-bold tracking-wide text-slate-900">
            PANKTI ENGINEERING
          </h1>
          <button
            aria-label="Search"
            className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100"
          >
            <Search className="h-5 w-5" />
          </button>
        </header>

        {/* Stage cards */}
        <div className="-mx-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2.5">
            {STAGES.map((stage) => {
              const meta = STAGE_META[stage];
              const Icon = meta.icon;
              const active = filter === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setFilter(active ? null : stage)}
                  className={`flex w-[7.75rem] shrink-0 flex-col items-start gap-1.5 rounded-2xl border-2 bg-white p-3 text-left shadow-sm transition active:scale-[0.97] ${
                    active ? `${meta.border} ${meta.bg}` : "border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${meta.text}`} />
                    <span className={`text-[11px] font-semibold ${meta.text}`}>
                      {stage}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">
                    {counts[stage]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or location..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Enquiry list */}
        <div className="space-y-3 px-3">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Loading…
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
              No enquiries yet. Tap "Add Enquiry" to create one.
            </div>
          ) : (
            visible.map((e) => (
              <EnquiryCard
                key={e.id}
                enquiry={e}
                onStageChange={updateStage}
                onEdit={() => setEditing(e)}
                onDelete={() => setConfirmDelete(e)}
              />
            ))
          )}
        </div>
      </div>

      {/* Floating add button */}
      <button
        onClick={() => setEditing("new")}
        className="fixed bottom-6 right-1/2 z-20 flex translate-x-[min(13rem,46vw)] items-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95"
      >
        <Plus className="h-5 w-5" />
        Add Enquiry
      </button>

      {editing && (
        <EnquiryModal
          target={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteDialog
          enquiry={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteEnquiry(confirmDelete.id)}
        />
      )}
    </div>
  );
}

function EnquiryCard({
  enquiry,
  onStageChange,
  onEdit,
  onDelete,
}: {
  enquiry: Enquiry;
  onStageChange: (id: number, stage: Stage) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initial = enquiry.customer_name.charAt(0).toUpperCase();
  const meta = STAGE_META[enquiry.stage];
  const avatarClass = avatarColor(enquiry.customer_name);
  const cleanPhone = enquiry.phone.replace(/\D/g, "");

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold ${avatarClass}`}
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-bold text-slate-900">
                {enquiry.customer_name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{enquiry.location}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{enquiry.phone}</span>
              </div>
            </div>

            <div className="relative shrink-0">
              <select
                value={enquiry.stage}
                onChange={(ev) =>
                  onStageChange(enquiry.id, ev.target.value as Stage)
                }
                className={`appearance-none rounded-lg px-2.5 py-1.5 pr-7 text-[11px] font-semibold ${meta.badgeBg} ${meta.badgeText} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300`}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s} className="text-slate-900">
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${meta.badgeText}`}
              />
            </div>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-sm font-medium text-slate-800">
              {enquiry.requirement}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Added on {formatDate(enquiry.created_at)}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              <button
                onClick={onEdit}
                aria-label="Edit"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                aria-label="Delete"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-1.5">
              <a
                href={`https://wa.me/91${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600 transition hover:bg-green-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.554-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
              <a
                href={`tel:${enquiry.phone}`}
                aria-label="Call"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition hover:bg-blue-200"
              >
                <PhoneCall className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnquiryModal({
  target,
  onClose,
}: {
  target: Enquiry | "new";
  onClose: () => void;
}) {
  const isNew = target === "new";
  const initial = isNew
    ? { customer_name: "", phone: "", location: "", requirement: "", stage: "New Enquiry" as Stage }
    : {
        customer_name: target.customer_name,
        phone: target.phone,
        location: target.location,
        requirement: target.requirement,
        stage: target.stage,
      };

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (
      !form.customer_name.trim() ||
      !form.phone.trim() ||
      !form.location.trim() ||
      !form.requirement.trim()
    ) {
      setError("Please fill all fields.");
      return;
    }
    setSaving(true);
    const payload = {
      customer_name: form.customer_name.trim().slice(0, 120),
      phone: form.phone.trim().slice(0, 20),
      location: form.location.trim().slice(0, 120),
      requirement: form.requirement.trim().slice(0, 500),
      stage: form.stage,
    };
    const { error } = isNew
      ? await supabase.from("enquiries").insert(payload)
      : await supabase.from("enquiries").update(payload).eq("id", (target as Enquiry).id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {isNew ? "New Enquiry" : "Edit Enquiry"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {(
            [
              ["customer_name", "Customer Name", "text", "e.g. Amit Panchal"],
              ["phone", "Phone Number", "tel", "10-digit mobile number"],
              ["location", "Location", "text", "City, State"],
            ] as const
          ).map(([key, label, type, ph]) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                placeholder={ph}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Requirement
            </label>
            <textarea
              value={form.requirement}
              onChange={(e) =>
                setForm((f) => ({ ...f, requirement: e.target.value }))
              }
              placeholder="Describe the work (e.g. 20x15 Shed work)"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Stage
            </label>
            <select
              value={form.stage}
              onChange={(e) =>
                setForm((f) => ({ ...f, stage: e.target.value as Stage }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Saving…" : isNew ? "Save Enquiry" : "Update Enquiry"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({
  enquiry,
  onCancel,
  onConfirm,
}: {
  enquiry: Enquiry;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Delete Enquiry?</h3>
        <p className="mt-1 text-sm text-slate-600">
          This will permanently delete <strong>{enquiry.customer_name}</strong>'s
          enquiry. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
