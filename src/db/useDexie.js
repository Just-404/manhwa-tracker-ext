import { useDb } from "./DbContext";

export const useDexie = () => {
  const db = useDb();
  const addManhwaWithSite = async (siteData, manhwaData) => {
    return await db.transaction("rw", db.manhwa, db.site, async () => {
      let siteId;

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

      return await db.manhwa.add({
        ...manhwaData,
        idSite: siteId,
        lastTimeRead: new Date().toISOString(),
      });
    });
  };

  const getManhwas = async (page = 1, pageSize = 20) => {
    const offset = (page - 1) * pageSize;

    return await db.manhwa.offset(offset).limit(pageSize).toArray();
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
};
