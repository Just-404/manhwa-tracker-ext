import { useDb } from "./DbContext";
import { useMemo } from "react";

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
          isActive: true,
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

    const getManhwas = async (page = 1, pageSize = 20, sortBy = "title") => {
      const offset = (page - 1) * pageSize;
      if (!db || !db.manhwa) {
        console.error("Database or manhwa table not initialized", db);
        return { manhwasAndSite: [], total: 0 };
      }

      const count = await db.manhwa.count();

      const manhwas = await db.manhwa
        .orderBy(sortBy)
        .offset(offset)
        .limit(pageSize)
        .toArray();

      const manhwasAndSite = await Promise.all(
        manhwas.map(async (manhwa) => {
          const site = await db.site.get(manhwa.idSite);
          return { manhwa, site };
        })
      );
      return { manhwasAndSite, total: count };
    };

    const updateMahwa = async (id, newManhwa) => {
      return await db.manhwa.update(id, newManhwa);
    };

    const deleteManhwa = async (id) => {
      return await db.manhwa.delete(id);
    };

    const exportDataBase = async (a) => {
      const manhwas = await db.manhwa.toArray();
      const sites = await db.site.toArray();
      const dateNow = new Date();

      const exportData = {
        metadata: {
          exportedAt: dateNow.toISOString(),
          dbversion: 2,
        },
        manhwas,
        sites,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `manhwa_backup_${dateNow
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;

      a.onclick = () => {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    };

    const importDatabase = async (file) => {
      const fileTxt = await file.text();
      const data = JSON.parse(fileTxt);

      if (data.manhwas) {
        await db.manhwa.clear();
        await db.manhwa.bulkAdd(data.manhwas);
      }

      if (data.sites) {
        await db.site.clear();
        await db.site.bulkAdd(data.sites);
      }
    };
    return {
      addManhwaWithSite,
      getManhwas,
      updateMahwa,
      deleteManhwa,
      importDatabase,
      exportDataBase,
    };
  }, [db]);
};
