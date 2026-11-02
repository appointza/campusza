import apiClient, { ActionRes } from './api.service';
import axios from 'axios';
import type { SchoolRoom } from '@/models/school-room.model';
import { staffService } from './staff.service';

function orgReq(extra: Record<string, unknown> = {}) {
  return {
    organizationid: staffService.getOrganizationId(),
    email: staffService.getSessionEmail(),
    ...extra,
  };
}

function mapRoom(data: Record<string, unknown>): SchoolRoom {
  return {
    id: String(data.id ?? ''),
    name: String(data.name ?? ''),
    building: String(data.building ?? ''),
    floor: String(data.floor ?? ''),
    capacity: Number(data.capacity ?? 0),
    rowsCount: data.rowscount == null ? undefined : Number(data.rowscount),
    columnsCount: data.columnscount == null ? undefined : Number(data.columnscount),
    linkedClassId: String(data.linkedclassid ?? ''),
    isActive: data.isactive !== false,
  };
}

class SchoolRoomApi {
  private endpoint = '/campusza/SchoolRoom';

  async select(includeInactive = false): Promise<SchoolRoom[]> {
    const res = await apiClient.post<ActionRes<Record<string, unknown>[]>>(`${this.endpoint}/Select`, {
      item: { ...orgReq(), includeinactive: includeInactive },
    });
    return (res.data.item || []).map((r) => mapRoom(r as Record<string, unknown>));
  }

  async save(room: Partial<SchoolRoom>): Promise<SchoolRoom> {
    const rows = room.rowsCount != null && room.rowsCount > 0 ? room.rowsCount : null;
    const cols = room.columnsCount != null && room.columnsCount > 0 ? room.columnsCount : null;
    const res = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.endpoint}/Save`, {
      item: {
        ...orgReq(),
        room: {
          id: room.id || '',
          name: room.name || '',
          building: room.building || '',
          floor: room.floor || '',
          capacity: room.capacity ?? 0,
          rowscount: rows,
          columnscount: cols,
          linkedclassid: room.linkedClassId || '',
          isactive: room.isActive !== false,
        },
      },
    });
    return mapRoom(res.data.item as Record<string, unknown>);
  }
}

export const schoolRoomApi = new SchoolRoomApi();
