import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const EditModeContext = createContext(null);

// Fournit isAdmin (session Supabase active) et isEditMode (mode édition
// inline activé sur les pages publiques). isEditMode ne peut jamais être
// vrai pour un visiteur non authentifié, même si sessionStorage est manipulé
// côté client : toute écriture réelle reste protégée par les policies RLS.
export function EditModeProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditMode, setIsEditModeState] = useState(false);
    const [checkedSession, setCheckedSession] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAdmin(!!session);
            setCheckedSession(true);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAdmin(!!session);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!checkedSession) return;
        if (!isAdmin) {
            setIsEditModeState(false);
            sessionStorage.removeItem('gesta_edit_mode');
            return;
        }
        if (sessionStorage.getItem('gesta_edit_mode') === 'true') setIsEditModeState(true);
    }, [isAdmin, checkedSession]);

    const setIsEditMode = (value) => {
        if (!isAdmin) return;
        setIsEditModeState(value);
        sessionStorage.setItem('gesta_edit_mode', value ? 'true' : 'false');
    };

    return (
        <EditModeContext.Provider value={{ isAdmin, isEditMode, setIsEditMode }}>
            {children}
        </EditModeContext.Provider>
    );
}

export function useEditMode() {
    return useContext(EditModeContext);
}
