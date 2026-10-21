import { useDb } from "./DbContext";
import { useMemo } from "react";
import ManhwaStatus from "../js/utils/enums";
import { getStaleWindow } from "../js/utils/settings";

export const useDexie = () => {
  const db = useDb();

  return useMemo(() => {
    const addManhwaWithSite = async (siteData, manhwaData, confirmUpdateCb) => {
      let siteId;
      // if the site doesn't exists, the it is created
      const existingSite = await db.site
        .where("baseUrl")
        .equals(siteData.baseUrl)
        .first();

      if (existingSite) {
        siteId = existingSite.idSite;
      } else {
        siteId = await db.site.add({
          ...siteData,
          isActive: 1,
          lastChecked: new Date().toISOString(),
        });
      }

      // If the manhwa exists in the same site, it asks the user to update last read ch
      const existingManhwaOnSite = await db.manhwa
        .where("[title+idSite]")
        .equals([manhwaData.title, siteId])
        .first();

      if (existingManhwaOnSite) {
        const confirmation = await confirmUpdateCb(
          existingManhwaOnSite,
          manhwaData.lastReadChapter
        );

        if (confirmation) {
          await db.transaction("rw", db.manhwa, db.site, async () => {
            await db.manhwa.update(existingManhwaOnSite.idManhwa, {
              ...existingManhwaOnSite,
              lastReadChapter: manhwaData.lastReadChapter,
              lastTimeRead: new Date().toISOString(),
              currentChapterUrl: manhwaData.currentChapterUrl,
            });
          });
          return { updated: true, id: existingManhwaOnSite.idManhwa };
        } else {
          return { skipped: true };
        }
      }

      const newId = await db.manhwa.add({
        ...manhwaData,
        idSite: siteId,
        lastTimeRead: new Date().toISOString(),
      });

      return { added: true, id: newId };
    };

    const getManhwas = async (page = 1, pageSize = 20, sortBy) => {
      const offset = (page - 1) * pageSize;
      if (!db || !db.manhwa) {
        console.error("Database or manhwa table not initialized", db);
        return { manhwasAndSite: [], total: 0 };
      }

      let manhwas, count;

      if (sortBy) {
        manhwas = await db.manhwa
          .where("[status+title]")
          .between([sortBy, ""], [sortBy, "\uffff"])
          .offset(offset)
          .limit(pageSize)
          .toArray();

        count = await db.manhwa.where("status").equals(sortBy).count();
      } else {
        manhwas = await db.manhwa
          .orderBy("title")
          .offset(offset)
          .limit(pageSize)
          .toArray();

        count = await db.manhwa.count();
      }
      const manhwasAndSite = await Promise.all(
        manhwas.map(async (manhwa) => {
          const site = await db.site.get(manhwa.idSite);
          return { manhwa, site };
        })
      );
      return { manhwasAndSite, total: count };
    };

    const getFavoriteManhwas = async (page = 1, pageSize = 20) => {
      const offset = (page - 1) * pageSize;
      if (!db || !db.manhwa) {
        console.error("Database or manhwa table not initialized", db);
        return { manhwasAndSite: [], total: 0 };
      }

      const count = await db.manhwa.where("isFavorite").equals(1).count();

      // Orden por última lectura (más reciente primero). Se ordena en memoria
      // para no descartar favoritos sin lastTimeRead (que no son indexables).
      const allFavorites = await db.manhwa
        .where("isFavorite")
        .equals(1)
        .toArray();

      allFavorites.sort((a, b) => {
        const timeA = a.lastTimeRead ? new Date(a.lastTimeRead).getTime() : 0;
        const timeB = b.lastTimeRead ? new Date(b.lastTimeRead).getTime() : 0;
        return timeB - timeA;
      });

      const favorites = allFavorites.slice(offset, offset + pageSize);

      const manhwasAndSite = await Promise.all(
        favorites.map(async (manhwa) => {
          const site = await db.site.get(manhwa.idSite);
          return { manhwa, site };
        })
      );
      return { manhwasAndSite, total: count };
    };

    // Heurística temporal: manhwas que no se leen desde hace al menos
    // `thresholdDays` días. Se ordenan del más antiguo al más reciente.
    // El parámetro thresholdDays se traduce a una ventana [minDays, maxDays)
    // usando getStaleWindow, de modo que cada opción del selector
    // muestra solo su tramo correspondiente.
    const getStaleManhwas = async (page = 1, pageSize = 12, thresholdDays = 14) => {
      if (!db || !db.manhwa) {
        console.error("Database or manhwa table not initialized", db);
        return { manhwasAndSite: [], total: 0 };
      }

      const { minDays, maxDays } = getStaleWindow(thresholdDays);
      const DAY_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();

      const minCutoff = now - minDays * DAY_MS;           // inclusive lower bound
      const maxCutoff = maxDays === null ? null : now - maxDays * DAY_MS; // exclusive upper bound

      const allManhwas = await db.manhwa.toArray();

      const stale = allManhwas
        .filter((manhwa) => {
          if (!manhwa.lastTimeRead) return false;
          const lastRead = new Date(manhwa.lastTimeRead).getTime();
          if (Number.isNaN(lastRead)) return false;
          // Incluye si: más viejo que minCutoff (>= minDays) Y (sin tope O más reciente que maxCutoff)
          return lastRead <= minCutoff && (maxCutoff === null || lastRead > maxCutoff);
        })
        .sort(
          (a, b) =>
            new Date(a.lastTimeRead).getTime() -
            new Date(b.lastTimeRead).getTime()
        );

      const total = stale.length;
      const start = (page - 1) * pageSize;
      const paginated = stale.slice(start, start + pageSize);

      const manhwasAndSite = await Promise.all(
        paginated.map(async (manhwa) => {
          const site = await db.site.get(manhwa.idSite);
          return { manhwa, site };
        })
      );

      return { manhwasAndSite, total };
    };

    const searchByName = async (name, page = 1, pageSize = 20) => {
      if (name === "") {
        throw new Error("The search term is empty");
      }
      const loweredName = name.toLowerCase();

      const allManhwas = await db.manhwa.orderBy("title").toArray();
      const matchedManhwas = allManhwas.filter((m) =>
        m.title.toLowerCase().includes(loweredName)
      );

      const total = matchedManhwas.length;
      if (total === 0) {
        return { manhwasAndSite: [], total: 0 };
      }

      const start = (page - 1) * pageSize;
      const paginatedManhwas = matchedManhwas.slice(start, start + pageSize);

      const manhwasAndSite = await Promise.all(
        paginatedManhwas.map(async (manhwa) => {
          const site = await db.site.get(manhwa.idSite);
          return { manhwa, site };
        })
      );

      return { manhwasAndSite, total };
    };

    const updateMahwa = async (id, newManhwaInfo) => {
      return await db.manhwa.update(id, newManhwaInfo);
    };

    const updateSite = async (id, newSiteInfo) => {
      return await db.site.update(id, newSiteInfo);
    };

    const updateFavorite = async (idManhwa, fav) => {
      return await db.manhwa.update(idManhwa, { isFavorite: fav ? 1 : 0 });
    };

    const deleteManhwa = async (id) => {
      // Delete the manhwa first
      await db.manhwa.delete(id);
      // Then check if the site has any remaining manhwas and delete if orphaned
      // We need to get the manhwa's idSite first, but since we deleted it, 
      // we should track it before deletion or query all sites.
      // Simpler approach: check all sites for orphaned ones
      const sites = await db.site.toArray();
      for (const site of sites) {
        const count = await db.manhwa.where("idSite").equals(site.idSite).count();
        if (count === 0) {
          await db.site.delete(site.idSite);
        }
      }
    };

    const getLibraryStats = async () => {
      if (!db || !db.manhwa) {
        console.error("Database or manhwa table not initialized", db);
        return { total: 0, byStatus: {} };
      }

      // Single pass aggregation instead of N+1 queries
      const allManhwas = await db.manhwa.toArray();
      const total = allManhwas.length;
      const byStatus = {};

      // Initialize all statuses to 0
      Object.values(ManhwaStatus).forEach((status) => {
        byStatus[status] = 0;
      });

      // Aggregate in memory
      for (const m of allManhwas) {
        const status = m.status || ManhwaStatus.UNKNOWN;
        byStatus[status] = (byStatus[status] || 0) + 1;
      }

      return { total, byStatus };
    };

    const exportDataBase = async () => {
      const manhwas = await db.manhwa.toArray();
      const sites = await db.site.toArray();
      const dateNow = new Date();

      const exportData = {
        metadata: {
          exportedAt: dateNow.toISOString(),
          dbversion: db.verno,
        },
        manhwas,
        sites,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manhwa_backup_${dateNow
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.onclick = () => {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        document.body.removeChild(a);
      };

      return { message: "Exported correctly!" };
    };

    const importDatabase = async (file) => {
      const fileTxt = await file.text();
      let data;
      try {
        data = JSON.parse(fileTxt);
      } catch {
        throw new Error("Invalid JSON file");
      }

      // Validate structure
      if (!data || typeof data !== "object") {
        throw new Error("Invalid backup format");
      }
      if (!Array.isArray(data.manhwas) || !Array.isArray(data.sites)) {
        throw new Error("Backup missing required arrays (manhwas, sites)");
      }

      // Use transaction to ensure atomicity
      await db.transaction("rw", db.manhwa, db.site, async () => {
        if (data.manhwas.length) {
          await db.manhwa.clear();
          await db.manhwa.bulkAdd(data.manhwas);
        }
        if (data.sites.length) {
          await db.site.clear();
          await db.site.bulkAdd(data.sites);
        }
      });

      return { message: "Imported correctly!" };
    };
    return {
      addManhwaWithSite,
      getManhwas,
      searchByName,
      getFavoriteManhwas,
      getStaleManhwas,
      getLibraryStats,
      updateMahwa,
      updateFavorite,
      updateSite,
      deleteManhwa,
      importDatabase,
      exportDataBase,
    };
  }, [db]);
};
