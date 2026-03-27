"""Dashboard configuration and mapping constants."""
import os
from dotenv import load_dotenv

load_dotenv()

# DB connection
DB_CONFIG = {
    "server": os.getenv("DB_SERVER"),
    "port": int(os.getenv("DB_PORT", "1433")),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

# Site mapping: sales_Gubun -> display name
SITE_MAP = {
    "SB": "바른손카드",
    "B": "바른손몰",
    "H": "바른손몰",
    "SD": "디얼디어",
    "SS": "프리미어페이퍼",
}

# For SQL IN clause
SITE_GUBUN_ALL = ("SB", "B", "H", "SD", "SS")

# order_type mapping
ORDER_TYPE_MAP = {
    "1": "마스터",
    "6": "디지털",
    "7": "이니셜특수",
    "14": "감사장",
}

# Reverse: display name -> list of sales_Gubun values
SITE_REVERSE_MAP = {
    "바른손카드": ["SB"],
    "바른손몰": ["B", "H"],
    "디얼디어": ["SD"],
    "프리미어페이퍼": ["SS"],
}

PORT = 10011
