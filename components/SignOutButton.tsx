"use client";

export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="POST">
      <button
        type="submit"
        className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
