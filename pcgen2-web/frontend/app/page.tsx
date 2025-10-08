'use client';

import Link from 'next/link';
import { useAppSelector } from '../redux/hooks';

export default function Home() {
  const { token } = useAppSelector((state) => state.auth);

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">PCGen2</h1>
      <p className="text-xl text-gray-600 mb-8">
        A modern web-based character generator for Pathfinder and other tabletop RPGs
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <p className="text-gray-600 mb-6">
            Create and manage your tabletop RPG characters with ease. Build heroes, configure abilities, and track
            your adventures.
          </p>
          {!token ? (
            <div className="flex gap-4 justify-center">
              <Link href="/register" className="btn btn-primary">
                Register
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Login
              </Link>
            </div>
          ) : (
            <Link href="/dashboard" className="btn btn-primary inline-block">
              Go to Dashboard
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li>✓ Character creation with multiple races and classes</li>
            <li>✓ Multiclass support</li>
            <li>✓ Print-friendly character sheets</li>
            <li>✓ Save and manage multiple characters</li>
            <li>✓ Game rules references</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
