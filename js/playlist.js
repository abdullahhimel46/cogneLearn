/**
 * Playlist Module - Manages playlists and their videos (UML-aligned)
 */
const Playlist = {
    /**
     * Create a new playlist
     * @param {Object} playlistData - {title, name, description, videos}
     * @returns {Object} Playlist object with playlistId
     */
    create: function(playlistData) {
        const user = User.getCurrentUser();
        if (!user) throw new Error('User not logged in');

        const playlist = {
            playlistId: 'playlist_' + Date.now(),
            userId: user.userId,
            title: playlistData.title || playlistData.name || 'Untitled Playlist',
            description: playlistData.description || '',
            videos: (playlistData.videos || []).map(v => 
                typeof v === 'string' 
                    ? { id: v, title: 'Video' }
                    : v
            ),
            createdAt: new Date().toISOString(),
            totalFocusMinutes: 0
        };

        // Store with user context
        const key = 'cognelearn_playlists_' + user.userId;
        const playlists = JSON.parse(localStorage.getItem(key)) || [];
        playlists.push(playlist);
        localStorage.setItem(key, JSON.stringify(playlists));

        return playlist;
    },

    // Legacy method for backward compatibility
    add: function(playlistData) {
        return this.create(playlistData);
    },

    /**
     * Get all playlists for current user
     * @returns {Array} Array of playlists
     */
    getAll: function() {
        const user = User.getCurrentUser();
        if (!user) return [];

        // Support both old 'id' and new 'userId' formats
        const userId = user.userId || user.id;
        const oldKey = 'cognelearn_playlists_' + (user.id || '');
        const newKey = 'cognelearn_playlists_' + userId;
        
        let playlists = JSON.parse(localStorage.getItem(newKey)) || [];
        
        // Migrate old format if needed
        if (playlists.length === 0) {
            playlists = JSON.parse(localStorage.getItem(oldKey)) || [];
            if (playlists.length > 0) {
                localStorage.setItem(newKey, JSON.stringify(playlists));
            }
        }
        
        return playlists;
    },

    /**
     * Get playlist by ID
     * @param {String} playlistId
     * @returns {Object|null}
     */
    getById: function(playlistId) {
        const playlists = this.getAll();
        // Support both old 'id' and new 'playlistId' formats
        return playlists.find(p => p.playlistId === playlistId || p.id === playlistId) || null;
    },

    /**
     * Add video to playlist
     * @param {String} playlistId
     * @param {Object} videoData - {id, title}
     */
    addVideo: function(playlistId, videoData) {
        const user = User.getCurrentUser();
        if (!user) return;

        const userId = user.userId || user.id;
        const key = 'cognelearn_playlists_' + userId;
        const playlists = JSON.parse(localStorage.getItem(key)) || [];

        const updatedPlaylists = playlists.map(p => {
            if ((p.playlistId === playlistId || p.id === playlistId)) {
                // Check for duplicates
                if (!p.videos.some(v => v.id === videoData.id)) {
                    return {
                        ...p,
                        videos: [...p.videos, {
                            id: videoData.id,
                            title: videoData.title || 'Video',
                            kind: videoData.kind || 'video'
                        }]
                    };
                }
            }
            return p;
        });

        localStorage.setItem(key, JSON.stringify(updatedPlaylists));
    },

    /**
     * Remove video from playlist
     * @param {String} playlistId
     * @param {String} videoId - YouTube video ID
     */
    removeVideo: function(playlistId, videoId) {
        const user = User.getCurrentUser();
        if (!user) return;

        const userId = user.userId || user.id;
        const key = 'cognelearn_playlists_' + userId;
        const playlists = JSON.parse(localStorage.getItem(key)) || [];

        const updatedPlaylists = playlists.map(p => {
            if (p.playlistId === playlistId || p.id === playlistId) {
                return {
                    ...p,
                    videos: p.videos.filter(v => v.id !== videoId)
                };
            }
            return p;
        });

        localStorage.setItem(key, JSON.stringify(updatedPlaylists));
    },

    /**
     * Update playlist
     * @param {String} playlistId
     * @param {Object} updates
     */
    update: function(playlistId, updates) {
        const user = User.getCurrentUser();
        if (!user) return;

        const userId = user.userId || user.id;
        const key = 'cognelearn_playlists_' + userId;
        let playlists = JSON.parse(localStorage.getItem(key)) || [];

        playlists = playlists.map(p =>
            (p.playlistId === playlistId || p.id === playlistId) ? { ...p, ...updates } : p
        );

        localStorage.setItem(key, JSON.stringify(playlists));
    },

    /**
     * Delete playlist
     * @param {String} playlistId
     */
    delete: function(playlistId) {
        const user = User.getCurrentUser();
        if (!user) return;

        const userId = user.userId || user.id;
        const key = 'cognelearn_playlists_' + userId;
        let playlists = JSON.parse(localStorage.getItem(key)) || [];

        playlists = playlists.filter(p => p.playlistId !== playlistId && p.id !== playlistId);
        localStorage.setItem(key, JSON.stringify(playlists));
    },

    /**
     * Add session (focus time record)
     * @param {Object} sessionData
     */
    addSession: function(sessionData) {
        const user = User.getCurrentUser();
        if (!user) return;

        const userId = user.userId || user.id;
        const key = 'cognelearn_sessions_' + userId;
        const sessions = JSON.parse(localStorage.getItem(key)) || [];

        const session = {
            id: 'session_' + Date.now(),
            ...sessionData,
            timestamp: new Date().toISOString()
        };

        sessions.push(session);
        localStorage.setItem(key, JSON.stringify(sessions));

        // Update playlist focus time
        if (sessionData.playlistId) {
            const playlists = this.getAll();
            const playlist = playlists.find(p => p.id === sessionData.playlistId || p.playlistId === sessionData.playlistId);
            if (playlist) {
                playlist.totalFocusMinutes = (playlist.totalFocusMinutes || 0) + sessionData.focusTime;
                this.update(sessionData.playlistId, { totalFocusMinutes: playlist.totalFocusMinutes });
            }
        }
    },

    /**
     * Get all sessions for current user
     * @returns {Array}
     */
    getSessions: function() {
        const user = User.getCurrentUser();
        if (!user) return [];

        const userId = user.userId || user.id;
        const key = 'cognelearn_sessions_' + userId;
        const sessions = localStorage.getItem(key);
        return sessions ? JSON.parse(sessions) : [];
    },

    /**
     * Get statistics
     * @returns {Object}
     */
    getStats: function() {
        const playlists = this.getAll();
        const sessions = this.getSessions();

        const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.focusTime || 0), 0);
        const totalSessions = sessions.length;
        const avgAttention = sessions.length > 0 
            ? Math.round(sessions.reduce((sum, s) => sum + (s.attentionScore || 0), 0) / sessions.length)
            : 0;

        // Today's focus
        const today = new Date().toDateString();
        const todayFocusMinutes = sessions
            .filter(s => new Date(s.timestamp).toDateString() === today)
            .reduce((sum, s) => sum + (s.focusTime || 0), 0);

        return {
            totalFocusMinutes,
            totalSessions,
            avgAttention,
            todayFocusMinutes,
            totalPlaylists: playlists.length
        };
    }
};
