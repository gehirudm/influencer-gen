import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCharacters } from '@/hooks/useUserCharacters';

interface CharacterContextType {
    selectedCharacterId: string | null;
    selectedCharacter: WithId<UserCharacter> | null;
    selectCharacter: (characterId: string | null) => void;
    isLoading: boolean;
    error: string | null;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<WithId<UserCharacter> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { getCharacter } = useCharacters();

    // Function to select a character
    const selectCharacter = async (characterId: string | null) => {
        setSelectedCharacterId(characterId);

        if (!characterId) {
            setSelectedCharacter(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const character = await getCharacter(characterId);
            setSelectedCharacter(character);
        } catch (err) {
            console.error('Error fetching character:', err);
            setError('Failed to fetch character details');
            setSelectedCharacter(null);
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        selectedCharacterId,
        selectedCharacter,
        selectCharacter,
        isLoading,
        error
    };

    return (
        <CharacterContext.Provider value= { value } >
        { children }
        </CharacterContext.Provider>
  );
}

export function useCharacterContext() {
    const context = useContext(CharacterContext);

    if (context === undefined) {
        throw new Error('useCharacterContext must be used within a CharacterProvider');
    }

    return context;
}