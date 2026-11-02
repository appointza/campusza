# Platform-Specific Push Token Implementation

## Overview
This implementation stores push notification tokens separately for each platform (Web, iOS, Android) instead of using a single `push_token` column.

## Database Changes

### Migration Script
Run the SQL migration script to add the new columns:
```sql
-- File: Campusza_Server/Campusza/Database/add_platform_push_tokens.sql
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS webpushnotification TEXT,
ADD COLUMN IF NOT EXISTS iospushnotification TEXT,
ADD COLUMN IF NOT EXISTS androidpushnotification TEXT;
```

### New Columns
- `webpushnotification` - Stores FCM web push tokens
- `iospushnotification` - Stores iOS APNs tokens
- `androidpushnotification` - Stores Android FCM tokens

## Backend Changes

### 1. Users Model (`Campusza/Models/Users.cs`)
Added three new properties:
```csharp
public string? webpushnotification { get; set; }
public string? iospushnotification { get; set; }
public string? androidpushnotification { get; set; }
```

### 2. UpdatePushTokenRequest (`Campusza/Models/Users.cs`)
Added `Platform` property:
```csharp
public string Platform { get; set; } // "web", "ios", "android"
```

### 3. UsersService (`Campusza/Services/UsersService.cs`)
- Updated `Select` query to include new columns
- Updated `InsertTransaction` to save new columns
- Updated `UpdateTransaction` to update new columns
- Modified `UpdatePushTokenTransaction` to accept platform parameter and update the correct column based on platform:
  - `"web"` → `webpushnotification`
  - `"ios"` → `iospushnotification`
  - `"android"` → `androidpushnotification`

### 4. UsersController (`Campusza/ApiControllers/UsersController.cs`)
Updated `UpdatePushToken` endpoint to pass platform parameter (defaults to "android" if not provided).

### 5. FirebaseAdminNotificationService (`Campusza/Services/FirebaseAdminNotificationService.cs`)
Updated notification sending methods to:
- Check all three platform-specific token columns
- Send notifications to all available platforms
- Fallback to legacy `push_token` if no platform-specific tokens exist

## Frontend Changes

### 1. UsersService (`appointza-ui-canvas/src/services/users.service.ts`)
Updated `UpdatePushToken` method to accept `platform` parameter:
```typescript
async UpdatePushToken(userId: number, pushToken: string, platform: string = 'android')
```

### 2. PushNotificationService (`appointza-ui-canvas/src/services/pushnotification.service.ts`)
Updated `saveTokenToServer` method to:
- Detect platform using `Capacitor.getPlatform()`
- Map platform to platform name:
  - `"ios"` → `"ios"`
  - `"android"` → `"android"`
  - `"web"` or other → `"web"`
- Pass platform name to `UpdatePushToken` API

## API Usage

### Update Push Token
```http
POST /api/Users/UpdatePushToken
Content-Type: application/json

{
  "UserId": 123,
  "PushToken": "token_here",
  "Platform": "web"  // or "ios" or "android"
}
```

## Migration Notes

1. **Run the SQL migration** before deploying the code changes
2. **Existing tokens**: The old `push_token` column is preserved for backward compatibility
3. **Fallback behavior**: If no platform-specific tokens exist, the system falls back to `push_token` (assumed to be Android)
4. **Multiple devices**: Users can have tokens for multiple platforms simultaneously

## Testing

1. Test web push token storage:
   - Login on web browser
   - Verify token is saved to `webpushnotification` column

2. Test iOS push token storage:
   - Login on iOS device
   - Verify token is saved to `iospushnotification` column

3. Test Android push token storage:
   - Login on Android device
   - Verify token is saved to `androidpushnotification` column

4. Test notification sending:
   - Send notification to user with tokens on multiple platforms
   - Verify notifications are sent to all platforms

## Benefits

1. **Platform-specific handling**: Each platform can have its own token management
2. **Multi-device support**: Users can receive notifications on multiple devices/platforms
3. **Better token management**: Tokens can be updated per platform without affecting others
4. **Backward compatible**: Legacy `push_token` column is still supported

