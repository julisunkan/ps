"""
WSGI Configuration for PythonAnywhere
======================================
This file should be used in PythonAnywhere's WSGI configuration.

Instructions:
1. In PythonAnywhere, go to the Web tab
2. Click on the WSGI configuration file link
3. Replace the entire contents with this file
4. Update the paths below to match your PythonAnywhere username and directory
"""

import sys
import os

# Add your project directory to the sys.path
# IMPORTANT: Replace 'yourusername' with your actual PythonAnywhere username
# IMPORTANT: Replace 'yourprojectfolder' with your actual project folder name
project_home = '/home/yourusername/yourprojectfolder'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Import Flask app as 'application' (PythonAnywhere requirement)
from app import app as application

# Optional: Set environment variables if needed
# os.environ['SESSION_SECRET'] = 'your-secret-key-here'
