const cloudOnlyError = (): never => {
  throw new Error('Browser localStorage is disabled. This app runs in cloud-only mode.');
};

export const storage = {
  get<T>(...args: unknown[]): T {
    void args;
    return cloudOnlyError();
  },

  set(...args: unknown[]): void {
    void args;
    cloudOnlyError();
  },

  remove(...args: unknown[]): void {
    void args;
    cloudOnlyError();
  },

  clear(...args: unknown[]): void {
    void args;
    cloudOnlyError();
  },
};
