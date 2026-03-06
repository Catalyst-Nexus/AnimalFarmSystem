import { supabase } from './supabase'

/**
 * Facility Filter Service
 * 
 * Provides utility functions to filter data based on user's assigned facilities.
 * All users can only see data from facilities they are assigned to via the user_facilities table.
 */

export interface UserFacilityInfo {
  facilityIds: string[]
  insertId: string | null
  hasFacilities: boolean
}

/**
 * Get the raw facility_id values assigned to a user (facilities.id values).
 * Used internally for access checks.
 */
const getRawFacilityIds = async (userId: string): Promise<string[]> => {
  if (!supabase || !userId) return []
  try {
    const { data, error } = await supabase
      .from('user_facilities')
      .select('facility_id')
      .eq('user_id', userId)
    if (error) return []
    return (data || []).map(item => item.facility_id).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Get the user_facilities.id to use when INSERTING records in module2/module3 tables.
 * The user_facility_id column in those tables is a FK to public.user_facilities.id.
 * @param userId - The authenticated user's ID
 * @returns The user_facilities.id for the first facility assignment, or null
 */
export const getUserFacilityInsertId = async (userId: string): Promise<string | null> => {
  if (!supabase || !userId) return null
  try {
    const { data, error } = await supabase
      .from('user_facilities')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single()
    if (error || !data) return null
    return data.id
  } catch {
    return null
  }
}

/**
 * Get all user_facilities.id values for all users sharing the same facility as the given user.
 * Used for filtering (SELECT) so that all users at the same facility see the same data.
 * @param userId - The user ID to fetch facilities for
 * @returns Array of user_facilities.id values across all users at the same facility
 */
export const getUserFacilityIds = async (userId: string): Promise<string[]> => {
  if (!supabase || !userId) {
    console.warn('Cannot fetch user facilities: missing supabase or userId')
    return []
  }

  try {
    // Step 1: get this user's facility references (facilities.id values)
    const rawIds = await getRawFacilityIds(userId)
    if (rawIds.length === 0) return []

    // Step 2: get ALL user_facilities.id rows that share those same facilities
    // so data is shared across all users assigned to the same facility
    const { data, error } = await supabase
      .from('user_facilities')
      .select('id')
      .in('facility_id', rawIds)

    if (error) {
      console.error('Error fetching shared facility junction IDs:', error)
      return []
    }

    return (data || []).map(item => item.id).filter(Boolean)
  } catch (err) {
    console.error('Exception in getUserFacilityIds:', err)
    return []
  }
}

/**
 * Get comprehensive facility information for a user
 * @param userId - The user ID to fetch facilities for
 * @returns Object containing facility IDs (for filtering), insertId (for creating), and hasFacilities flag
 */
export const getUserFacilityInfo = async (userId: string): Promise<UserFacilityInfo> => {
  const [facilityIds, insertId] = await Promise.all([
    getUserFacilityIds(userId),
    getUserFacilityInsertId(userId),
  ])
  return {
    facilityIds,
    insertId,
    hasFacilities: facilityIds.length > 0,
  }
}

/**
 * Apply facility filter to a Supabase query
 * Only returns data where user_facility_id matches one of the user's assigned facilities
 * 
 * @param query - The Supabase query builder
 * @param facilityIds - Array of facility IDs to filter by
 * @param columnName - The column name to filter (defaults to 'user_facility_id')
 * @returns The query with facility filter applied
 */
export const applyFacilityFilter = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  facilityIds: string[],
  columnName: string = 'user_facility_id'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  if (facilityIds.length === 0) {
    // If user has no facilities, return a query that will return no results
    // by filtering with a condition that can never be true
    return query.eq(columnName, '00000000-0000-0000-0000-000000000000')
  }

  if (facilityIds.length === 1) {
    return query.eq(columnName, facilityIds[0])
  }

  return query.in(columnName, facilityIds)
}

/**
 * Check if a user has access to a specific facility
 * @param userId - The user ID to check
 * @param facilityId - The facility ID to check access for
 * @returns True if the user has access to the facility
 */
export const userHasAccessToFacility = async (
  userId: string,
  facilityId: string
): Promise<boolean> => {
  if (!supabase || !userId || !facilityId) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('user_facilities')
      .select('facility_id')
      .eq('user_id', userId)
      .eq('facility_id', facilityId)
      .maybeSingle()

    if (error) {
      console.error('Error checking facility access:', error)
      return false
    }

    return !!data
  } catch (err) {
    console.error('Exception in userHasAccessToFacility:', err)
    return false
  }
}

/**
 * Validate that a user_facility_id is valid for the current user
 * Used when creating or updating records
 * @param userId - The user ID to check
 * @param facilityId - The facility ID to validate
 * @returns True if valid, false otherwise
 */
export const validateFacilityForUser = async (
  userId: string,
  facilityId: string | null | undefined
): Promise<boolean> => {
  if (!facilityId) {
    console.warn('No facility ID provided')
    return false
  }

  return await userHasAccessToFacility(userId, facilityId)
}
