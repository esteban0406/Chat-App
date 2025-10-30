import { Dialog } from "@headlessui/react";
import { useState } from "react";

export default function EditAvatarModal({ open, setOpen }) {
  const [file, setFile] = useState(null);

  const handleSave = () => {
    console.log("Uploading avatar:", file);
    // TODO: call API to upload avatar
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded bg-gray-800 p-6 text-white">
          <Dialog.Title className="text-lg font-bold mb-3">Edit Avatar</Dialog.Title>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full mb-4 text-gray-300"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="px-3 py-1 rounded bg-gray-600">
              Cancel
            </button>
            <button onClick={handleSave} className="px-3 py-1 rounded bg-blue-600">
              Save
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
