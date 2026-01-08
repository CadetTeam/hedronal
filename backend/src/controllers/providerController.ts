import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const providerController = {
  /**
   * Get providers by category
   * Supports:
   * - GET /api/providers?category=Domain
   * - GET /api/providers/category/Domain
   */
  getByCategory: async (req: Request, res: Response) => {
    try {
      // Prefer route param, fall back to query param
      const category =
        (req.params.category as string) || (req.query.category as string | undefined);

      let query = supabase.from('providers').select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data: providers, error } = await query.order('company_name', { ascending: true });

      if (error) {
        console.error('[providerController] Supabase error:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.json({ providers: providers || [] });
    } catch (error: any) {
      console.error('[providerController] Get by category error:', error);
      return res.status(500).json({ error: 'Failed to fetch providers' });
    }
  },

  /**
   * Get all providers
   * GET /api/providers
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const { data: providers, error } = await supabase
        .from('providers')
        .select('*')
        .order('category', { ascending: true })
        .order('company_name', { ascending: true });

      if (error) {
        console.error('[providerController] Supabase error:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.json({ providers: providers || [] });
    } catch (error: any) {
      console.error('[providerController] Get all error:', error);
      return res.status(500).json({ error: 'Failed to fetch providers' });
    }
  },
};
