"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Admin {
  _id: string;
  email: string;
  name: string;
  whatsappNumber: string;
  isActive: boolean;
  notifyOrders: boolean;
  role: "SUPER_ADMIN" | "ADMIN";
  createdAt: string;
}

interface FormData {
  email: string;
  name: string;
  whatsappNumber: string;
  notifyOrders: boolean;
  password?: string;
}

export default function AdminsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    name: "",
    whatsappNumber: "",
    notifyOrders: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (status === "authenticated") {
      // Check if user is SUPER_ADMIN
      loadAdmins();
    }
  }, [status, router]);

  async function loadAdmins() {
    try {
      const res = await fetch("/api/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      } else if (res.status === 401) {
        router.push("/admin/login");
      } else {
        setError("You don't have permission to manage admins. Only SUPER_ADMIN can do this.");
      }
    } catch (err) {
      console.error("Failed to load admins:", err);
      setError("Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email || !formData.name) {
      setError("Email and name are required");
      return;
    }

    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setTempPassword(data.tempPassword);
        setSuccess(
          `✅ Admin "${formData.name}" created! Temp password: ${data.tempPassword} (shown above)`
        );
        setFormData({ email: "", name: "", whatsappNumber: "", notifyOrders: true });
        setShowAddForm(false);
        loadAdmins();
      } else if (res.status === 401) {
        setError("Only SUPER_ADMIN can add admins");
      } else {
        setError("Failed to add admin");
      }
    } catch (err) {
      setError("Error adding admin");
      console.error(err);
    }
  }

  async function handleUpdateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editingId) return;

    try {
      const res = await fetch(`/api/admins/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(`✅ Admin updated successfully`);
        setEditingId(null);
        setFormData({ email: "", name: "", whatsappNumber: "", notifyOrders: true });
        setNewPassword("");
        setSettingPassword(false);
        loadAdmins();
      } else if (res.status === 401) {
        setError("Only SUPER_ADMIN can edit admins");
      } else {
        setError("Failed to update admin");
      }
    } catch (err) {
      setError("Error updating admin");
      console.error(err);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editingId) return;
    if (!newPassword.trim()) {
      setError("Password cannot be empty");
      return;
    }

    try {
      const res = await fetch(`/api/admins/${editingId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        setSuccess(`✅ Password set successfully for ${formData.name}`);
        setNewPassword("");
        setSettingPassword(false);
      } else if (res.status === 401) {
        setError("Only SUPER_ADMIN can set passwords");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to set password");
      }
    } catch (err) {
      setError("Error setting password");
      console.error(err);
    }
  }

  async function handleDeleteAdmin(id: string) {
    if (!confirm("Are you sure? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });

      if (res.ok) {
        setSuccess("✅ Admin removed successfully");
        loadAdmins();
      } else if (res.status === 401) {
        setError("Only SUPER_ADMIN can delete admins");
      } else if (res.status === 400) {
        setError("Cannot delete your own account");
      } else {
        setError("Failed to delete admin");
      }
    } catch (err) {
      setError("Error deleting admin");
      console.error(err);
    }
  }

  function startEdit(admin: Admin) {
    setEditingId(admin._id);
    setFormData({
      email: admin.email,
      name: admin.name,
      whatsappNumber: admin.whatsappNumber,
      notifyOrders: admin.notifyOrders,
    });
    setShowAddForm(false);
    setTempPassword("");
    setNewPassword("");
    setSettingPassword(false);
  }

  function cancelForm() {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ email: "", name: "", whatsappNumber: "", notifyOrders: true });
    setTempPassword("");
    setNewPassword("");
    setSettingPassword(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-charcoal/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl italic text-charcoal">Manage Admins</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            Total admins: {admins.length}
          </p>
        </div>
        <button
          onClick={() => (setShowAddForm(!showAddForm), setEditingId(null))}
          className={`rounded-full px-6 py-2 font-semibold transition ${
            showAddForm
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-rose text-white hover:bg-rose-dark"
          }`}
        >
          {showAddForm ? "Cancel" : "+ Add Admin"}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 rounded-card border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-card border border-green-300 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Temp Password Display */}
      {tempPassword && (
        <div className="mb-6 rounded-card border border-blue-300 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">⚠️ Save this temporary password:</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm font-bold text-charcoal">
              {tempPassword}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tempPassword);
                alert("Copied!");
              }}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-xs text-blue-700">
            Share this with the new admin. They can change it after logging in.
          </p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="mb-8 rounded-card border border-sand bg-white p-6">
          <h2 className="mb-4 font-semibold text-charcoal">
            {editingId ? "Edit Admin" : "Add New Admin"}
          </h2>

          <form onSubmit={editingId ? handleUpdateAdmin : handleAddAdmin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-charcoal">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-sand px-4 py-2 text-charcoal"
                disabled={editingId ? true : false}
              />
              {editingId && (
                <p className="mt-1 text-xs text-charcoal/60">Email cannot be changed</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-charcoal">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-sand px-4 py-2 text-charcoal"
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-medium text-charcoal">
                WhatsApp Number (with country code)
              </label>
              <input
                type="tel"
                placeholder="e.g., +9779841234567"
                value={formData.whatsappNumber}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappNumber: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-sand px-4 py-2 text-charcoal"
              />
            </div>

            {/* Password Section - Only for editing */}
            {editingId && (
              <div className="border-t border-sand pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-charcoal">Password Management</label>
                  <button
                    type="button"
                    onClick={() => setSettingPassword(!settingPassword)}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    {settingPassword ? "Cancel" : "Set New Password"}
                  </button>
                </div>

                {settingPassword && (
                  <div className="space-y-3 rounded bg-sand/10 p-3">
                    <div>
                      <label className="block text-sm font-medium text-charcoal">New Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full rounded-md border border-sand px-4 py-2 pr-10 text-charcoal"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/60 hover:text-charcoal"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                              <path d="M15.171 13.576l1.414 1.414A10.025 10.025 0 0020.142 10c-1.274-4.057-5.064-7-9.542-7a9.971 9.971 0 00-3.516.654l2.02 2.02a4 4 0 015.484 5.484z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSetPassword}
                      className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Set Password
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Password Info - Only for new admins */}
            {!editingId && (
              <div className="rounded bg-sand/10 p-3 text-sm text-charcoal/70">
                📝 A temporary password will be auto-generated and shown after creation.
              </div>
            )}

            {/* Notifications Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="notifyOrders"
                checked={formData.notifyOrders}
                onChange={(e) =>
                  setFormData({ ...formData, notifyOrders: e.target.checked })
                }
                className="h-4 w-4 cursor-pointer"
              />
              <label htmlFor="notifyOrders" className="cursor-pointer text-sm text-charcoal">
                Send WhatsApp notifications for new orders
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 rounded-full bg-rose px-6 py-3 font-semibold text-white hover:bg-rose-dark"
              >
                {editingId ? "Update Admin" : "Create Admin"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="flex-1 rounded-full border border-sand px-6 py-3 font-semibold text-charcoal hover:bg-sand/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="space-y-3">
        {admins.length === 0 ? (
          <div className="rounded-card border border-sand p-8 text-center">
            <p className="text-charcoal/60">No admins yet. Create one to get started.</p>
          </div>
        ) : (
          admins.map((admin) => (
            <div
              key={admin._id}
              className={`rounded-card border p-4 transition ${
                admin.role === "SUPER_ADMIN"
                  ? "border-rose-300 bg-rose-50"
                  : admin.isActive
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 bg-gray-50"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Admin Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-charcoal">{admin.name}</h3>
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${
                        admin.role === "SUPER_ADMIN"
                          ? "bg-rose text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {admin.role === "SUPER_ADMIN" ? "👑 SUPER_ADMIN" : "ADMIN"}
                    </span>
                    {!admin.isActive && (
                      <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        INACTIVE
                      </span>
                    )}
                  </div>

                  {/* Credentials */}
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      📧 <span className="font-mono text-charcoal">{admin.email}</span>
                    </p>
                    {admin.whatsappNumber && (
                      <p>
                        📱{" "}
                        <span className="font-mono text-charcoal">{admin.whatsappNumber}</span>
                      </p>
                    )}
                    {admin.notifyOrders && (
                      <p className="text-emerald-700">✓ Receives order notifications</p>
                    )}
                    {!admin.notifyOrders && (
                      <p className="text-gray-500">✗ Notifications disabled</p>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-charcoal/50">
                    Joined: {new Date(admin.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 sm:whitespace-nowrap">
                  {admin.role !== "SUPER_ADMIN" && (
                    <>
                      <button
                        onClick={() => startEdit(admin)}
                        className="rounded-full border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin._id)}
                        className="rounded-full border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        🗑 Remove
                      </button>
                    </>
                  )}
                  {admin.role === "SUPER_ADMIN" && (
                    <p className="px-4 py-2 text-xs text-charcoal/60">
                      Main admin account (cannot be edited)
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Back Button */}
      <div className="mt-8 flex gap-2">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-sm text-charcoal/60 hover:text-rose-dark"
        >
          ← Back to dashboard
        </button>
      </div>
    </div>
  );
}
