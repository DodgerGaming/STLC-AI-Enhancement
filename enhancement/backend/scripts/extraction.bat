@echo off
cd /d %~dp0 
wsl -d Ubuntu -e sudo service clickhouse-server start

echo Waiting for ClickHouse to be ready...
timeout /t 5 /nobreak >nul


cd /d C:\Django\Cutwise-IMS\enhancement
analytics-venv\Scripts\python.exe script.py >> logs\etl_run.log 2>&1