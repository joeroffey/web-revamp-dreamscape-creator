import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerSearchResult {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  tags?: string[];
}

interface UseCustomerSearchOptions {
  enabled?: boolean;
  limit?: number;
}

/**
 * Shared hook for searching customers by name (first or last), or email.
 * Performs server-side filtering with Supabase and client-side filtering for refined results.
 */
export function useCustomerSearch(searchTerm: string, options: UseCustomerSearchOptions = {}) {
  const { enabled = true, limit = 20 } = options;
  const trimmedSearch = searchTerm.trim().toLowerCase();

  // Fetch all customers when search is enabled (for Command component usage)
  // or perform server-side search for large datasets
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customer-search-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, tags')
        .order('full_name', { ascending: true })
        .limit(1000);

      if (error) throw error;
      return data as CustomerSearchResult[];
    },
    enabled,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Client-side filtering for better UX with Command component
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!trimmedSearch) return customers.slice(0, limit);

    const searchTerms = trimmedSearch.split(/\s+/).filter(Boolean);

    return customers.filter(customer => {
      const fullName = (customer.full_name || '').toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const phone = (customer.phone || '').toLowerCase();

      // Split name into parts for first/last name matching
      const nameParts = fullName.split(/\s+/).filter(Boolean);

      // Check if ALL search terms match at least one field
      return searchTerms.every(term => {
        // Check email
        if (email.includes(term)) return true;
        
        // Check phone
        if (phone.includes(term)) return true;
        
        // Check full name (concatenated)
        if (fullName.includes(term)) return true;
        
        // Check individual name parts (first name, last name, etc.)
        if (nameParts.some(part => part.startsWith(term) || part.includes(term))) return true;

        return false;
      });
    }).slice(0, limit);
  }, [customers, trimmedSearch, limit]);

  return {
    customers: filteredCustomers,
    allCustomers: customers || [],
    isLoading,
    searchTerm,
  };
}

/**
 * Server-side customer search for when we need fresh results
 * Use this for smaller result sets with debounced input
 */
export function useCustomerSearchServer(searchTerm: string, options: UseCustomerSearchOptions = {}) {
  const { enabled = true, limit = 10 } = options;
  const trimmedSearch = searchTerm.trim();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customer-search-server', trimmedSearch],
    queryFn: async () => {
      if (!trimmedSearch || trimmedSearch.length < 2) return [];

      // Split search term into parts for multi-word searching
      const searchParts = trimmedSearch.split(/\s+/).filter(Boolean);
      
      // Build OR conditions for each part matching name, email, or phone
      // This allows searching "john smith" to find "John Smith"
      const orConditions = searchParts.map(part => 
        `full_name.ilike.%${part}%,email.ilike.%${part}%,phone.ilike.%${part}%`
      ).join(',');

      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, tags')
        .or(orConditions)
        .order('full_name', { ascending: true })
        .limit(limit);

      if (error) throw error;
      
      // If searching with multiple terms, filter client-side to ensure ALL terms match
      if (searchParts.length > 1) {
        return (data as CustomerSearchResult[]).filter(customer => {
          const fullName = (customer.full_name || '').toLowerCase();
          const email = (customer.email || '').toLowerCase();
          const phone = (customer.phone || '').toLowerCase();
          
          return searchParts.every(term => {
            const lowerTerm = term.toLowerCase();
            return fullName.includes(lowerTerm) || 
                   email.includes(lowerTerm) || 
                   phone.includes(lowerTerm);
          });
        });
      }
      
      return data as CustomerSearchResult[];
    },
    enabled: enabled && trimmedSearch.length >= 2,
    staleTime: 10000,
  });

  return {
    customers: customers || [],
    isLoading,
    searchTerm: trimmedSearch,
  };
}
