@echo off
cd /d %~dp0
wsl -d Ubuntu -e sudo service clickhouse-server start

echo Waiting for ClickHouse to be ready...
timeout /t 5 /nobreak >nul

if not exist ..\logs mkdir ..\logs

echo Running extraction script...
..\..\analytics-venv\Scripts\python.exe extraction.py >> ..\logs\extraction.log 2>&1