
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import userService from "../../services/userService";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
};

const getBuyerId = (buyer) => buyer._id || buyer.id;

const getBuyerStatus = (buyer) => {
  if (!buyer.passwordSet) return "Pending invitation";
  return buyer.isActive ? "Active" : "Deactivated";
};

const Buyers = () => {
  const [buyers, setBuyers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBuyers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await userService.getBuyers();
      setBuyers(response.buyers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load buyers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuyers();
  }, [loadBuyers]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError("Full name and email address are required.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await userService.createBuyer({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      });

      setSuccess(
        response.message || "Buyer invitation sent successfully."
      );

      setFormData(initialForm);
      setShowInvite(false);

      await loadBuyers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to invite the buyer. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (buyer) => {
    setError("");
    setSuccess("");

    try {
      const response = await userService.getBuyerById(
        getBuyerId(buyer)
      );

      setSelectedBuyer(response.buyer);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load buyer details."
      );
    }
  };

  const handleStatusChange = async (buyer) => {
    const buyerId = getBuyerId(buyer);
    const nextStatus = !buyer.isActive;

    if (nextStatus && !buyer.passwordSet) {
      setError(
        "This buyer must complete password setup before activation."
      );
      return;
    }

    const action = nextStatus ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${buyer.fullName}?`
      )
    ) {
      return;
    }

    setUpdatingId(buyerId);
    setError("");
    setSuccess("");

    try {
      const response = await userService.updateBuyerStatus(
        buyerId,
        nextStatus
      );

      setSuccess(response.message || "Buyer status updated.");

      await loadBuyers();

      if (
        selectedBuyer &&
        getBuyerId(selectedBuyer) === buyerId
      ) {
        setSelectedBuyer((previous) => ({
          ...previous,
          isActive: nextStatus,
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update buyer status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const filteredBuyers = buyers.filter((buyer) => {
    const term = search.trim().toLowerCase();

    return (
      buyer.fullName?.toLowerCase().includes(term) ||
      buyer.email?.toLowerCase().includes(term) ||
      buyer.phone?.toLowerCase().includes(term)
    );
  });

  const activeCount = buyers.filter(
    (buyer) => buyer.isActive && buyer.passwordSet
  ).length;

  const pendingCount = buyers.filter(
    (buyer) => !buyer.passwordSet
  ).length;

  const deactivatedCount = buyers.filter(
    (buyer) => buyer.passwordSet && !buyer.isActive
  ).length;

  return (
    <div className="owner-buyers-page">
      <div className="buyer-page-heading">
        <div>
          <span className="buyer-eyebrow">
            OWNER WORKSPACE / BUYERS
          </span>

          <h1>Buyers</h1>

          <p>
            Invite buyers, manage their accounts, and monitor access
            to your dairy operations.
          </p>
        </div>

        <button
          type="button"
          className="buyer-submit-button"
          onClick={() => {
            setShowInvite(true);
            setError("");
            setSuccess("");
          }}
        >
          <UserPlus size={18} />
          Invite Buyer
        </button>
      </div>

      {error && (
        <div className="buyer-alert buyer-alert-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="buyer-alert buyer-alert-success"
          role="status"
        >
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="owner-buyer-stats">
        <div className="owner-buyer-stat">
          <Users size={23} />
          <span>Total buyers</span>
          <strong>{buyers.length}</strong>
        </div>

        <div className="owner-buyer-stat">
          <ShieldCheck size={23} />
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="owner-buyer-stat">
          <Mail size={23} />
          <span>Pending invitations</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="owner-buyer-stat">
          <AlertCircle size={23} />
          <span>Deactivated</span>
          <strong>{deactivatedCount}</strong>
        </div>
      </div>

      <section className="owner-buyer-directory">
        <div className="owner-buyer-toolbar">
          <div>
            <h2>Buyers directory</h2>
            <p>
              {filteredBuyers.length} buyer
              {filteredBuyers.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="owner-buyer-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search name, email or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search buyers"
            />
          </div>

          <button
            type="button"
            className="buyer-refresh-button"
            onClick={loadBuyers}
            disabled={loading}
            aria-label="Refresh buyers"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="owner-buyer-empty">
            Loading buyers...
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className="owner-buyer-empty">
            <Users size={35} />

            <h3>
              {search ? "No matching buyers" : "No buyers yet"}
            </h3>

            <p>
              {search
                ? "Try another name, email address or phone number."
                : "Invite your first buyer to get started."}
            </p>

            {!search && (
              <button
                type="button"
                className="buyer-submit-button"
                onClick={() => setShowInvite(true)}
              >
                <Plus size={18} />
                Invite your first buyer
              </button>
            )}
          </div>
        ) : (
          <div className="owner-buyer-table-wrapper">
            <table className="owner-buyer-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Contact</th>
                  <th>Account status</th>
                  <th>Date added</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBuyers.map((buyer) => {
                  const buyerId = getBuyerId(buyer);
                  const status = getBuyerStatus(buyer);

                  return (
                    <tr key={buyerId}>
                      <td>
                        <div className="owner-buyer-identity">
                          <div className="owner-buyer-avatar">
                            {buyer.fullName
                              ?.charAt(0)
                              .toUpperCase() || "B"}
                          </div>

                          <div>
                            <strong>{buyer.fullName}</strong>
                            <small>{buyer.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>{buyer.phone || "Not provided"}</td>

                      <td>
                        <span
                          className={`owner-buyer-status ${
                            !buyer.passwordSet
                              ? "pending"
                              : buyer.isActive
                                ? "active"
                                : "deactivated"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {buyer.createdAt
                          ? new Date(
                              buyer.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <div className="owner-buyer-actions">
                          <button
                            type="button"
                            className="owner-buyer-icon-button"
                            onClick={() => handleViewDetails(buyer)}
                            title="View buyer details"
                            aria-label={`View ${buyer.fullName}`}
                          >
                            <Eye size={17} />
                          </button>

                          {buyer.passwordSet && (
                            <button
                              type="button"
                              className="owner-buyer-action-button"
                              onClick={() =>
                                handleStatusChange(buyer)
                              }
                              disabled={updatingId === buyerId}
                            >
                              {updatingId === buyerId
                                ? "Updating..."
                                : buyer.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showInvite && (
        <div
          className="owner-buyer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowInvite(false);
            }
          }}
        >
          <section
            className="owner-buyer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-buyer-title"
          >
            <div className="owner-buyer-modal-heading">
              <div>
                <h2 id="invite-buyer-title">Invite a buyer</h2>
                <p>
                  We'll email the buyer a secure password setup link.
                </p>
              </div>

              <button
                type="button"
                className="owner-buyer-icon-button"
                onClick={() => setShowInvite(false)}
                aria-label="Close invitation form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="buyer-form">
              <div className="buyer-form-field">
                <label htmlFor="buyer-fullName">Full name *</label>
                <input
                  id="buyer-fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  placeholder="Enter the buyer's full name"
                  autoComplete="name"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="buyer-form-field">
                <label htmlFor="buyer-email">Email address *</label>
                <input
                  id="buyer-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="buyer@example.com"
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="buyer-form-field">
                <label htmlFor="buyer-phone">Phone number</label>
                <input
                  id="buyer-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="Enter phone number (optional)"
                  autoComplete="tel"
                  disabled={submitting}
                />
              </div>

              <div className="buyer-security-note">
                <ShieldCheck size={20} />
                <p>
                  The buyer sets their own password using the email
                  invitation. The setup link expires after 24 hours.
                </p>
              </div>

              <button
                type="submit"
                className="buyer-submit-button"
                disabled={submitting}
              >
                <Mail size={18} />
                {submitting
                  ? "Sending invitation..."
                  : "Create Buyer & Send Invitation"}
              </button>
            </form>
          </section>
        </div>
      )}

      {selectedBuyer && (
        <div className="owner-buyer-modal-backdrop">
          <section
            className="owner-buyer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyer-details-title"
          >
            <div className="owner-buyer-modal-heading">
              <div>
                <h2 id="buyer-details-title">Buyer details</h2>
                <p>Account information and access status</p>
              </div>

              <button
                type="button"
                className="owner-buyer-icon-button"
                onClick={() => setSelectedBuyer(null)}
                aria-label="Close buyer details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="owner-buyer-detail-profile">
              <div className="owner-buyer-avatar large">
                {selectedBuyer.fullName?.charAt(0).toUpperCase() || "B"}
              </div>
              <h3>{selectedBuyer.fullName}</h3>
              <span
                className={`owner-buyer-status ${
                  !selectedBuyer.passwordSet
                    ? "pending"
                    : selectedBuyer.isActive
                      ? "active"
                      : "deactivated"
                }`}
              >
                {getBuyerStatus(selectedBuyer)}
              </span>
            </div>

            <div className="owner-buyer-detail-list">
              <div>
                <Mail size={18} />
                <span>Email</span>
                <strong>{selectedBuyer.email}</strong>
              </div>

              <div>
                <Phone size={18} />
                <span>Phone</span>
                <strong>{selectedBuyer.phone || "Not provided"}</strong>
              </div>

              <div>
                <ShieldCheck size={18} />
                <span>Password setup</span>
                <strong>
                  {selectedBuyer.passwordSet ? "Completed" : "Pending"}
                </strong>
              </div>

              <div>
                <Users size={18} />
                <span>Account created</span>
                <strong>
                  {selectedBuyer.createdAt
                    ? new Date(
                        selectedBuyer.createdAt
                      ).toLocaleDateString()
                    : "—"}
                </strong>
              </div>
            </div>

            <p className="owner-buyer-activity-note">
              Milk-record activity will be connected to this profile
              once we link it to your milk-record model.
            </p>

            {selectedBuyer.passwordSet && (
              <button
                type="button"
                className="buyer-submit-button"
                disabled={
                  updatingId === getBuyerId(selectedBuyer)
                }
                onClick={() => handleStatusChange(selectedBuyer)}
              >
                {selectedBuyer.isActive
                  ? "Deactivate buyer"
                  : "Activate buyer"}
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Buyers;
