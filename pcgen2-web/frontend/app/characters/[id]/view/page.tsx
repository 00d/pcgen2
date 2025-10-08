'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getCharacterById } from '@/redux/slices/characterSlice';
import Link from 'next/link';

export default function CharacterViewPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const characterId = params.id as string;
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'equipment' | 'spells'>('stats');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { currentCharacter: character, isLoading, error } = useAppSelector((state) => state.character);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (characterId && user?.id) {
      dispatch(getCharacterById({ characterId, userId: user.id }) as any);
    }
  }, [characterId, user?.id, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading character...</div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-2xl text-red-600 mb-4">Error loading character</div>
        <div className="text-gray-600 mb-6">{error}</div>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const raceName = typeof character.attributes?.race === 'object'
    ? character.attributes.race.name
    : 'No Race';

  const className = character.attributes?.classes?.[0]?.name || 'No Class';
  const classLevel = character.attributes?.classes?.[0]?.level || 1;
  const hitDie = character.attributes?.classes?.[0]?.hitDie || 'd8';

  const abilities = character.attributes?.abilityScores || {};
  const getModifier = (ability: string) => {
    const score = abilities[ability as keyof typeof abilities]?.total || 10;
    return Math.floor((score - 10) / 2);
  };

  const hp = character.derivedStats?.hitPoints?.max || 0;
  const ac = character.derivedStats?.armorClass?.total || 10;
  const bab = character.derivedStats?.baseAttackBonus || 0;
  const initiative = character.derivedStats?.initiative || 0;

  const savingThrows = character.derivedStats?.savingThrows || {};

  const handleExportJSON = async () => {
    window.location.href = `/api/characters/${character._id}/export/json`;
    setShowExportMenu(false);
  };

  const handleExportMarkdown = async () => {
    window.location.href = `/api/characters/${character._id}/export/markdown`;
    setShowExportMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{character.name}</h1>
              <p className="text-blue-100 text-lg">
                {raceName} {className} {classLevel > 1 ? `Level ${classLevel}` : ''}
              </p>
              <p className="text-blue-100 text-sm mt-1">Campaign: {character.campaign || 'No Campaign'}</p>
            </div>
            <div className="text-right flex gap-2">
              <button
                onClick={() => router.push(`/characters/${character._id}/edit/abilities`)}
                className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50"
              >
                ✎ Edit
              </button>
              <button
                onClick={() => router.push(`/characters/${character._id}/print`)}
                className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50"
              >
                🖨️ Print
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50"
                >
                  💾 Export ▼
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white text-gray-800 rounded shadow-lg border border-gray-300 z-20">
                    <button
                      onClick={handleExportJSON}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-50 font-medium"
                    >
                      📋 JSON
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-50 font-medium"
                    >
                      📝 Markdown
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-2 px-2 font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stats & Combat
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`pb-2 px-2 font-medium transition-colors ${
                activeTab === 'skills'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Skills
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`pb-2 px-2 font-medium transition-colors ${
                activeTab === 'equipment'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Equipment & Feats
            </button>
            <button
              onClick={() => setActiveTab('spells')}
              className={`pb-2 px-2 font-medium transition-colors ${
                activeTab === 'spells'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Spells
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ability Scores */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ability Scores</h2>
              <div className="space-y-3">
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((ability) => {
                  const score = abilities[ability as keyof typeof abilities]?.total || 10;
                  const mod = getModifier(ability);
                  return (
                    <div key={ability} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-semibold text-gray-700 uppercase w-12">{ability}</span>
                      <span className="text-2xl font-bold text-blue-600">{score}</span>
                      <span className="text-sm text-gray-600">
                        {mod >= 0 ? '+' : ''}{mod}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Combat Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Combat</h2>
              <div className="space-y-4">
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-gray-600 text-sm">Hit Points</p>
                  <p className="text-3xl font-bold text-red-600">{hp}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-gray-600 text-sm">Armor Class</p>
                  <p className="text-3xl font-bold text-blue-600">{ac}</p>
                </div>
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-gray-600 text-sm">Base Attack Bonus</p>
                  <p className="text-3xl font-bold text-green-600">{bab >= 0 ? '+' : ''}{bab}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-gray-600 text-sm">Initiative</p>
                  <p className="text-3xl font-bold text-yellow-600">{initiative >= 0 ? '+' : ''}{initiative}</p>
                </div>
              </div>
            </div>

            {/* Saving Throws */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Saving Throws</h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm">Fortitude</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(savingThrows.fortitude || 0) >= 0 ? '+' : ''}{savingThrows.fortitude || 0}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm">Reflex</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(savingThrows.reflex || 0) >= 0 ? '+' : ''}{savingThrows.reflex || 0}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm">Will</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(savingThrows.will || 0) >= 0 ? '+' : ''}{savingThrows.will || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Skills</h2>
            {character.skills && character.skills.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2 px-4 font-semibold text-gray-700">Skill</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Ability</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Ranks</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Ability Mod</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Class Bonus</th>
                      <th className="text-center py-2 px-4 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {character.skills.map((skill, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-2 px-4 font-medium text-gray-800">{skill.skillName}</td>
                        <td className="py-2 px-4 text-center text-gray-600">{skill.abilityModifier}</td>
                        <td className="py-2 px-4 text-center text-gray-600">{skill.ranks}</td>
                        <td className="py-2 px-4 text-center text-gray-600">
                          {skill.abilityModifier >= 0 ? '+' : ''}{skill.abilityModifier}
                        </td>
                        <td className="py-2 px-4 text-center text-gray-600">
                          {skill.isClassSkill ? '+3' : '—'}
                        </td>
                        <td className="py-2 px-4 text-center font-bold text-blue-600">{skill.total || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No skills allocated yet.</p>
            )}
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Equipment List */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Equipment</h2>
              {character.equipment && character.equipment.length > 0 ? (
                <div className="space-y-2">
                  {character.equipment.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="text-gray-600">
                        {item.quantity}x {item.weight} lb{item.weight !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No equipment selected.</p>
              )}
            </div>

            {/* Feats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Feats</h2>
              {character.feats && character.feats.length > 0 ? (
                <div className="space-y-2">
                  {character.feats.map((feat, idx) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="font-medium text-gray-800">{feat.name}</p>
                      <p className="text-xs text-gray-600">{feat.type}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No feats selected.</p>
              )}
            </div>
          </div>
        )}

        {/* Spells Tab */}
        {activeTab === 'spells' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Spells</h2>
            {character.spells?.spellsKnown && character.spells.spellsKnown.length > 0 ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
                  const spellsAtLevel = character.spells?.spellsKnown?.filter((s) => s.level === level) || [];
                  if (spellsAtLevel.length === 0) return null;
                  return (
                    <div key={level} className="border-l-4 border-blue-400 pl-4">
                      <h3 className="font-bold text-gray-800 mb-2">
                        Level {level} {level === 0 ? '(Cantrips)' : ''}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {spellsAtLevel.map((spell, idx) => (
                          <div key={idx} className="p-2 bg-blue-50 rounded">
                            <p className="font-medium text-gray-800">{spell.name}</p>
                            <p className="text-xs text-gray-600">{spell.school}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600">No spells known.</p>
            )}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
