/**
 * Playlist Module - REST-backed playlist management
 */
const Playlist = {
    create: async function(playlistData) {
        const payload = {
            title: playlistData.title || playlistData.name || 'Untitled Playlist',
            description: playlistData.description || '',
            videos: (playlistData.videos || []).map(v => ({
                id: typeof v === 'string' ? v : v.id,
                title: typeof v === 'string' ? 'Video' : (v.title || 'Video'),
                kind: typeof v === 'string' ? 'video' : (v.kind || 'video'),
                subtitle: typeof v === 'string' ? '' : (v.subtitle || '')
            }))
        };
        return await Api.post('/api/v1/playlists', payload);
    },

    add: function(playlistData) {
        return this.create(playlistData);
    },

    getAll: async function() {
        return await Api.get('/api/v1/playlists');
    },

    getById: async function(playlistId) {
        return await Api.get(`/api/v1/playlists/${playlistId}`);
    },

    addVideo: async function(playlistId, videoData) {
        return await Api.post(`/api/v1/playlists/${playlistId}/videos`, {
            id: videoData.id,
            title: videoData.title || 'Video',
            kind: videoData.kind || 'video',
            subtitle: videoData.subtitle || ''
        });
    },

    removeVideo: async function(playlistId, videoId) {
        return await Api.delete(`/api/v1/playlists/${playlistId}/videos/${videoId}`);
    },

    update: async function(playlistId, updates) {
        return await Api.patch(`/api/v1/playlists/${playlistId}`, updates);
    },

    delete: async function(playlistId) {
        return await Api.delete(`/api/v1/playlists/${playlistId}`);
    },

    addSession: async function(sessionData) {
        return await Api.post('/api/v1/sessions', sessionData);
    },

    getSessions: async function() {
        return await Api.get('/api/v1/sessions');
    },

    getStats: async function() {
        return await Api.get('/api/v1/analytics/dashboard');
    }
};
