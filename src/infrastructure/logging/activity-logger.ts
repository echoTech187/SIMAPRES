// SIMAPRES 110 - User Log Activity Service
import { prisma } from '@/infrastructure/db/prisma.client';
import { serializeBigInt, SerializedBigInt } from '@/lib/serialization';
import { ActionResult, actionSuccess, actionFailure, getErrorMessage } from '@/types/action.types';

export interface UserActivityInput {
  userId?: string | bigint | null;
  identifier: string;
  userName: string;
  role: string;
  activityType:
    | 'LOGIN'
    | 'LOGOUT'
    | 'INACTIVITY_TIMEOUT'
    | 'ACCESS_CONSOLE'
    | 'REGISTER_UNIT'
    | 'UPDATE_UNIT'
    | 'DELETE_UNIT'
    | 'DISPOSISI_COMPLAINT'
    | 'UPDATE_COMPLAINT_STATUS'
    | 'FIELD_STEP_UPDATE'
    | 'CREATE_LOGBOOK'
    | string;
  description: string;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserActivityRecord {
  id: bigint | number;
  user_id?: bigint | number | null;
  identifier: string;
  user_name: string;
  role: string;
  activity_type: string;
  description: string;
  endpoint?: string | null;
  ip_address?: string | null;
  created_at: Date;
}

export async function logUserActivity(params: UserActivityInput): Promise<boolean> {
  try {
    const uId = params.userId ? BigInt(params.userId.toString()) : null;
    await prisma.$executeRawUnsafe(
      `INSERT INTO user_log_activities 
        (user_id, identifier, user_name, role, activity_type, description, endpoint, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      uId,
      params.identifier,
      params.userName,
      params.role,
      params.activityType,
      params.description,
      params.endpoint || null,
      params.ipAddress || null,
      params.userAgent || null
    );
    return true;
  } catch (error) {
    console.error('[UserActivityLog] Gagal mencatat log aktivitas:', error);
    return false;
  }
}

export async function getRecentUserActivitiesAction(
  limit = 100
): Promise<ActionResult<SerializedBigInt<UserActivityRecord[]>>> {
  try {
    const rows = await prisma.$queryRawUnsafe<UserActivityRecord[]>(
      `SELECT id, user_id, identifier, user_name, role, activity_type, description, endpoint, ip_address, created_at
       FROM user_log_activities
       ORDER BY created_at DESC
       LIMIT ?`,
      limit
    );
    return actionSuccess(serializeBigInt(rows));
  } catch (error: unknown) {
    return actionFailure(getErrorMessage(error));
  }
}


