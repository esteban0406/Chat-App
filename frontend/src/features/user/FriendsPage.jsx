import FriendList from "../invites/FriendList";
import InviteForm from "../invites/InviteForm";
import InviteList from "../invites/InviteList";

export default function FriendsPage() {
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      {/* Sidebar secundario: menú de amigos */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4">
        <h2 className="text-gray-300 font-semibold mb-4">Amigos</h2>
        <nav className="flex flex-col space-y-2">
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 transition">
            Todos
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 transition">
            Conectados
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 transition">
            Pendientes
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 transition">
            Bloqueados
          </button>
        </nav>

        <div className="mt-6">
          <InviteForm />
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col bg-gray-900 p-6 overflow-y-auto">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Mis amigos</h1>
        </header>

        <section className="flex-1">
          <FriendList />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Solicitudes</h2>
          <InviteList />
        </section>
      </main>
    </div>
  );
}
