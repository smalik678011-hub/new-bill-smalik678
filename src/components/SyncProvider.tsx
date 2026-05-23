import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSyncing = useRef(false);
  const store = useAppStore();

  const sync = async () => {
    if (isSyncing.current) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    isSyncing.current = true;
    
    try {
      // Basic Sync Strategy:
      // For simplicity in this implementation, we will push the essential local data 
      // (Clients and Invoices) to Supabase using upsert.
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id);

      if (profiles && profiles.length > 0) {
        const bId = profiles[0].id;

        // Push clients
        const clientsToPush = store.clients.map(c => ({
          ...c,
          business_id: bId
        }));
        await supabase.from('clients').upsert(clientsToPush);

        // Push invoices
        const invoicesToPush = store.invoices.map(i => ({
            ...i,
            business_id: bId,
            // Assuming invoice structure matches DB, might need mapping
            // For now, simple upsert
        }));
        await supabase.from('invoices').upsert(invoicesToPush);

        toast.success('Offline records synced to cloud!', { id: 'sync-success' });
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      isSyncing.current = false;
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      toast('Back online! Syncing data...', { id: 'sync-status' });
      sync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [store.clients, store.invoices]); // Dependencies to ensure fresh data

  return <>{children}</>;
};
