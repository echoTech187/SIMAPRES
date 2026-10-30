// Helper untuk mengambil nama kesatuan Mako yang didisposisikan terakhir kali
export const getLastDispatchedStationName = (item: any, offices: any[] = []): string => {
  if (!item) return '';
  // 1. Cek dispatches terakhir
  const dispatches = Array.isArray(item.dispatches) ? item.dispatches : [];
  if (dispatches.length > 0) {
    const lastDisp = dispatches[dispatches.length - 1];
    if (lastDisp?.station?.station_name) return lastDisp.station.station_name;
    if (lastDisp?.station?.name) return lastDisp.station.name;
    if (lastDisp?.stationName) return lastDisp.stationName;
    if (lastDisp?.station_id) {
      const found = offices.find((po: any) => String(po.id) === String(lastDisp.station_id));
      if (found?.station_name) return found.station_name;
      if (found?.name) return found.name;
    }
  }

  // 2. Cek audit logs untuk tindakan DISPOSISI_LINTAS_WILAYAH
  const logs = item.complaint_logs || item.complaintLogs || item.auditLogs || [];
  if (Array.isArray(logs) && logs.length > 0) {
    for (let i = logs.length - 1; i >= 0; i--) {
      const l = logs[i];
      if ((l.action === 'DISPOSISI_LINTAS_WILAYAH' || l.action === 'CROSS_JURISDICTION_DISPATCHED') && l.notes) {
        const match = l.notes.match(/Ke:\s*([^|➔\n]+)/i) || l.notes.match(/ke\s+([^.\n|➔]+)/i);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
  }

  // 3. Cek station complaint utama
  if (item.station?.station_name) return item.station.station_name;
  if (item.station?.name) return item.station.name;
  if (item.stationName) return item.stationName;
  if (item.station_id || item.stationId) {
    const sid = item.station_id || item.stationId;
    const found = offices.find((po: any) => String(po.id) === String(sid));
    if (found?.station_name) return found.station_name;
    if (found?.name) return found.name;
  }

  return '';
};

// Helper untuk mengambil station_id kesatuan Mako yang didisposisikan terakhir kali
export const getLastDispatchedStationId = (item: any, offices: any[] = []): number | string | null => {
  if (!item) return null;
  // 1. Cek dispatches terakhir
  const dispatches = Array.isArray(item.dispatches) ? item.dispatches : [];
  if (dispatches.length > 0) {
    const lastDisp = dispatches[dispatches.length - 1];
    if (lastDisp?.station_id) return lastDisp.station_id;
    if (lastDisp?.station?.id) return lastDisp.station.id;
  }

  // 2. Cek audit logs untuk tindakan DISPOSISI_LINTAS_WILAYAH
  const logs = item.complaint_logs || item.complaintLogs || item.auditLogs || [];
  if (Array.isArray(logs) && logs.length > 0) {
    for (let i = logs.length - 1; i >= 0; i--) {
      const l = logs[i];
      if ((l.action === 'DISPOSISI_LINTAS_WILAYAH' || l.action === 'CROSS_JURISDICTION_DISPATCHED') && l.notes) {
        const idMatch = l.notes.match(/ID:\s*([0-9]+)/i);
        if (idMatch && idMatch[1]) {
          return idMatch[1];
        }
        const match = l.notes.match(/Ke:\s*([^|➔\n]+)/i) || l.notes.match(/ke\s+([^.\n|➔]+)/i);
        if (match && match[1]) {
          const targetName = match[1].trim().toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '');
          const found = offices.find((po: any) => {
            const pName = (po.station_name || po.name || '').toLowerCase().replace(/^(polres|polresta|polsek)\s+/, '').trim();
            return pName === targetName;
          });
          if (found?.id) return found.id;
        }
      }
    }
  }

  // 3. Cek station complaint utama
  if (item.station_id || item.stationId || item.station?.id) {
    return item.station_id || item.stationId || item.station?.id;
  }

  return null;
};
