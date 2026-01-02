import { Preferences } from 'https://esm.sh/@capacitor/preferences';

export async function setPreference(key, value) {
    try {
        await Preferences.set({ key: key, value: value });
    } catch (error) {
        console.error('Error setting preference:', error);
        // Fallback or re-throw not strictly needed if strictly mobile, but good for stability
    }
}

export async function getPreference(key) {
    try {
        const { value } = await Preferences.get({ key: key });
        return value;
    } catch (error) {
        console.error('Error getting preference:', error);
        return null;
    }
}

export async function removePreference(key) {
    try {
        await Preferences.remove({ key: key });
    } catch (error) {
        console.error('Error removing preference:', error);
    }
}

export async function clearPreferences() {
    try {
        await Preferences.clear();
    } catch (error) {
        console.error('Error clearing preferences:', error);
    }
}

// Multi-Account Management
const ACCOUNTS_LIST_KEY = 'accounts_list';
const CURRENT_ACCOUNT_KEY = 'current_account_id';

/**
 * Save or update an account by user ID
 * Moves the account to the top of the list (most recent)
 * @param {Object} userObject - User object containing at least an 'id' field
 */
export async function saveAccount(userObject) {
    try {
        if (!userObject || !userObject.id) {
            console.error('Invalid user object: missing id');
            return;
        }

        const userId = userObject.id.toString();
        const accountKey = `account_${userId}`;

        // Save the account data
        await setPreference(accountKey, JSON.stringify(userObject));

        // Update accounts list - move this account to the top (most recent)
        let accountsList = await getAccountsList();

        // Remove userId if it already exists in the list
        accountsList = accountsList.filter(id => id !== userId);

        // Add userId to the beginning of the list (top priority)
        accountsList.unshift(userId);

        await setPreference(ACCOUNTS_LIST_KEY, JSON.stringify(accountsList));

        console.log(`Account ${userId} saved and moved to top of list`);
    } catch (error) {
        console.error('Error saving account:', error);
    }
}

/**
 * Get a specific account by user ID
 * @param {string|number} userId - User ID
 * @returns {Object|null} User object or null if not found
 */
export async function getAccount(userId) {
    try {
        if (!userId) return null;

        const accountKey = `account_${userId.toString()}`;
        const accountData = await getPreference(accountKey);

        return accountData ? JSON.parse(accountData) : null;
    } catch (error) {
        console.error('Error getting account:', error);
        return null;
    }
}

/**
 * Get the currently active account
 * @returns {Object|null} Current user object or null
 */
export async function getCurrentAccount() {
    try {
        const currentAccountId = await getPreference(CURRENT_ACCOUNT_KEY);
        console.log('[getCurrentAccount] current_account_id:', currentAccountId);

        if (!currentAccountId) return null;

        const account = await getAccount(currentAccountId);
        console.log('[getCurrentAccount] Retrieved account:', account ? `${account.name} (ID: ${account.id})` : 'null');
        return account;
    } catch (error) {
        console.error('Error getting current account:', error);
        return null;
    }
}

/**
 * Get stored agent info specifically
 */
export async function getAgentInfo() {
    try {
        const agentData = await getPreference('agent_info');
        return agentData ? JSON.parse(agentData) : null;
    } catch (error) {
        console.error('Error getting agent info:', error);
        return null;
    }
}

/**
 * Get stored student info specifically
 */
export async function getStudentInfo() {
    try {
        const studentData = await getPreference('user_info');
        return studentData ? JSON.parse(studentData) : null;
    } catch (error) {
        console.error('Error getting student info:', error);
        return null;
    }
}

/**
 * Set the currently active account
 * @param {string|number} userId - User ID to set as current
 */
export async function setCurrentAccount(userId) {
    try {
        if (!userId) {
            console.error('Invalid userId provided to setCurrentAccount');
            return;
        }

        await setPreference(CURRENT_ACCOUNT_KEY, userId.toString());
        console.log(`[setCurrentAccount] Current account set to: ${userId}`);
    } catch (error) {
        console.error('Error setting current account:', error);
    }
}

/**
 * Get all stored accounts
 * @returns {Array} Array of user objects
 */
export async function getAllAccounts() {
    try {
        const accountsList = await getAccountsList();
        const accounts = [];

        for (const userId of accountsList) {
            const account = await getAccount(userId);
            if (account) {
                accounts.push(account);
            }
        }

        return accounts;
    } catch (error) {
        console.error('Error getting all accounts:', error);
        return [];
    }
}

/**
 * Get the most recent account (top of the list)
 * @returns {Object|null} Most recent account object or null
 */
export async function getMostRecentAccount() {
    try {
        const accountsList = await getAccountsList();
        if (accountsList.length === 0) return null;

        // First account in list is the most recent
        const mostRecentId = accountsList[0];
        return await getAccount(mostRecentId);
    } catch (error) {
        console.error('Error getting most recent account:', error);
        return null;
    }
}

/**
 * Get the list of account IDs
 * @returns {Array} Array of user IDs
 */
export async function getAccountsList() {
    try {
        const listData = await getPreference(ACCOUNTS_LIST_KEY);
        return listData ? JSON.parse(listData) : [];
    } catch (error) {
        console.error('Error getting accounts list:', error);
        return [];
    }
}

/**
 * Remove a specific account
 * @param {string|number} userId - User ID to remove
 */
export async function removeAccount(userId) {
    try {
        if (!userId) return;

        const userIdStr = userId.toString();
        const accountKey = `account_${userIdStr}`;
        const timestampKey = `login_timestamp_${userIdStr}`;

        // Remove account data
        await removePreference(accountKey);
        await removePreference(timestampKey);

        // Update accounts list
        const accountsList = await getAccountsList();
        const updatedList = accountsList.filter(id => id !== userIdStr);
        await setPreference(ACCOUNTS_LIST_KEY, JSON.stringify(updatedList));

        // If this was the current account, clear current account
        const currentAccountId = await getPreference(CURRENT_ACCOUNT_KEY);
        if (currentAccountId === userIdStr) {
            await removePreference(CURRENT_ACCOUNT_KEY);
        }

        console.log(`Account ${userId} removed successfully`);
    } catch (error) {
        console.error('Error removing account:', error);
    }
}

/**
 * Switch to a different account
 * @param {string|number} userId - User ID to switch to
 * @returns {Object|null} The switched account object or null if failed
 */
export async function switchAccount(userId) {
    try {
        if (!userId) {
            console.error('Invalid userId provided to switchAccount');
            return null;
        }

        const account = await getAccount(userId);
        if (!account) {
            console.error(`Account ${userId} not found`);
            return null;
        }

        await setCurrentAccount(userId);
        console.log(`Switched to account: ${userId}`);
        return account;
    } catch (error) {
        console.error('Error switching account:', error);
        return null;
    }
}

// Session Management
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Set login timestamp for a specific account
 * @param {string|number} userId - Optional user ID. If not provided, uses current account
 */
export async function setLoginTimestamp(userId = null) {
    try {
        let targetUserId = userId;

        // If no userId provided, get current account ID
        if (!targetUserId) {
            const currentAccountId = await getPreference(CURRENT_ACCOUNT_KEY);
            if (!currentAccountId) {
                console.warn('No current account set, cannot set login timestamp');
                return;
            }
            targetUserId = currentAccountId;
        }

        const timestampKey = `login_timestamp_${targetUserId.toString()}`;
        await setPreference(timestampKey, Date.now().toString());
    } catch (error) {
        console.error('Error setting login timestamp:', error);
    }
}

/**
 * Check if session is valid for a specific account
 * @param {string|number} userId - Optional user ID. If not provided, uses current account
 * @returns {boolean} True if session is valid
 */
export async function isSessionValid(userId = null) {
    try {
        let targetUserId = userId;

        // If no userId provided, get current account ID
        if (!targetUserId) {
            const currentAccountId = await getPreference(CURRENT_ACCOUNT_KEY);
            if (!currentAccountId) return false;
            targetUserId = currentAccountId;
        }

        const timestampKey = `login_timestamp_${targetUserId.toString()}`;
        const loginTimestamp = await getPreference(timestampKey);
        if (!loginTimestamp) return false;

        const elapsed = Date.now() - parseInt(loginTimestamp);
        return elapsed < SESSION_DURATION;
    } catch (error) {
        console.error('Error checking session validity:', error);
        return false;
    }
}

/**
 * Clear session for current account (logout)
 * Only clears the session timestamp, preserving account data for auto-login
 */
export async function clearSession() {
    try {
        const currentAccountId = await getPreference(CURRENT_ACCOUNT_KEY);

        if (currentAccountId) {
            // Only clear the session timestamp, keep account data
            const timestampKey = `login_timestamp_${currentAccountId}`;
            await removePreference(timestampKey);
            console.log(`Session cleared for account ${currentAccountId}, account data preserved`);
        }

        // Clear current account reference
        await removePreference(CURRENT_ACCOUNT_KEY);

        // Legacy cleanup (for backward compatibility)
        await removePreference('user_info');
        await removePreference('login_timestamp');
    } catch (error) {
        console.error('Error clearing session:', error);
    }
}
