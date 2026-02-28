"""
SME-Plug Python SDK

Official Python client for SME-Plug — AI expert plugins with verified citations.

Usage:
    from smeplug import SMEPlug

    plug = SMEPlug(api_key="sme_live_xxx", plugin_id="legal-v1")
    response = plug.chat("What does clause 4.2 mean?")
    print(response.text)
    print(response.citations)
"""

from .client import SMEPlug
from .models import ChatResponse, Citation, UploadResponse, EvalResponse, SMEPlugError

__version__ = "0.1.0"
__all__ = [
    "SMEPlug",
    "ChatResponse",
    "Citation",
    "UploadResponse",
    "EvalResponse",
    "SMEPlugError",
]
