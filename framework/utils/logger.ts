/**
 * Minimal structured logger. Emits single-line JSON so test logs stay
 * grep-able and machine-parseable in CI. Swap for pino/winston later if richer
 * transport is needed.
 */
export interface Logger {
  info: (event: string, fields?: Record<string, unknown>) => void;
  warn: (event: string, fields?: Record<string, unknown>) => void;
  error: (event: string, fields?: Record<string, unknown>) => void;
}

function emit(level: string, name: string, event: string, fields?: Record<string, unknown>): void {
  console.log(JSON.stringify({ level, logger: name, event, ...fields }));
}

export function getLogger(name: string): Logger {
  return {
    info: (event, fields) => emit("info", name, event, fields),
    warn: (event, fields) => emit("warn", name, event, fields),
    error: (event, fields) => emit("error", name, event, fields),
  };
}
