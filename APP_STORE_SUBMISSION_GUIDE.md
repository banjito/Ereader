# App Store Submission Checklist

## ✅ Documents Created

All documents are in your DarkReader folder:

1. **AppStore_Promotional_Text.txt** - Copy/paste into Promotional Text field
2. **AppStore_Description.txt** - Copy/paste into Description field  
3. **AppStore_Keywords.txt** - Copy/paste into Keywords field
4. **Privacy_Policy.md** - Publish this online (instructions below)
5. **Support_Page.md** - Publish this online (instructions below)
6. **Marketing_Page.md** - Optional marketing content

## 📋 App Store Connect Fields

Go to: https://appstoreconnect.apple.com/apps/6754861119/distribution/ios/version/inflight

### 1. App Information
- **Name:** DarkReader
- **Subtitle:** Minimalist Dark Mode E-Reader
- **Privacy Policy URL:** (See instructions below)
- **Category:** 
  - Primary: **Books**
  - Secondary: **Productivity** (optional)

### 2. Pricing and Availability
- **Price:** Free
- **Availability:** All territories

### 3. App Store Information

**Promotional Text** (170 char max):
```
Read your favorite books in a beautiful dark interface. Supports PDF, EPUB, TXT, comics, and more. No ads, just reading.
```

**Description** (4000 char max):
Copy from `AppStore_Description.txt`

**Keywords** (100 char max):
```
ereader,pdf,epub,books,reading,reader,dark mode,text,documents,comics,cbz,library,study,novel
```

**Support URL:**
```
https://github.com/banjito/Ereader
```

**Marketing URL:** (optional - leave blank)

### 4. Screenshots Required

You need iPhone screenshots (at least 3):
- Library view with books
- Reading a PDF/book
- Info modal
- Chapter display
- Progress tracking

**How to take screenshots:**
1. Open iOS Simulator
2. Run your app: `npx expo start --ios`
3. Press `Cmd + S` to save screenshot
4. Upload to App Store Connect

### 5. Build
- Select the build that was uploaded via `eas submit`
- Answer Export Compliance: **No** (we set ITSAppUsesNonExemptEncryption: false)

### 6. Age Rating
- Click "Edit" and answer questionnaire
- Most answers will be "None" for a reading app

### 7. App Review Information
- **First Name:** John
- **Last Name:** Chambers  
- **Phone:** Your phone number
- **Email:** john23045@icloud.com
- **Notes:** (optional - can mention it's a simple e-reader)

## 🌐 Publishing Privacy Policy & Support Page

### Option 1: GitHub Pages (Recommended - Free)

1. Create files in your repo:
```bash
cd "/Users/cohn/Personal Projects/DarkReader"
mkdir docs
cp Privacy_Policy.md docs/privacy.md
cp Support_Page.md docs/support.md
git add docs/
git commit -m "Add privacy policy and support pages"
git push
```

2. Enable GitHub Pages:
   - Go to: https://github.com/banjito/Ereader/settings/pages
   - Source: Deploy from branch `main`
   - Folder: `/docs`
   - Save

3. Your URLs will be:
   - Privacy: `https://banjito.github.io/Ereader/privacy`
   - Support: `https://banjito.github.io/Ereader/support`

### Option 2: Google Docs (Quick & Easy)

1. Go to https://docs.google.com
2. Create new document
3. Copy/paste content from `Privacy_Policy.md`
4. Click "Share" → "Anyone with the link can view"
5. Copy the link
6. Use this as your Privacy Policy URL

## 🚀 Submit for Review

Once all fields are complete:

1. Click **"Save"** (top right)
2. Click **"Add for Review"**
3. Click **"Submit to App Review"**

## ⏱️ Review Timeline

- **Waiting for Review:** Usually 1-2 days
- **In Review:** Usually 1-2 days  
- **Total:** Typically 2-4 days

## 📧 What to Expect

You'll receive emails at john23045@icloud.com:
- "Ready for Review" - Apple will start reviewing soon
- "In Review" - Apple is actively reviewing
- "Approved" or "Rejected" - Final decision

## 🔴 If Rejected

Don't worry! Common first-time rejections:
- Missing screenshots
- Privacy policy issues
- App functionality unclear
- Contact information issues

Apple will tell you exactly what to fix. Just make the changes and resubmit!

## ✅ After Approval

Your app will be live on the App Store! You can:
- Share the App Store link
- Update your GitHub README with the download link
- Celebrate! 🎉

---

**Good luck with your submission!**

