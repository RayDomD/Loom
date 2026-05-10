'use client';

import { Keyboard } from 'lucide-react';
import { DOUBLE_TAB_TABLE_MACRO_ID, useMacros } from '@/hooks/useMacros';

export function SettingsView() {
  const { doubleTabTableMacro, setMacroEnabled } = useMacros();

  return (
    <div className="flex h-full flex-col px-8 py-7">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Settings
        </p>
        <h1 className="mt-1 text-[22px] font-bold text-gray-900">Macros</h1>
      </div>

      <section
        className="max-w-xl rounded-[10px] border border-black/[0.06] p-4"
        style={{
          background: 'rgba(255,255,255,0.52)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 text-gray-700">
              <Keyboard size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {doubleTabTableMacro.label}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Press Tab twice on an empty editor line to insert a 1x1 table.
              </p>
            </div>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={doubleTabTableMacro.enabled}
              onChange={(event) =>
                void setMacroEnabled(DOUBLE_TAB_TABLE_MACRO_ID, event.target.checked)
              }
              className="peer sr-only"
            />
            <span className="h-6 w-10 rounded-full bg-black/15 transition-colors peer-checked:bg-gray-800" />
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </label>
        </div>
      </section>
    </div>
  );
}
