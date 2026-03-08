@echo off
REM Simple script to start a local server for Suki Card website
cd /d %~dp0
REM Use Python's built-in HTTP server (requires Python installed)
python -m http.server 8080
pause
