# Configure Resend.com for Email

## Step 1: Get Resend API Key
1. Go to https://resend.com/api-keys
2. Create new API key
3. Copy the key (starts with `re_`)

## Step 2: Update .env (Local)
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_EMAIL=onboarding@resend.dev
SMTP_PASSWORD=re_YOUR_API_KEY_HERE
FROM_EMAIL=AAZ International <onboarding@resend.dev>
```

## Step 3: Update Railway Variables
Go to Railway Dashboard → Variables and set:
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_EMAIL=onboarding@resend.dev
SMTP_PASSWORD=re_YOUR_API_KEY_HERE
FROM_EMAIL=AAZ International <onboarding@resend.dev>
```

## Step 4: Update sendEmail.js
Already configured - just needs the API key.

## Step 5: Test
```bash
cd backend
node test-email.js
```

Resend is faster and more reliable than Gmail on Railway.
