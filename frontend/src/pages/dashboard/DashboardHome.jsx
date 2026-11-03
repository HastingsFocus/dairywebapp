import {
  Milk,
  Users,
  ClipboardList,
  TrendingUp,
  ArrowUpRight,
  Clock3,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const roleContent = {
  admin: {
    heading: "System overview",
    description:
      "Monitor the Dairy Records System and keep operations running smoothly.",
    badge: "Administration",
  },
  owner: {
    heading: "Your dairy at a glance",
    description:
      "Manage your buyers and keep track of milk production across your dairy.",
    badge: "Owner workspace",
  },
  buyer: {
    heading: "Welcome to your workspace",
    description:
      "Manage farmers and keep daily milk records accurate and up to date.",
    badge: "Buyer workspace",
  },
  farmer: {
    heading: "Your milk production",
    description:
      "Keep track of your milk records and follow your production over time.",
    badge: "Farmer workspace",
  },
};

const DashboardHome = () => {
  const { user } = useAuth();
  const content = roleContent[user?.role] || roleContent.farmer;

  const stats = [
    {
      title: user?.role === "farmer" ? "My milk records" : "Milk records",
      value: "—",
      note: "Daily collection records",
      icon: Milk,
      iconStyle: "bg-[#86efac]/10 text-[#86efac]",
    },
    {
      title: user?.role === "owner" ? "My buyers" : "Farmers",
      value: "—",
      note: "Registered accounts",
      icon: Users,
      iconStyle: "bg-sky-400/10 text-sky-400",
    },
    {
      title: "Production total",
      value: "—",
      note: "Daily and monthly summaries",
      icon: TrendingUp,
      iconStyle: "bg-amber-400/10 text-amber-400",
    },
  ];

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[#383838] bg-gradient-to-br from-[#242d27] via-[#202722] to-[#222222] p-6 sm:p-8 lg:p-10">
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#86efac]/10" />
        <div className="pointer-events-none absolute -right-4 -top-12 h-52 w-52 rounded-full border border-[#86efac]/10" />
        <div className="pointer-events-none absolute bottom-0 right-28 h-40 w-40 rounded-full bg-[#86efac]/[0.05] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#86efac]/20 bg-[#86efac]/[0.08] px-3 py-1.5">
              <Sparkles size={14} className="text-[#86efac]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#86efac]">
                {content.badge}
              </span>
            </div>

            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#F0F0F0] sm:text-3xl lg:text-4xl">
              {content.heading}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#B0B8B1] sm:text-base">
              {content.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-[#B0B8B1]">
              <span className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#86efac]" />
                Welcome, {user?.fullName || "User"}
              </span>
            </div>
          </div>

          <div className="hidden shrink-0 sm:block">
            <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-[#86efac]/20 bg-[#86efac]/[0.07] text-[#86efac] shadow-xl shadow-black/10 lg:h-36 lg:w-36">
              <Milk
                size={70}
                strokeWidth={1.2}
                className="lg:hidden"
              />
              <Milk
                size={88}
                strokeWidth={1.2}
                className="hidden lg:block"
              />
            </div>
            <p className="mt-3 text-center text-[10px] font-bold tracking-[0.25em] text-[#86efac]/70">
              DAIRYFLOW
            </p>
          </div>
        </div>
      </section>

      {/* Overview heading */}
      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#E7E7E7] sm:text-xl">
              Overview
            </h2>
            <p className="mt-1 text-sm text-[#A3A3A3]">
              A quick look at your dairy operations.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#383838] bg-[#222222] px-3 py-2 text-xs font-medium text-[#BDBDBD]">
            <Clock3 size={15} className="text-[#86efac]" />
            {formattedDate}
          </div>
        </div>

        {/* Statistic cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(({ title, value, note, icon: Icon, iconStyle }) => (
            <article
              key={title}
              className="group rounded-xl border border-[#383838] bg-[#222222] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#505050] hover:bg-[#252525] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[#777777] transition-colors group-hover:bg-[#303030] group-hover:text-[#86efac]">
                  <ArrowUpRight size={18} />
                </span>
              </div>

              <p className="mt-5 text-sm font-medium text-[#A3A3A3]">
                {title}
              </p>

              <h3 className="mt-1 text-3xl font-bold tracking-tight text-[#E7E7E7]">
                {value}
              </h3>

              <p className="mt-3 text-xs text-[#858585]">
                {note}
              </p>

              <div className="mt-5 h-1 overflow-hidden rounded-full bg-[#383838]">
                <div className="h-full w-1/3 rounded-full bg-[#86efac]/50" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Workspace status */}
      <section className="rounded-xl border border-[#383838] bg-[#222222] p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#86efac]/20 bg-[#86efac]/10 text-[#86efac]">
            <ClipboardList size={25} strokeWidth={1.7} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-bold text-[#E7E7E7] sm:text-lg">
                Your workspace is ready
              </h2>

              <span className="rounded-full border border-[#86efac]/20 bg-[#86efac]/10 px-2.5 py-1 text-[10px] font-semibold text-[#86efac]">
                Account active
              </span>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A3A3A3]">
              You're signed in and ready to work. Once the dashboard
              statistics are connected to the records API, this area
              will show your actual milk collection figures, farmer
              information, and production summaries.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-[#858585]">
              <ShieldCheck size={16} className="shrink-0 text-[#86efac]" />
              <span>Your dashboard is tailored to your account role.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard note */}
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-[#383838] px-4 py-3.5">
        <TrendingUp size={17} className="mt-0.5 shrink-0 text-[#86efac]" />
        <p className="text-xs leading-5 text-[#858585]">
          Production totals and account counts will populate when the
          relevant backend endpoints are connected. No sample figures
          are presented as real records.
        </p>
      </div>
    </div>
  );
};

export default DashboardHome;