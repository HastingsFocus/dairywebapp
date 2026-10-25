
import {
  Milk,
  Users,
  ClipboardList,
  TrendingUp,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const roleContent = {
  admin: {
    heading: "System overview",
    description: "Monitor the Dairy Records System and its users.",
  },
  owner: {
    heading: "Your dairy at a glance",
    description: "Manage your buyers and keep track of milk production.",
  },
  buyer: {
    heading: "Welcome to your workspace",
    description: "Manage farmers and keep daily milk records up to date.",
  },
  farmer: {
    heading: "Your milk production",
    description: "Your milk records and production summaries will appear here.",
  },
};

const DashboardHome = () => {
  const { user } = useAuth();
  const content = roleContent[user?.role] || roleContent.farmer;

  const stats = [
    {
      title: user?.role === "farmer" ? "My milk records" : "Milk records",
      value: "—",
      note: "Connected in the next stage",
      icon: Milk,
    },
    {
      title: user?.role === "owner" ? "My buyers" : "Farmers",
      value: "—",
      note: "Live data coming soon",
      icon: Users,
    },
    {
      title: "Production total",
      value: "—",
      note: "Daily and monthly summaries",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="dashboard-home">
      <section className="welcome-banner">
        <div>
          <span className="welcome-label">YOUR DAIRY WORKSPACE</span>
          <h1>{content.heading}</h1>
          <p>{content.description}</p>
        </div>
        <div className="welcome-art">
          <Milk size={54} strokeWidth={1.4} />
          <span>DAIRYFLOW</span>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h2>Overview</h2>
          <p>Key information about your workspace.</p>
        </div>
        <span className="date-chip">
          <Clock3 size={15} />
          {new Date().toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <section className="stats-grid">
        {stats.map(({ title, value, note, icon: Icon }) => (
          <article className="stat-card" key={title}>
            <div className="stat-card-top">
              <div className="stat-icon">
                <Icon size={21} />
              </div>
              <ArrowUpRight size={18} className="stat-arrow" />
            </div>
            <p className="stat-title">{title}</p>
            <h3>{value}</h3>
            <p className="stat-note">{note}</p>
          </article>
        ))}
      </section>

      <section className="activity-card">
        <div className="activity-icon">
          <ClipboardList size={23} />
        </div>
        <div>
          <h2>Your workspace is ready</h2>
          <p>
            Your account is signed in. As we connect each feature to the
            backend, this area will display real dairy records, farmer
            information, and production reports.
          </p>
        </div>
      </section>

      <p className="dashboard-note">
        <span className="note-dot" />
        Dashboard figures will appear once the records endpoints are connected.
      </p>
    </div>
  );
};

export default DashboardHome;
