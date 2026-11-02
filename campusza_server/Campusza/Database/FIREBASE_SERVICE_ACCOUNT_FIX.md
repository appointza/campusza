# Firebase Service Account Error Fix

## Error
```
Error:"invalid_grant", Description:"Invalid grant: account not found"
```

## Problem
The Firebase service account JSON file exists, but the service account itself has been **deleted or disabled** in Firebase Console. This means the credentials in the JSON file are no longer valid.

## Solution: Get a New Service Account Key

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **appointza-a0d00**

### Step 2: Navigate to Service Accounts
1. Click the **⚙️ Settings** icon (gear) in the left sidebar
2. Select **Project settings**
3. Go to the **Service accounts** tab

### Step 3: Generate New Private Key
1. Scroll down to the **Firebase Admin SDK** section
2. Select **.NET** as the language
3. Click **Generate new private key**
4. A dialog will appear - click **Generate key**
5. A JSON file will be downloaded (e.g., `appointza-a0d00-firebase-adminsdk-xxxxx-xxxxx.json`)

### Step 4: Replace the Old Service Account File
1. **Backup the old file** (optional, but recommended):
   ```
   Campusza_Server/Campusza/appointza-a0d00-firebase-adminsdk-fbsvc-6b82ca7db4.json
   ```

2. **Copy the new JSON file** to your project:
   - Location: `Campusza_Server/Campusza/`
   - **OR** rename it to match the expected name:
     ```
     appointza-a0d00-firebase-adminsdk-fbsvc-6b82ca7db4.json
     ```

3. **Alternative locations** (the code will also check these):
   - Desktop: `C:\Users\YourUsername\Desktop\appointza-a0d00-firebase-adminsdk-fbsvc-6b82ca7db4.json`
   - Downloads: `C:\Users\YourUsername\Downloads\appointza-a0d00-firebase-adminsdk-fbsvc-6b82ca7db4.json`

### Step 5: Verify the File
The JSON file should contain:
```json
{
  "type": "service_account",
  "project_id": "appointza-a0d00",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@appointza-a0d00.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Step 6: Restart Your Server
After replacing the file, restart your .NET application so it loads the new service account credentials.

## Important Notes

1. **Keep the service account file secure** - Never commit it to version control
2. **The file should be in `.gitignore`** - Check that it's excluded from Git
3. **Service account permissions** - Ensure the service account has the **Firebase Cloud Messaging Admin** role
4. **File naming** - The code looks for files matching the pattern: `appointza-a0d00-firebase-adminsdk-*.json`

## Verify Service Account Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **appointza-a0d00**
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Find your service account (email ends with `@appointza-a0d00.iam.gserviceaccount.com`)
5. Ensure it has these roles:
   - **Firebase Cloud Messaging Admin**
   - **Firebase Admin SDK Administrator Service Agent** (if available)

## Alternative: Use Environment Variable

You can also set the service account JSON as an environment variable:

1. Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS`
2. Value: Full path to the JSON file
3. The Firebase Admin SDK will automatically use it

## Testing After Fix

After replacing the service account file, test the push notification endpoint:

```bash
POST http://localhost:5117/api/FirebaseAdminNotification/send-test
{
  "PushToken": "your-test-token",
  "Title": "Test",
  "Body": "Testing new service account"
}
```

If successful, you should see:
```json
{
  "success": true,
  "message": "Firebase Admin notification sent successfully"
}
```

