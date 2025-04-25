import React, { createContext, useContext } from "react";
import Dexie from "dexie";

const db = new Dexie("ManhwaDB");

db.version(1).stores({
  site: "++idSite, name, baseUrl, isActive, language, lastChecked, imgUrl",
  manhwa:
    "++idManhwa, &[title+idSite], title, chapters, currentChapterUrl, lastReadChapter, isFavorite, status, lastTimeRead, imgUrl, idSite, genre, note, [status+title]",
});

const DbContext = createContext(null);

export const DbProvider = ({ children }) => {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};

export const useDb = () => {
  const context = useContext(DbContext);
  return context;
};
