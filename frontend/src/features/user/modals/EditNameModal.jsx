import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, normalizeUser } from "../../auth/authSlice";
import { updateProfileName } from "../user.service";

export default function EditNameModal({ open, setOpen }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => normalizeUser(state.auth.user));
  const [name, setName] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(user?.username || "");
      setError("");
    }
  }, [open, user?.username]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre no puede estar vacío");
      return;
    }

    if (trimmed === user?.username) {
      setError("Debes ingresar un nombre diferente");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const updatedUser = await updateProfileName(trimmed);
      dispatch(setUser(updatedUser));
      setOpen(false);
    } catch (err) {
      setError(err?.error || err?.message || "No se pudo actualizar el nombre");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => (loading ? null : setOpen(false))} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded bg-gray-800 p-6 text-white">
          <Dialog.Title className="text-lg font-bold mb-3">Edit Profile Name</Dialog.Title>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded bg-gray-700 p-2 mb-2"
            placeholder="New username"
            disabled={loading}
          />
          {error ? <p className="mb-2 text-sm text-red-400">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1 rounded bg-gray-600 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded bg-blue-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
