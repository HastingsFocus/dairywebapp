
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserRound,
  Milk,
  TrendingUp,
  ArrowRight,
  UserPlus,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";

const OwnerDashboard = () => {
  const { user } = useAuth();

  const [buyerCount, setBuyerCount] = useState(null);
  const [buyersLoading, setBuyersLoading] = useState(true);
  const [buyersError, setBuyersError] = useState("");

  useEffect(() => {
    const loadBuyers = async () => {
      try {
        setBuyersLoading(true);
        setBuyersError("");

        const response = await userService.getBuyers();

        setBuyerCount(
          typeof response.count === "number"
            ? response.count
            : response.buyers?.length ?? 0
        );
      } catch (error) {
        setBuyersError(
          error.response?.data?.message ||
            "Could not load buyer statistics."
        );
      } finally {
        setBuyersLoading(false);
      }
    };

    loadBuyers();
  }, []);

  const stats = [
    {
      title: "Total Buyers",
      value: buyersLoading
        ? "Loading..."
        : buyersError
          ? "Unavailable"
          : buyerCount,
      description: "Buyers linked to your account",
      icon: Users,
      link: "/owner/buyers",
      linkLabel: "View buyers",
    },
    {
      title: "Total Farmers",
      value: "—",
      description: "Awaiting farmer statistics API",
      icon: UserRound,
      link: "/owner/farmers",
      linkLabel: "View farmers",
    },
    {
      title: "Milk Collected Today",
      value: "—",
      description: "Awaiting daily milk totals API",
      icon: Milk,
      link: "/owner/milk-records",
      linkLabel: "View records",
    },
    {
      title: "Milk This Month",
      value: "—",
      description: "Awaiting monthly milk totals API",
      icon: TrendingUp,
      link: "/owner/reports",
      linkLabel: "View reports",
    },
  ];

  const quickActions = [
    {
      title: "Manage Buyers",
      description: "View buyers and invite new ones.",
      icon: Users,
      path: "/owner/buyers",
    },
    {
      title: "View Farmers",
      description: "Access the farmer directory.",
      icon: UserRound,
      path: "/owner/farmers",
    },
    {
      title: "Milk Records",
      description: "Review milk collection records.",
      icon: Milk,
      path: "/owner/milk-records",
    },
    {
      title: "Reports",
      description: "Review dairy collection reports.",
      icon: FileText,
      path: "/owner/reports",
    },
  ];

  return (
    <div className="owner-dashboard">
      {/* Welcome section */}
      <section className="owner-dashboard-heading">
        <div>
          <p className="owner-dashboard-eyebrow">
            OWNER WORKSPACE
          </p>

          <h1>
            Welcome back{user?.fullName ? `, ${user.fullName}` : ""}!
          </h1>

          <p>
            Here's an overview of your dairy operations.
          </p>
        </div>

        <Link
          to="/owner/buyers"
          className="owner-dashboard-primary-action"
        >
          <UserPlus size={18} />
          Invite a Buyer
        </Link>
      </section>

      {/* Buyer loading error */}
      {buyersError && (
        <div className="owner-dashboard-alert">
          <AlertCircle size={20} />
          <div>
            <strong>Buyer statistics unavailable</strong>
            <p>{buyersError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <section className="owner-dashboard-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className="owner-dashboard-stat"
              key={stat.title}
            >
              <div className="owner-dashboard-stat-top">
                <span>{stat.title}</span>

                <div className="owner-dashboard-stat-icon">
                  <Icon size={22} />
                </div>
              </div>

              <h2>{stat.value}</h2>

              <p>{stat.description}</p>

              <Link to={stat.link}>
                {stat.linkLabel}
                <ArrowRight size={15} />
              </Link>
            </article>
          );
        })}
      </section>

      {/* Main dashboard content */}
      <section className="owner-dashboard-main-grid">
        <article className="owner-dashboard-panel">
          <div className="owner-dashboard-panel-heading">
            <div>
              <h2>Milk Collection Overview</h2>
              <p>Daily and monthly collection summaries</p>
            </div>

            <Milk size={23} />
          </div>

          <div className="owner-dashboard-empty">
            <Milk size={34} />

            <h3>Milk statistics coming next</h3>

            <p>
              Once the milk-record API is connected, this section
              will show daily totals, monthly collection and
              collection trends across your dairy operation.
            </p>

            <Link to="/owner/milk-records">
              Open milk records
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>

        <article className="owner-dashboard-panel">
          <div className="owner-dashboard-panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Common owner tasks</p>
            </div>
          </div>

          <div className="owner-dashboard-quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  to={action.path}
                  className="owner-dashboard-quick-action"
                  key={action.path}
                >
                  <div className="owner-dashboard-quick-icon">
                    <Icon size={20} />
                  </div>

                  <div>
                    <strong>{action.title}</strong>
                    <p>{action.description}</p>
                  </div>

                  <ArrowRight size={17} />
                </Link>
              );
            })}
          </div>
        </article>
      </section>

      {/* Recent activity */}
      <section className="owner-dashboard-panel owner-dashboard-recent">
        <div className="owner-dashboard-panel-heading">
          <div>
            <h2>Recent Milk Records</h2>
            <p>Latest milk collection activity across your operation</p>
          </div>

          <Link to="/owner/milk-records">
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="owner-dashboard-empty">
          <FileText size={32} />

          <h3>Recent records will appear here</h3>

          <p>
            This section will display actual milk records after
            we connect the milk-record model and API.
          </p>
        </div>
      </section>
    </div>
  );
};

export default OwnerDashboard;
