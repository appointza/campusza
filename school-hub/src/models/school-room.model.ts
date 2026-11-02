/** Organization room — same record for class homeroom, timetable, and exam seating. */
export interface SchoolRoom {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  capacity: number;
  rowsCount?: number;
  columnsCount?: number;
  /** Optional hint when room is usually a class homeroom; does not restrict exam use. */
  linkedClassId?: string;
  isActive?: boolean;
}
