import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, UserCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CATEGORY_COLORS = {
  'Exequente':  'bg-blue-100 text-blue-700',
  'Executado':  'bg-red-100 text-red-700',
  'Depositário':'bg-amber-100 text-amber-700',
};

/**
 * PersonCombobox — input that lets the user type a free-text name OR
 * search the `people` table and select an existing person.
 *
 * Props:
 *   value       {string}  Controlled name string
 *   personId    {string}  UUID of the linked person (null if free-text)
 *   onSelect    {fn}      Called with { name, personId, cpf } on every change
 *   placeholder {string}
 *   disabled    {bool}
 */
const PersonCombobox = ({ value, personId, onSelect, placeholder, disabled }) => {
    const { user } = useAuth();
    const [inputValue, setInputValue] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    // Keep internal value in sync when parent changes value
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const search = useCallback((term) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!term || term.length < 1 || !user) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from('people')
                    .select('id, name, cpf, category')
                    .eq('user_id', user.id)
                    .ilike('name', `%${term}%`)
                    .order('name')
                    .limit(8);
                const res = data || [];
                setResults(res);
                setIsOpen(res.length > 0);
            } finally {
                setLoading(false);
            }
        }, 250);
    }, [user]);

    const handleChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        onSelect({ name: val, personId: null });
        search(val);
    };

    const handleSelect = (person) => {
        setInputValue(person.name);
        onSelect({ name: person.name, personId: person.id, cpf: person.cpf || null });
        setIsOpen(false);
        setResults([]);
    };

    return (
        <div ref={containerRef} className="relative">
            <Input
                value={inputValue}
                onChange={handleChange}
                onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                placeholder={placeholder || 'Pesquisar ou digitar nome…'}
                disabled={disabled}
                autoComplete="off"
            />

            {/* Loading spinner inside input */}
            {loading && (
                <div className="absolute right-3 top-2.5 pointer-events-none">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
            )}

            {/* Linked person indicator */}
            {!loading && personId && (
                <div className="absolute right-3 top-2.5 pointer-events-none">
                    <UserCircle2 className="h-4 w-4 text-blue-500" />
                </div>
            )}

            {/* Suggestions dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
                    {results.map((person) => (
                        <button
                            key={person.id}
                            type="button"
                            // mousedown fires before blur, so we prevent blur from closing the list
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(person); }}
                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 text-left gap-3 border-b border-slate-100 last:border-0"
                        >
                            <span className="font-medium text-slate-800 text-sm truncate">{person.name}</span>
                            {person.category && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CATEGORY_COLORS[person.category] || 'bg-slate-100 text-slate-600'}`}>
                                    {person.category}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PersonCombobox;
