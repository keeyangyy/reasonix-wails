import { app } from "../lib/bridge";

export const desktopProjectAdapter = {
  renameLocal: (id: string, title: string) => app.RenameTopic(id, title),
};
