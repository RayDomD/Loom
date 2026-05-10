import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Macro } from '@/lib/db';

export const DOUBLE_TAB_TABLE_MACRO_ID = 'double-tab-table';

const DEFAULT_MACRO: Macro = {
  id: DOUBLE_TAB_TABLE_MACRO_ID,
  label: 'Double Tab inserts 1x1 table',
  trigger: 'double-tab',
  action: 'insert-1x1-table',
  enabled: true,
  updatedAt: new Date().toISOString(),
};

export function useMacros() {
  const macros = useLiveQuery(() => db.macros.toArray(), []);

  useEffect(() => {
    void db.macros.get(DOUBLE_TAB_TABLE_MACRO_ID).then((macro) => {
      if (!macro) {
        return db.macros.put({
          ...DEFAULT_MACRO,
          updatedAt: new Date().toISOString(),
        });
      }

      return undefined;
    });
  }, []);

  const resolvedMacros = macros && macros.length > 0 ? macros : [DEFAULT_MACRO];
  const doubleTabTableMacro =
    resolvedMacros.find((macro) => macro.id === DOUBLE_TAB_TABLE_MACRO_ID) ?? DEFAULT_MACRO;

  const setMacroEnabled = async (id: string, enabled: boolean) => {
    const existing = await db.macros.get(id);
    const updatedAt = new Date().toISOString();

    if (existing) {
      await db.macros.update(id, { enabled, updatedAt });
      return;
    }

    await db.macros.put({
      ...DEFAULT_MACRO,
      id,
      enabled,
      updatedAt,
    });
  };

  return {
    macros: resolvedMacros,
    doubleTabTableMacro,
    setMacroEnabled,
  };
}
