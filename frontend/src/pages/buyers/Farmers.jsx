
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Mail,
  MapPin,
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
  location: "",
};

const getFarmerId = (farmer) => farmer._id || farmer.id;

const getFarmerStatus = (farmer) => {
  if (!farmer.passwordSet) return "Pending invitation";
  return farmer.isActive ? "Active" : "Deactivated";
};

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFarmers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await userService.getFarmers();
      setFarmers(response.farmers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load farmers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleCreateFarmer = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.location.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await userService.createFarmer({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
      });

      setSuccess(
        response.message ||
          "Farmer created and invitation sent successfully."
      );

      setFormData(initialForm);
      setShowForm(false);

      await loadFarmers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create the farmer. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (farmer) => {
    setError("");

    try {
      const response = await userService.getFarmerById(
        getFarmerId(farmer)
      );

      setSelectedFarmer(response.farmer);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load farmer details."
      );
    }
  };

  const filteredFarmers = farmers.filter((farmer) => {
    const term = search.trim().toLowerCase();

    return (
      farmer.fullName?.toLowerCase().includes(term) ||
      farmer.email?.toLowerCase().includes(term) ||
      farmer.phone?.toLowerCase().includes(term) ||
      farmer.location?.toLowerCase().includes(term)
    );
  });

  const activeCount = farmers.filter(
    (farmer) => farmer.isActive && farmer.passwordSet
  ).length;

  const pendingCount = farmers.filter(
    (farmer) => !farmer.passwordSet
  ).length;

  const deactivatedCount = farmers.filter(
    (farmer) => farmer.passwordSet && !farmer.isActive
  ).length;

  return (
    <div className="owner-buyers-page">
      <div className="buyer-page-heading">
        <div>
          <span className="buyer-eyebrow">
            BUYER WORKSPACE / FARMERS
          </span>

          <h1>Farmers</h1>

          <p>
            Register farmers, send secure password invitations,
            and manage your farmer directory.
          </p>
        </div>

        <button
          type="button"
          className="buyer-submit-button"
          onClick={() => {
            setShowForm(true);
            setError("");
            setSuccess("");
          }}
        >
          <UserPlus size={18} />
          Add Farmer
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
          <span>Total farmers</span>
          <strong>{farmers.length}</strong>
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
            <h2>Farmers directory</h2>

            <p>
              {filteredFarmers.length} farmer
              {filteredFarmers.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="owner-buyer-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search name, email, phone or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search farmers"
            />
          </div>

          <button
            type="button"
            className="buyer-refresh-button"
            onClick={loadFarmers}
            disabled={loading}
            aria-label="Refresh farmers"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="owner-buyer-empty">
            Loading farmers...
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="owner-buyer-empty">
            <Users size={35} />

            <h3>
              {search ? "No matching farmers" : "No farmers yet"}
            </h3>

            <p>
              {search
                ? "Try another name, email, phone number or location."
                : "Add your first farmer to get started."}
            </p>

            {!search && (
              <button
                type="button"
                className="buyer-submit-button"
                onClick={() => setShowForm(true)}
              >
                <Plus size={18} />
                Add your first farmer
              </button>
            )}
          </div>
        ) : (
          <div className="owner-buyer-table-wrapper">
            <table className="owner-buyer-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Account status</th>
                  <th>Date added</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredFarmers.map((farmer) => {
                  const farmerId = getFarmerId(farmer);
                  const status = getFarmerStatus(farmer);

                  return (
                    <tr key={farmerId}>
                      <td>
                        <div className="owner-buyer-identity">
                          <div className="owner-buyer-avatar">
                            {farmer.fullName
                              ?.charAt(0)
                              .toUpperCase() || "F"}
                          </div>

                          <div>
                            <strong>{farmer.fullName}</strong>
                            <small>{farmer.email}</small>
                          </div>
                        </div>
                      </td>

                      <td>{farmer.phone || "Not provided"}</td>

                      <td>{farmer.location || "Not provided"}</td>

                      <td>
                        <span
                          className={`owner-buyer-status ${
                            !farmer.passwordSet
                              ? "pending"
                              : farmer.isActive
                                ? "active"
                                : "deactivated"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {farmer.createdAt
                          ? new Date(
                              farmer.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <div className="owner-buyer-actions">
                          <button
                            type="button"
                            className="owner-buyer-icon-button"
                            onClick={() => handleViewDetails(farmer)}
                            title="View farmer details"
                            aria-label={`View ${farmer.fullName}`}
                          >
                            <Eye size={17} />
                          </button>
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

      {showForm && (
        <div
          className="owner-buyer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="owner-buyer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-farmer-title"
          >
            <div className="owner-buyer-modal-heading">
              <div>
                <h2 id="create-farmer-title">Add a farmer</h2>

                <p>
                  We'll email the farmer a secure password setup link.
                </p>
              </div>

              <button
                type="button"
                className="owner-buyer-icon-button"
                onClick={() => setShowForm(false)}
                aria-label="Close farmer form"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateFarmer}
              className="buyer-form"
            >
              <div className="buyer-form-field">
                <label htmlFor="farmer-fullName">Full name *</label>

                <input
                  id="farmer-fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  placeholder="Enter the farmer's full name"
                  autoComplete="name"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="buyer-form-field">
                <label htmlFor="farmer-email">Email address *</label>

                <input
                  id="farmer-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="farmer@example.com"
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="buyer-form-field">
                <label htmlFor="farmer-phone">Phone number *</label>

                <input
                  id="farmer-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="buyer-form-field">
                <label htmlFor="farmer-location">Location *</label>

                <input
                  id="farmer-location"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="Village, area or district"
                  autoComplete="address-level2"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="buyer-security-note">
                <ShieldCheck size={20} />

                <p>
                  The farmer will set their own password using
                  the email invitation. The setup link expires
                  after 24 hours.
                </p>
              </div>

              <button
                type="submit"
                className="buyer-submit-button"
                disabled={submitting}
              >
                <Mail size={18} />

                {submitting
                  ? "Creating farmer and sending invitation..."
                  : "Create Farmer & Send Invitation"}
              </button>
            </form>
          </section>
        </div>
      )}

      {selectedFarmer && (
        <div
          className="owner-buyer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedFarmer(null);
            }
          }}
        >
          <section
            className="owner-buyer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="farmer-details-title"
          >
            <div className="owner-buyer-modal-heading">
              <div>
                <h2 id="farmer-details-title">Farmer details</h2>
                <p>Account information and access status</p>
              </div>

              <button
                type="button"
                className="owner-buyer-icon-button"
                onClick={() => setSelectedFarmer(null)}
                aria-label="Close farmer details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="owner-buyer-detail-profile">
              <div className="owner-buyer-avatar large">
                {selectedFarmer.fullName
                  ?.charAt(0)
                  .toUpperCase() || "F"}
              </div>

              <h3>{selectedFarmer.fullName}</h3>

              <span
                className={`owner-buyer-status ${
                  !selectedFarmer.passwordSet
                    ? "pending"
                    : selectedFarmer.isActive
                      ? "active"
                      : "deactivated"
                }`}
              >
                {getFarmerStatus(selectedFarmer)}
              </span>
            </div>

            <div className="owner-buyer-detail-list">
              <div>
                <Mail size={18} />
                <span>Email</span>
                <strong>{selectedFarmer.email}</strong>
              </div>

              <div>
                <Phone size={18} />
                <span>Phone</span>
                <strong>
                  {selectedFarmer.phone || "Not provided"}
                </strong>
              </div>

              <div>
                <MapPin size={18} />
                <span>Location</span>
                <strong>
                  {selectedFarmer.location || "Not provided"}
                </strong>
              </div>

              <div>
                <ShieldCheck size={18} />
                <span>Password setup</span>
                <strong>
                  {selectedFarmer.passwordSet
                    ? "Completed"
                    : "Pending"}
                </strong>
              </div>

              <div>
                <Users size={18} />
                <span>Account created</span>
                <strong>
                  {selectedFarmer.createdAt
                    ? new Date(
                        selectedFarmer.createdAt
                      ).toLocaleDateString()
                    : "—"}
                </strong>
              </div>
            </div>

            <p className="owner-buyer-activity-note">
              The farmer can view their own milk records after
              logging in. Milk-record summaries can be connected
              to this profile through the records API.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default Farmers;
