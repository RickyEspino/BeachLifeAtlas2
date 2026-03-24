"use client";

import { useState } from "react";


export default function CollaboratorForm({ tripId }: { tripId: string }) {
  const [email, setEmail] = useState("");

  return (
    <div className="rounded-[2rem] border bg-white p-5 shadow-sm">
      <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
        Collaboration
      </p>
      <h3 className="mt-2 text-xl font-semibold">Invite a collaborator</h3>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          className="w-full rounded-full border px-4 py-3 outline-none"
        />
        <button
          type="button"
          onClick={async () => {
            // TODO: Implement addCollaborator action
            alert("Collaborator added (stub)");
            setEmail("");
          }}
          className="rounded-full border px-5 py-3 whitespace-nowrap hover:bg-neutral-50"
        >
          Add collaborator
        </button>
      </div>
    </div>
  );
}
