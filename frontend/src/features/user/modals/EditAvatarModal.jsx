import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../../auth/authSlice";
import { updateProfileAvatar } from "../user.service";

export default function EditAvatarModal({ open, setOpen }) {
  const dispatch = useDispatch();
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setPreview("");
      setError("");
    }
  }, [open]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setPreview("");
      return;
    }

    if (!selected.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar los 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(typeof reader.result === "string" ? reader.result : "");
      setError("");
    };
    reader.readAsDataURL(selected);
  };

  const handleSave = async () => {
    if (!preview) {
      setError("Selecciona una imagen antes de guardar");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const updatedUser = await updateProfileAvatar(preview);
      dispatch(setUser(updatedUser));
      setOpen(false);
    } catch (err) {
      setError(err?.error || err?.message || "No se pudo actualizar el avatar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => (loading ? null : setOpen(false))} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded bg-gray-800 p-6 text-white">
          <Dialog.Title className="text-lg font-bold mb-3">Edit Avatar</Dialog.Title>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full mb-3 text-gray-300"
            disabled={loading}
          />
          {preview ? (
            <div className="mb-3 flex justify-center">
              <img
                src={preview}
                alt="Avatar preview"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-blue-500"
              />
            </div>
          ) : null}
          {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
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
              disabled={loading || !preview}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
