# Deploy POS Lite to PythonAnywhere

This guide will help you deploy your POS Lite web application to PythonAnywhere.

## Prerequisites

1. A PythonAnywhere account (free tier works fine)
   - Sign up at: https://www.pythonanywhere.com/
2. All your project files ready to upload

## Step-by-Step Deployment Guide

### Step 1: Sign Up and Access PythonAnywhere

1. Go to https://www.pythonanywhere.com/
2. Create a free account (or log in if you have one)
3. You'll get a subdomain like: `https://yourusername.pythonanywhere.com`

### Step 2: Upload Your Project Files

**Option A: Using Git (Recommended)**

1. Open a **Bash console** from the PythonAnywhere dashboard
2. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

**Option B: Manual Upload**

1. Go to the **Files** tab in PythonAnywhere
2. Navigate to `/home/yourusername/`
3. Create a new directory (e.g., `pos-lite`)
4. Upload these files:
   - `app.py`
   - `requirements.txt`
   - `templates/` folder (with all HTML files)
   - `static/` folder (with all CSS/JS files)

### Step 3: Create Virtual Environment

1. Open a **Bash console** from the dashboard
2. Create a virtual environment with Python 3.10 or 3.11:
   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 pos-env
   ```
3. You should see `(pos-env)` at the start of your command line
4. Install dependencies:
   ```bash
   cd ~/pos-lite  # or your project folder name
   pip install -r requirements.txt
   ```
5. **Important**: Note your virtualenv path. It should be:
   ```
   /home/yourusername/.virtualenvs/pos-env
   ```

### Step 4: Create Web App

1. Go to the **Web** tab in PythonAnywhere
2. Click **"Add a new web app"**
3. Click **"Next"** on the domain selection
4. Choose **"Manual configuration"** (NOT Flask - this is important!)
5. Select **Python 3.10** (or the same version you used for virtualenv)
6. Click **"Next"** to create the app

### Step 5: Configure Virtual Environment

1. On the **Web** tab, scroll to the **"Virtualenv"** section
2. Enter the path to your virtual environment:
   ```
   /home/yourusername/.virtualenvs/pos-env
   ```
   (Replace `yourusername` with your actual username)
3. Press Enter - it should show a green checkmark

### Step 6: Configure WSGI File

1. On the **Web** tab, find the **"Code"** section
2. Click on the **WSGI configuration file** link (it will look like `/var/www/yourusername_pythonanywhere_com_wsgi.py`)
3. **Delete all the existing content** in the file
4. Copy and paste the content from `pythonanywhere_wsgi.py` provided in your project
5. **Update the paths** in the WSGI file:
   ```python
   # Change this line:
   project_home = '/home/yourusername/yourprojectfolder'
   
   # To match your actual paths, for example:
   project_home = '/home/john/pos-lite'
   ```
6. **Set environment variable** for session secret (add this line):
   ```python
   os.environ['SESSION_SECRET'] = 'your-random-secret-key-here'
   ```
   (Generate a random string for production security)
7. Save the file (Ctrl+S or click Save)

### Step 7: Configure Static Files (Optional but Recommended)

1. On the **Web** tab, scroll to the **"Static files"** section
2. Add a new static file mapping:
   - URL: `/static/`
   - Directory: `/home/yourusername/pos-lite/static/`
   
   (Replace `yourusername` and `pos-lite` with your actual paths)

### Step 8: Reload and Test

1. Scroll to the top of the **Web** tab
2. Click the big green **"Reload"** button
3. Wait 10-20 seconds for the reload to complete
4. Click on your app URL: `https://yourusername.pythonanywhere.com`
5. Your POS Lite app should now be live!

## Troubleshooting

### Error 502 or 500 - Application Failed to Start

1. Check the **Error log** (link on the Web tab)
2. Common issues:
   - Wrong project path in WSGI file
   - Missing dependencies in requirements.txt
   - Virtualenv path incorrect

### "Hello from Flask!" Default Page Appears

- Your WSGI file is not correctly importing your app
- Double-check the import line: `from app import app as application`
- Make sure your main Flask file is named `app.py`

### Import Errors

1. Open a Bash console
2. Activate your virtualenv:
   ```bash
   workon pos-env
   ```
3. Install missing packages:
   ```bash
   pip install package-name
   ```
4. Reload the web app

### Static Files Not Loading (CSS/JS)

1. Make sure the static files mapping is correct in the Web tab
2. Check that your static files are actually uploaded to the correct directory
3. In your templates, use Flask's url_for:
   ```html
   <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
   ```

### Session/Data Not Persisting

1. Make sure SESSION_SECRET environment variable is set in WSGI file
2. Check that the app has write permissions to create `flask_session` folder
3. Data file `pos_data.json` will be created in your project directory

## Updating Your App

When you make changes to your code:

### If Using Git:
```bash
# Open Bash console
cd ~/pos-lite
git pull
```

### If Manually Uploading:
- Upload the modified files through the Files tab

### After Any Changes:
1. Go to the **Web** tab
2. Click the green **"Reload"** button
3. Wait for reload to complete
4. Test your changes

## Important Notes

### Data Persistence
- Your `pos_data.json` file stores all POS data
- It's stored in your project directory on PythonAnywhere
- Make regular backups using the Export feature in your app
- **Important**: The data file is NOT automatically backed up by PythonAnywhere

### Free Account Limitations
- Your app URL will be: `https://yourusername.pythonanywhere.com`
- One web app only
- Must access your app at least once every 3 months or it gets disabled
- 512 MB disk space
- No custom domain (paid plans only)

### Security Recommendations
1. Change the SESSION_SECRET to a strong random string
2. Don't share your PythonAnywhere credentials
3. Regularly export and backup your POS data
4. Consider upgrading to a paid plan for custom domains and better security

### Performance
- The free tier is suitable for small businesses with moderate traffic
- If you need better performance, consider upgrading to a paid plan
- PythonAnywhere's paid plans start at $5/month

## Getting Help

If you encounter issues:
1. Check PythonAnywhere's help pages: https://help.pythonanywhere.com/
2. Review the error logs in the Web tab
3. Check the PythonAnywhere forums: https://www.pythonanywhere.com/forums/

## Next Steps After Deployment

1. **Create your first POS**: Go to your app URL and click "Create New POS"
2. **Save your credentials**: Make sure to save the username/password generated
3. **Configure settings**: Login and set up your business name and preferences
4. **Add products**: Start adding your inventory
5. **Test thoroughly**: Make sure all features work correctly
6. **Backup regularly**: Use the Export feature to backup your data

---

**Your POS Lite app is now live and accessible from anywhere in the world!**

Visit: `https://yourusername.pythonanywhere.com`
