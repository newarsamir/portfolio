"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, null);

  if (!configured) {
    return (
      <p className="mt-6 rounded-xl border border-line bg-surface p-4">
        Sign-in is off because the <code className="mono">ADMIN_PASSWORD</code> environment variable isn&apos;t set. Add
        it in Vercel, then redeploy.
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="mb-2 block font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="field"
          aria-describedby="login-msg"
          aria-invalid={state && !state.ok ? true : undefined}
        />
      </div>
      <button type="submit" className="btn btn-lime w-full" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </button>
      <p id="login-msg" role="alert" className="min-h-6 font-medium text-danger">
        {state && !state.ok ? state.message : ""}
      </p>
    </form>
  );
}
