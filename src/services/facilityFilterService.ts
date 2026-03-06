import { supabase } from './supabase'

/**
 * Facility Filter Service
 * 
 * Provides utility functions to filter data based on user's assigned facilities.
 * All users can only see data from facilities they are assigned to via the user_facilities table.
 */

export interface UserFacilityInfo {
  facilityIds: string[]
  hasFacilities: boolean
}

/**
 * Get facility IDs assigned to a specific user
 * @param userId - The user ID to fetch facilities for
 * @returns Array of facility IDs the user is assigned to
 */
export const getUserFacilityIds = async (userId: string): Promise<string[]> => {
  if (!supabase || !userId) {
    console.warn('Cannot fetch user facilities: missing supabase or userId')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('user_facilities')
      .select('facilities_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user facility IDs:', error)
      return []
    }

    return (data || []).map(item => item.facilities_id).filter(Boolean)
  } catch (err) {
    console.error('Exception in getUserFacilityIds:', err)
    return []
  }
}

/**
 * Get comprehensive facility information for a user
 * @param userId - The user ID to fetch facilities for
 * @returns Object containing facility IDs and a flag indicating if the user has facilities
 */
export const getUserFacilityInfo = async (userId: string): Promise<UserFacilityInfo> => {
  const facilityIds = await getUserFacilityIds(userId)
  return {
    facilityIds,
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
      .select('facilities_id')
      .eq('user_id', userId)
      .eq('facilities_id', facilityId)
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
