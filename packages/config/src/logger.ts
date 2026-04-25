export function createLogger(scope: string) {
  return {
    info: (message: string, metadata?: Record<string, unknown>) => {
      console.log(JSON.stringify({ level: "info", scope, message, metadata, timestamp: new Date().toISOString() }));
    },
    warn: (message: string, metadata?: Record<string, unknown>) => {
      console.warn(JSON.stringify({ level: "warn", scope, message, metadata, timestamp: new Date().toISOString() }));
    },
    error: (message: string, metadata?: Record<string, unknown>) => {
      console.error(JSON.stringify({ level: "error", scope, message, metadata, timestamp: new Date().toISOString() }));
    }
  };
}

