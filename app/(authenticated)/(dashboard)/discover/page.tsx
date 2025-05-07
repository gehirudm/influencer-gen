"use client";

import { getAuth, User } from 'firebase/auth';
import app from '@/lib/firebase';

export default function DiscoverPage() {
  const auth = getAuth(app);
  const user = auth.currentUser as User;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      {/* Add more user details as needed */}
    </div>
  );
}