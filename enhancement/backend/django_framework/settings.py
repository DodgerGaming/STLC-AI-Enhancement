from pathlib import Path
import os
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env', override=True)

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key')

DEBUG = os.environ.get('DJANGO_DEBUG', '1') == '1'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
    'api.authentication',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'django_framework.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'django_framework.wsgi.application'

DATABASE_ENGINE = os.environ.get('DATABASE_ENGINE', 'sqlite').lower()

if DATABASE_ENGINE == 'postgresql':
    # Read Postgres credentials from environment (.env). Do not fall back to hardcoded defaults.
    DB_NAME = os.environ.get('DATABASE_NAME')
    DB_USER = os.environ.get('DATABASE_USER')
    DB_PASSWORD = os.environ.get('DATABASE_PASSWORD')
    DB_HOST = os.environ.get('DATABASE_HOST')
    DB_PORT = os.environ.get('DATABASE_PORT')

    missing = [k for k, v in (
        ('DATABASE_NAME', DB_NAME),
        ('DATABASE_USER', DB_USER),
        ('DATABASE_PASSWORD', DB_PASSWORD),
        ('DATABASE_HOST', DB_HOST),
        ('DATABASE_PORT', DB_PORT),
    ) if not v]
    if missing:
        raise ImproperlyConfigured(f"PostgreSQL selected but missing env vars: {', '.join(missing)}")

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': DB_HOST,
            'PORT': DB_PORT,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'

# CORS - allow local React dev server
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:5176',
]

# Simple REST framework defaults
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ]
}
