# cogneLearn - UML-Based Architecture

## Overview

The project has been reimplemented according to the UML class diagram specification. This refactoring introduces a proper object-oriented architecture with clear separation of concerns and well-defined relationships between entities.

## Architecture

### Core Classes/Modules

#### 1. **User Module** (`js/User.js`)
Manages user authentication and profile operations.

**Properties:**
- `userId`: Unique user identifier
- `name`: User's display name
- `email`: User's email address

**Methods:**
- `create(userData)` - Create a new user account
- `getCurrentUser()` - Get logged-in user's data
- `isLoggedIn()` - Check authentication status
- `createPlaylist(playlistData)` - Create a new playlist
- `startStudySession(playlistId, focusTime)` - Begin a study session
- `logout()` - Clear user session

#### 2. **Playlist Module** (`js/Playlist.js`)
Manages playlists and video collections.

**Properties:**
- `playlistId`: Unique playlist identifier
- `userId`: Owner's user ID
- `title`: Playlist name
- `description`: Playlist description
- `videos`: Array of video objects
- `totalFocusMinutes`: Aggregate focus time

**Methods:**
- `create(playlistData)` - Create new playlist
- `getAll()` - Retrieve all user playlists
- `getById(playlistId)` - Get specific playlist
- `addVideo(playlistId, videoData)` - Add video to playlist
- `removeVideo(playlistId, videoId)` - Remove video from playlist
- `update(playlistId, updates)` - Update playlist metadata
- `delete(playlistId)` - Delete entire playlist

#### 3. **Video Module** (`js/Video.js`)
Represents individual video items.

**Properties:**
- `videoId`: Unique video identifier
- `id`: YouTube video ID (11 characters)
- `title`: Video title
- `duration`: Video length in seconds
- `content`: Video description/notes

**Methods:**
- `create(videoData)` - Create video object
- `isValidYouTubeId(id)` - Validate YouTube ID format
- `play(videoId)` - Play video in iframe
- `pause(videoId)` - Pause video playback
- `getEmbedUrl(videoId)` - Get YouTube embed URL

#### 4. **StudySession Module** (`js/StudySession.js`)
Tracks study sessions and timing data.

**Properties:**
- `sessionId`: Unique session identifier
- `userId`: User performing the session
- `playlistId`: Associated playlist
- `videoId`: Currently playing video
- `startTime`: Session start timestamp
- `endTime`: Session end timestamp
- `duration`: Planned duration (minutes)
- `completedDuration`: Actual time spent
- `status`: Session state (active/paused/completed)
- `attentionScores`: Array of attention measurements

**Methods:**
- `create(sessionData)` - Start new study session
- `getAll()` - Get all user sessions
- `getById(sessionId)` - Get specific session
- `getCurrentSession()` - Get active session
- `start(sessionId)` - Mark session as active
- `end(sessionId, completedMinutes)` - Complete session
- `addAttentionScore(sessionId, score)` - Record attention measurement

#### 5. **PomodoroTimer Module** (`js/pomodoro.js`)
Manages Pomodoro technique timing.

**Properties:**
- `timerId`: Timer identifier
- `workDuration`: Work session length (25 min default)
- `breakDuration`: Break length (5 min default)
- `cycles`: Number of completed cycles

**Methods:**
- `init()` - Initialize timer
- `start()` - Begin timer
- `pause()` - Pause timer
- `reset()` - Reset to initial state
- `complete()` - Mark cycle as complete
- `startWork()` - Start work session
- `startBreak()` - Start break session

#### 6. **ProductivityAnalytics Module** (`js/ProductivityAnalytics.js`)
Calculates and generates productivity metrics and reports.

**Properties:**
- `analyticsId`: Analytics record identifier
- `focusScore`: Concentration quality metric (0-100)
- `completionRate`: Percentage of planned sessions completed (0-100)

**Methods:**
- `calculateFocusScore()` - Compute focus quality metric
- `getCompletionRate()` - Get session completion percentage
- `calculateMetrics()` - Generate comprehensive metrics:
  - Total sessions completed
  - Total focus minutes
  - Average session duration
  - Focus score
  - Completion rate
  - Streak (consecutive study days)
- `generateReport()` - Create detailed productivity report with:
  - Summary metrics
  - Daily/weekly breakdown
  - Recent sessions
  - Personalized recommendations

#### 7. **AttentionMonitor Module** (`js/AttentionMonitor.js`)
Real-time attention tracking using ML face detection.

**Properties:**
- `monitorId`: Monitor session identifier
- `attentionLevel`: Current focus level (0-100)
- `distractionCount`: Number of distraction incidents

**Methods:**
- `trackAttention(detectionResult)` - Process face detection data
- `calculateAttentionLevel(face)` - Compute attention score from head position
- `alertDistraction(level)` - Generate distraction alerts
- `getSessionAttentionStats(sessionId)` - Get session statistics
- `getAttentionTrend(days)` - Analyze attention patterns over time

### Relationships

```
User (1) ──────── (many) Playlist
                    │
                    ├── (many) Video
                    └──────────────┐
                                  │
                           StudySession
                               │
                ┌──────────────┼──────────────┐
                │              │              │
           PomodoroTimer  ProductivityAnalytics  AttentionMonitor
```

### Data Flow

1. **User Creation:**
   - User.create() → Store in localStorage with `userId`
   - Auth module uses User module for login/signup

2. **Playlist Management:**
   - User.createPlaylist() → Playlist.create()
   - Videos managed through Playlist.addVideo()/removeVideo()
   - User-specific storage using `userId` key

3. **Study Session:**
   - User.startStudySession() → StudySession.create()
   - Session linked to Playlist and video
   - Time tracking and attention scores recorded

4. **Analytics:**
   - ProductivityAnalytics.calculateMetrics()
   - Aggregates data from StudySession records
   - Generates reports with recommendations

5. **Attention Monitoring:**
   - AttentionMonitor.trackAttention()
   - Processes face detection results
   - Stores scores in StudySession.attentionScores

## File Structure

```
js/
├── User.js                    # User management
├── Playlist.js                # Playlist operations
├── Video.js                   # Video management
├── StudySession.js            # Study session tracking
├── PomodoroTimer.js           # Timer functionality
├── ProductivityAnalytics.js   # Analytics & reporting
├── AttentionMonitor.js        # Attention tracking
├── auth.js                    # Authentication (uses User module)
├── utils.js                   # Helper functions
└── pomodoro.js                # Legacy timer

pages/
├── login.html                 # Authentication UI
├── dashboard.html             # Main interface
└── player.html                # Study session player
```

## Key Features

### 1. User Management
- Email-based signup/login
- User profile with name and email
- Session persistence
- Full logout with data clearing

### 2. Playlist Management
- Create multiple playlists
- Add/remove videos using YouTube IDs
- Track total focus time per playlist
- Edit playlist metadata

### 3. Study Sessions
- Track individual study periods
- Record start/end times
- Log completed duration vs. planned
- Store session status and progress

### 4. Productivity Analytics
- Calculate focus score from completion rates
- Track daily and weekly focus trends
- Generate personalized recommendations
- Longest streak tracking

### 5. Attention Monitoring
- Real-time head position tracking
- Attention level calculation (0-100%)
- Distraction alerts and warnings
- Attention trend analysis over time

### 6. Pomodoro Timer
- 25-minute work sessions
- 5-minute breaks
- Long breaks after 4 cycles
- Automatic session completion recording

## Data Persistence

All data stored in browser localStorage with user isolation:

```javascript
'cognelearn_user'                    // Current user object
'cognelearn_playlists_{userId}'      // User's playlists
'cognelearn_sessions_{userId}'       // User's study sessions
'cognelearn_session'                 // Current active session
```

## Backward Compatibility

The implementation maintains backward compatibility with the original system:
- Supports both old `id`/`name` and new `playlistId`/`title` field names
- Automatic migration of legacy data
- Existing playlists and sessions continue to work

## Usage Examples

### Creating a Playlist
```javascript
const playlist = Playlist.create({
    title: 'Python Basics',
    description: 'Learn Python fundamentals',
    videos: [
        { id: 'videoId1', title: 'Intro' },
        { id: 'videoId2', title: 'Variables' }
    ]
});
```

### Starting a Study Session
```javascript
const session = StudySession.create({
    playlistId: playlist.playlistId,
    videoId: 'videoId1',
    focusTime: 25
});

// Record completion
StudySession.end(session.sessionId, 25);
```

### Getting Analytics
```javascript
const metrics = ProductivityAnalytics.calculateMetrics();
console.log(metrics.focusScore);        // 0-100
console.log(metrics.totalSessions);     // Number of sessions
console.log(metrics.totalFocusMinutes); // Total time
```

### Tracking Attention
```javascript
const attention = AttentionMonitor.trackAttention(detectionResult);
console.log(attention.level);   // 0-100
console.log(attention.status);  // 'focused' | 'moderate' | 'distracted'
```

## Future Enhancements

1. **Backend Integration**
   - Replace localStorage with server database
   - Cloud sync across devices
   - Optional analytics sharing

2. **Advanced Analytics**
   - Machine learning recommendations
   - Spaced repetition scheduling
   - Learning path optimization

3. **Social Features**
   - Study group collaboration
   - Progress sharing
   - Peer accountability partnerships

4. **Expanded Content**
   - PDF/document support
   - Live quiz features
   - Note-taking integration

## Technical Notes

- **No External Dependencies** for core functionality (except Human.js for ML)
- **Privacy-First Design** - All processing happens in browser
- **Modular Architecture** - Easy to extend or modify individual components
- **Clear Separation of Concerns** - Each module has single responsibility
- **localStorage-Based Persistence** - Works offline, no server required
