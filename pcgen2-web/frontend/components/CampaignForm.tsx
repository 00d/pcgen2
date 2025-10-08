'use client';

import { useState, useEffect } from 'react';

interface Campaign {
  _id?: string;
  name: string;
  description?: string;
  setting?: string;
  dungeon_master?: string;
  notes?: string;
}

interface Props {
  campaign?: Campaign;
  onSubmit: (campaign: Campaign) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SETTINGS = [
  'Pathfinder 1e',
  'Pathfinder 2e',
  'Golarion (Pathfinder Setting)',
  'Forgotten Realms (D&D 5e)',
  'Eberron',
  'Ravnica',
  'Waterdeep',
  'Greyhawk',
  'Custom Setting',
];

export default function CampaignForm({
  campaign,
  onSubmit,
  onCancel,
  isLoading = false,
}: Props) {
  const [formData, setFormData] = useState<Campaign>(
    campaign || {
      name: '',
      description: '',
      setting: 'Pathfinder 1e',
      dungeon_master: '',
      notes: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (campaign) {
      setFormData(campaign);
    }
  }, [campaign]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (formData.name.trim().length < 2) {
      newErrors.name = 'Campaign name must be at least 2 characters';
    }

    if (formData.name.trim().length > 100) {
      newErrors.name = 'Campaign name cannot exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {campaign ? 'Edit Campaign' : 'Create New Campaign'}
        </h2>
      </div>

      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Rise of the Runelords"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Setting */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Campaign Setting
        </label>
        <select
          name="setting"
          value={formData.setting || 'Pathfinder 1e'}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {SETTINGS.map((setting) => (
            <option key={setting} value={setting}>
              {setting}
            </option>
          ))}
        </select>
      </div>

      {/* Dungeon Master */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Dungeon Master Name
        </label>
        <input
          type="text"
          name="dungeon_master"
          value={formData.dungeon_master || ''}
          onChange={handleChange}
          placeholder="e.g., John Smith"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Brief description of your campaign..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Campaign Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Additional notes, plot points, NPCs, etc..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition-colors"
        >
          {isLoading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 py-3 rounded-lg font-bold transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200 text-sm text-blue-800">
        <p className="font-bold mb-2">Campaign Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use descriptive names to help organize your campaigns</li>
          <li>Add notes about plot hooks, NPCs, and campaign progression</li>
          <li>You can add characters to campaigns after creation</li>
          <li>Settings help organize campaigns by rule system</li>
        </ul>
      </div>
    </form>
  );
}
