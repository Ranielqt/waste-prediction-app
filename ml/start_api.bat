@echo off
echo Starting Waste Prediction ML API...
cd /d "%~dp0"
python -m pip install -r requirements.txt
python api.py
pause