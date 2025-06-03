import { useState, useCallback, useEffect } from 'react';
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    doc,
    updateDoc,
    getDoc,
    where,
    DocumentData,
    QueryDocumentSnapshot,
    setDoc,
    collectionGroup,
    documentId
} from 'firebase/firestore';
import app from '@/lib/firebase';

// Define user data interface
interface UserData {
    id: string;
    username: string | null;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    registeredDate: string;
    lastLoginAt: string | null;
    subscriptionTier: 'Basic Plan' | 'Premium Plan' | 'promo' | null;
    tokens: number;
    isAdmin: boolean;
}

// Define system data interface
interface SystemData {
    tokens: number;
    isAdmin: boolean;
    subscriptionTier: 'Basic Plan' | 'Premium Plan' | 'promo' | null;
}

// Define sort options
type SortField = 'registeredDate' | 'username' | 'email' | 'subscriptionTier' | 'tokens';
type FilterField = 'username' | 'email' | 'displayName';
type SortDirection = 'asc' | 'desc';

// Define filter options
interface FilterOptions {
    subscriptionTier?: 'Basic Plan' | 'Premium Plan' | 'promo' | null;
    searchQuery?: string;
    filterField?: FilterField;
    isAdmin?: boolean;
}

// Define hook return type
interface UseUserManagementReturn {
    users: UserData[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    totalUsers: number;

    // Fetch and pagination
    fetchUsers: (reset?: boolean) => Promise<void>;
    loadMoreUsers: () => Promise<void>;

    // Sorting and filtering
    sortDirection: SortDirection;
    setSortDirection: (direction: SortDirection) => void;
    filterOptions: FilterOptions;
    setFilterOptions: (options: FilterOptions) => void;

    // User management actions
    makeUserAdmin: (userId: string, isAdmin: boolean) => Promise<{ success: boolean; error?: string }>;
    updateUserTokens: (userId: string, tokens: number) => Promise<{ success: boolean; error?: string }>;
    updateUserSubscription: (userId: string, tier: 'Basic Plan' | 'Premium Plan' | 'promo' | null) => Promise<{ success: boolean; error?: string }>;
}

export function useUserManagement(): UseUserManagementReturn {
    // State variables
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [totalUsers, setTotalUsers] = useState<number>(0);

    // Store system data map in state
    const [systemDataMap, setSystemDataMap] = useState<Map<string, SystemData>>(new Map());

    // Sorting and filtering state
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

    // Page size for pagination
    const PAGE_SIZE = 20;

    // Function to fetch all system documents and update the systemDataMap
    const fetchSystemData = useCallback(async () => {
        try {
            const db = getFirestore(app);
            const allSystemDocs = await getDocs(collectionGroup(db, 'system'));

            const newSystemDataMap = new Map<string, SystemData>();

            allSystemDocs.forEach(docSnap => {
                const pathParts = docSnap.ref.path.split('/');
                // Check if this is a user's system document (path should be users/{userId}/private/system)
                if (pathParts.length === 4 && pathParts[0] === 'users' && pathParts[2] === 'private' && pathParts[3] === 'system') {
                    const userId = pathParts[1];
                    const data = docSnap.data();

                    newSystemDataMap.set(userId, {
                        tokens: data.tokens ?? 0,
                        isAdmin: data.isAdmin ?? false,
                        subscriptionTier: data.subscription_tier ?? null
                    });
                }
            });

            setSystemDataMap(newSystemDataMap);
            return newSystemDataMap;
        } catch (err) {
            console.error('Error fetching system data:', err);
            throw err;
        }
    }, []);

    // Function to map a user document to UserData using the systemDataMap
    const mapUserDoc = useCallback((doc: QueryDocumentSnapshot<DocumentData>, systemMap: Map<string, SystemData>): UserData => {
        const data = doc.data();
        const userId = doc.id;
        const systemData = systemMap.get(userId) || {
            tokens: 0,
            isAdmin: false,
            subscriptionTier: null
        };

        return {
            id: userId,
            username: data.username || null,
            email: data.email || null,
            displayName: data.displayName || null,
            avatarUrl: data.photoURL || data.avatarUrl || null,
            registeredDate: data.createdAt || data.metadata?.creationTime || null,
            lastLoginAt: data.lastLoginAt || data.metadata?.lastSignInTime || null,
            subscriptionTier: systemData.subscriptionTier,
            tokens: systemData.tokens,
            isAdmin: systemData.isAdmin
        };
    }, []);

    // Function to fetch users with current sort and filter options
    const fetchUsers = useCallback(async (reset: boolean = true) => {
        try {
            if (reset) {
                setLoading(true);
                setLastVisible(null);
            } else {
                setLoadingMore(true);
            }

            const db = getFirestore(app);

            // If this is a reset, fetch all system data first
            let currentSystemMap = systemDataMap.size == 0 ? await fetchSystemData() : systemDataMap;

            let userIds: string[] = [];

            // If filtering by subscription tier or admin status, filter from the systemDataMap
            if (filterOptions.subscriptionTier || filterOptions.isAdmin !== undefined) {
                for (const [userId, data] of currentSystemMap.entries()) {
                    const tierMatch = !filterOptions.subscriptionTier || data.subscriptionTier === filterOptions.subscriptionTier;
                    const adminMatch = filterOptions.isAdmin === undefined || data.isAdmin === filterOptions.isAdmin;

                    if (tierMatch && adminMatch) {
                        userIds.push(userId);
                    }
                }

                // If no users match the filter criteria, return early
                if (userIds.length === 0) {
                    setUsers([]);
                    setHasMore(false);
                    setTotalUsers(0);
                    setLoading(false);
                    setLoadingMore(false);
                    return;
                }
            }

            // Build query for user documents
            const usersRef = collection(db, 'users');
            let q = query(usersRef);

            // If we have specific user IDs from the system filter, filter by those IDs
            if (userIds.length > 0) {
                // Firebase has a limit of 10 items in an 'in' query, so we need to handle this in batches
                // For simplicity, we'll just take the first batch here
                const batchSize = 10;
                const batch = userIds.slice(0, batchSize);
                q = query(usersRef, where(documentId(), 'in', batch));
            }

            if (filterOptions.searchQuery) {
                const searchQuery = filterOptions.searchQuery.toLowerCase();

                query(q,
                    where(filterOptions.filterField || "email", '>=', searchQuery),
                    where(filterOptions.filterField || "email", '<=', searchQuery + '\uf8ff')
                )
            }

            q = query(q, orderBy('createdAt', sortDirection), limit(PAGE_SIZE));

            // Apply pagination if not resetting
            if (!reset && lastVisible) {
                q = query(q, startAfter(lastVisible));
            }

            const querySnapshot = await getDocs(q);

            // Update last visible for pagination
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc || null);

            // Check if there are more results
            setHasMore(querySnapshot.docs.length === PAGE_SIZE);

            // Map user documents to UserData using the system data map
            const fetchedUsers = querySnapshot.docs.map(doc => mapUserDoc(doc, currentSystemMap));

            // Filter by search query if provided
            let filteredUsers = fetchedUsers;
            if (filterOptions.searchQuery) {
                const searchQuery = filterOptions.searchQuery.toLowerCase();
                filteredUsers = fetchedUsers.filter(user =>
                    (user.username && user.username.toLowerCase().includes(searchQuery)) ||
                    (user.email && user.email.toLowerCase().includes(searchQuery)) ||
                    (user.displayName && user.displayName.toLowerCase().includes(searchQuery))
                );
            }

            // Update users state
            if (reset) {
                setUsers(filteredUsers);
            } else {
                setUsers(prev => [...prev, ...filteredUsers]);
            }

            // Get total count (approximate)
            if (userIds.length > 0) {
                setTotalUsers(userIds.length);
            } else {
                const countSnapshot = await getDocs(query(usersRef));
                setTotalUsers(countSnapshot.size);
            }

            setError(null);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError('Failed to load users: ' + err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sortDirection, filterOptions, lastVisible, systemDataMap, fetchSystemData, mapUserDoc]);

    // Function to load more users
    const loadMoreUsers = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        await fetchUsers(false);
    }, [fetchUsers, loadingMore, hasMore]);

    // Function to make a user admin or remove admin status
    const makeUserAdmin = useCallback(async (userId: string, isAdmin: boolean) => {
        try {
            const db = getFirestore(app);

            // Update user's system document
            const userSystemRef = doc(db, 'users', userId, 'private', 'system');
            const userSystemDoc = await getDoc(userSystemRef);

            if (userSystemDoc.exists()) {
                await updateDoc(userSystemRef, { isAdmin });
            } else {
                await setDoc(userSystemRef, { isAdmin });
            }

            // Update local state
            setUsers(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, isAdmin }
                        : user
                )
            );

            // Update systemDataMap
            setSystemDataMap(prev => {
                const newMap = new Map(prev);
                const existingData = newMap.get(userId) || { tokens: 0, isAdmin: false, subscriptionTier: null };
                newMap.set(userId, { ...existingData, isAdmin });
                return newMap;
            });

            return { success: true };
        } catch (err: any) {
            console.error('Error updating admin status:', err);
            return {
                success: false,
                error: err.message || 'Failed to update admin status'
            };
        }
    }, []);

    // Function to update user tokens
    // Function to update user tokens
    const updateUserTokens = useCallback(async (userId: string, tokens: number) => {
        try {
            const db = getFirestore(app);

            // Update user's system document
            const userSystemRef = doc(db, 'users', userId, 'private', 'system');
            const userSystemDoc = await getDoc(userSystemRef);

            if (userSystemDoc.exists()) {
                await updateDoc(userSystemRef, { tokens });
            } else {
                await setDoc(userSystemRef, { tokens });
            }

            // Update local state
            setUsers(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, tokens }
                        : user
                )
            );

            // Update systemDataMap
            setSystemDataMap(prev => {
                const newMap = new Map(prev);
                const existingData = newMap.get(userId) || { tokens: 0, isAdmin: false, subscriptionTier: null };
                newMap.set(userId, { ...existingData, tokens });
                return newMap;
            });

            return { success: true };
        } catch (err: any) {
            console.error('Error updating user tokens:', err);
            return {
                success: false,
                error: err.message || 'Failed to update user tokens'
            };
        }
    }, []);

    // Function to update user subscription tier
    const updateUserSubscription = useCallback(async (
        userId: string,
        tier: 'Basic Plan' | 'Premium Plan' | 'promo' | null
    ) => {
        try {
            const db = getFirestore(app);

            // Update user's system document with subscription_tier
            const userSystemRef = doc(db, 'users', userId, 'private', 'system');
            const userSystemDoc = await getDoc(userSystemRef);

            if (userSystemDoc.exists()) {
                await updateDoc(userSystemRef, { subscription_tier: tier });
            } else {
                await setDoc(userSystemRef, { subscription_tier: tier });
            }

            // Update local state
            setUsers(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, subscriptionTier: tier }
                        : user
                )
            );

            // Update systemDataMap
            setSystemDataMap(prev => {
                const newMap = new Map(prev);
                const existingData = newMap.get(userId) || { tokens: 0, isAdmin: false, subscriptionTier: null };
                newMap.set(userId, { ...existingData, subscriptionTier: tier });
                return newMap;
            });

            return { success: true };
        } catch (err: any) {
            console.error('Error updating subscription tier:', err);
            return {
                success: false,
                error: err.message || 'Failed to update subscription tier'
            };
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return {
        users,
        loading,
        loadingMore,
        error,
        hasMore,
        totalUsers,
        fetchUsers,
        loadMoreUsers,
        sortDirection,
        setSortDirection,
        filterOptions,
        setFilterOptions,
        makeUserAdmin,
        updateUserTokens,
        updateUserSubscription
    };
}