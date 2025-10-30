import { Dialog } from "@headlessui/react";
import { useState } from "react";

export default function EditNameModal({ open, setOpen }) {
  const [name, setName] = useState("");

  const handleSave = () => {
    console.log("Saving new name:", name);
    // TODO: call API to update username
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded bg-gray-800 p-6 text-white">
          <Dialog.Title className="text-lg font-bold mb-3">Edit Profile Name</Dialog.Title>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded bg-gray-700 p-2 mb-4"
            placeholder="New username"
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
