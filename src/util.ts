export const getFilename = (namespace: string): string => `${namespace}.json`;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
