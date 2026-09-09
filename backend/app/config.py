from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""

    google_api_key: str = ""

    ors_api_key: str = ""
    openweather_api_key: str = ""

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    sentry_dsn: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
