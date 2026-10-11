import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, Trash2 } from 'lucide-react';
import type { JournalEntry } from '../core/types';

interface JournalScreenProps {
  journals: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}


export const JournalScreen: React.FC<JournalScreenProps> = ({
  journals,
  onSelectEntry,
  onDeleteEntry,
}) => {
  const [search, setSearch] = useState('');

  const filtered = journals.filter(
    (j) =>
      j.topic.toLowerCase().includes(search.toLowerCase()) ||
      j.coreInsight.toLowerCase().includes(search.toLowerCase()) ||
      j.quote.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-full pb-24 px-5 pt-3">
      <header className="flex justify-between items-center w-full py-3 shrink-0">
        <div className="flex flex-col">
          <h1 className="font-space text-[24px] font-bold text-[#F4F3EF] tracking-tight">
            My Journal
          </h1>
          <span className="text-[10px] font-space text-[#8E97A6] tracking-[0.2em] uppercase font-semibold">
            Walking reflections
          </span>
        </div>
      </header>

      {/* Search Input */}
      <div className="relative mt-3 mb-5">
        <Search className="w-4 h-4 text-[#8E97A6] absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search thoughts, questions, themes..."
          className="w-full bg-[#1B202A] border border-white/10 rounded-full pl-10 pr-4 py-2 text-[13px] text-[#F4F3EF] placeholder-[#5C6473] outline-none focus:border-[#A8E6E8]"
        />
      </div>

      {/* List */}
      <div className="space-y-3.5 flex-1">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-[#1B202A]/30 space-y-2 mt-4">
            <BookOpen className="w-8 h-8 text-[#5C6473] mx-auto" />
            <p className="text-[14px] text-[#A0A9B8]">
              {journals.length === 0
                ? 'No reflections recorded yet. Complete a walk to generate your first journal entry.'
                : 'No entries match your search.'}
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-[#A8E6E8]/40 transition-all cursor-pointer space-y-2.5 active:scale-98"
            >
              <div className="flex justify-between items-center text-[11px] text-[#8E97A6]">
                <span className="px-2.5 py-0.5 rounded-full bg-[#A8E6E8]/10 text-[#A8E6E8] font-space font-medium uppercase tracking-wider">
                  {entry.topic}
                </span>
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>

              <p className="font-instrument text-[20px] text-[#F4F3EF] italic leading-snug">
                "{entry.quote.text}"
              </p>

              <p className="text-[13px] font-inter text-[#A0A9B8] line-clamp-2">
                {entry.coreInsight}
              </p>

              <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[11px] text-[#8E97A6]">
                <span>{entry.durationMinutes} min walk · {entry.questionsReflected.length} prompts</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this reflection?')) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                    className="p-1 hover:text-[#E27D7D] transition-colors"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="flex items-center text-[#A8E6E8]">
                    Read <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
