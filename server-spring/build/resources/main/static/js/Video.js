/**
 * Video Module - Manages individual video items
 */
const Video = {
    /**
     * Create a new video object
     * @param {Object} videoData - {id, title, duration, content}
     * @returns {Object} Video object with videoId
     */
    create: function(videoData) {
        return {
            videoId: 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            id: videoData.id || '', // YouTube video ID
            title: videoData.title || 'Untitled Video',
            duration: videoData.duration || 0,
            content: videoData.content || '',
            createdAt: new Date().toISOString()
        };
    },

    /**
     * Validate YouTube video ID format
     * @param {String} id - YouTube video ID
     * @returns {Boolean}
     */
    isValidYouTubeId: function(id) {
        return /^[a-zA-Z0-9_-]{11}$/.test(id);
    },

    /**
     * Play video (used by player)
     * @param {String} videoId - Video ID to play
     */
    play: function(videoId) {
        console.log('Playing video:', videoId);
        // This is handled by the player.html iframe
    },

    /**
     * Pause video (used by player)
     * @param {String} videoId - Video ID to pause
     */
    pause: function(videoId) {
        console.log('Pausing video:', videoId);
        // This is handled by the player.html iframe
    },

    /**
     * Get YouTube embed URL for a video
     * @param {String} videoId - YouTube video ID
     * @returns {String} Embed URL
     */
    getEmbedUrl: function(videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&fs=1`;
    }
};
