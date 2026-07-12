import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { queryKeys } from '@/config/queryKeys';
import { mockBookings, mockAssets, mockEmployees, mockCategories, delay } from '@/config/mockData';

const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Fetch bookings with optional filters.
 *
 * @param {{
 *   status?: string,
 *   resourceId?: string,
 *   userId?: string,
 *   from?: string,
 *   to?: string,
 * }} [filters={}]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useBookings(filters = {}) {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: async () => {
      if (useMock) {
        await delay();
        let list = [...mockBookings];
        if (filters.status) {
          list = list.filter((b) => b.status === filters.status);
        }
        if (filters.resourceId) {
          list = list.filter((b) => b.resource_id === filters.resourceId);
        }
        if (filters.userId) {
          list = list.filter((b) => b.booked_by_id === filters.userId);
        }
        if (filters.from) {
          list = list.filter((b) => b.start_time >= filters.from);
        }
        if (filters.to) {
          list = list.filter((b) => b.end_time <= filters.to);
        }
        return list.map((b) => ({
          ...b,
          resource: mockAssets.find((a) => a.id === b.resource_id) || null,
          booked_by: mockEmployees.find((e) => e.id === b.booked_by_id) || null,
        }));
      }

      let query = supabase
        .from('bookings')
        .select(`
          *,
          resource:assets ( id, asset_tag, name, location ),
          booked_by:users!bookings_booked_by_id_fkey ( id, name, email )
        `)
        .order('start_time', { ascending: true });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId);
      }

      if (filters.userId) {
        query = query.eq('booked_by_id', filters.userId);
      }

      // Date range filter for calendar views
      if (filters.from) {
        query = query.gte('start_time', filters.from);
      }

      if (filters.to) {
        query = query.lte('end_time', filters.to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch a single booking by ID.
 *
 * @param {string} id
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useBooking(id) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: async () => {
      if (useMock) {
        await delay();
        const b = mockBookings.find((bk) => bk.id === id);
        if (!b) throw new Error('Booking not found');
        const resource = mockAssets.find((a) => a.id === b.resource_id) || null;
        return {
          ...b,
          resource: resource
            ? {
                ...resource,
                category: mockCategories.find((c) => c.id === resource.category_id) || null,
              }
            : null,
          booked_by: mockEmployees.find((e) => e.id === b.booked_by_id) || null,
        };
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          resource:assets ( id, asset_tag, name, location, category:asset_categories ( id, name ) ),
          booked_by:users!bookings_booked_by_id_fkey ( id, name, email )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch bookings for a specific resource within a date range (calendar view).
 *
 * @param {string} resourceId
 * @param {{ from: string, to: string }} range  ISO date strings
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useResourceCalendar(resourceId, range) {
  return useQuery({
    queryKey: queryKeys.bookings.calendar({ resourceId, ...range }),
    queryFn: async () => {
      if (useMock) {
        await delay();
        return mockBookings
          .filter((b) => b.resource_id === resourceId && b.status !== 'cancelled')
          .map((b) => ({
            ...b,
            booked_by: mockEmployees.find((e) => e.id === b.booked_by_id) || null,
          }));
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booked_by:users!bookings_booked_by_id_fkey ( id, name )
        `)
        .eq('resource_id', resourceId)
        .neq('status', 'cancelled')
        .gte('start_time', range.from)
        .lte('end_time', range.to)
        .order('start_time');

      if (error) throw error;
      return data;
    },
    enabled: !!resourceId && !!range?.from && !!range?.to,
  });
}

/**
 * Fetch bookings for the currently logged-in user ("My Bookings").
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useMyBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.list({ scope: 'mine' }),
    queryFn: async () => {
      if (useMock) {
        await delay();
        // emp-4 (Jane Doe) is our mock employee
        return mockBookings
          .filter((b) => b.booked_by_id === 'emp-4' && ['upcoming', 'ongoing'].includes(b.status))
          .map((b) => ({
            ...b,
            resource: mockAssets.find((a) => a.id === b.resource_id) || null,
          }));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          resource:assets ( id, asset_tag, name, location )
        `)
        .eq('booked_by_id', user.id)
        .in('status', ['upcoming', 'ongoing'])
        .order('start_time');

      if (error) throw error;
      return data;
    },
  });
}

