"""
Encryption utilities for the Password Manager.
Uses Fernet symmetric encryption derived from the master password.
"""

import base64
import hashlib
# pyrefly: ignore [missing-import]
from cryptography.fernet import Fernet


def derive_key(master_password: str) -> bytes:
    """Derive a Fernet-compatible key from the master password."""
    # Use SHA-256 to get a 32-byte key, then base64-encode for Fernet
    digest = hashlib.sha256(master_password.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_password(plain_text: str, master_password: str) -> str:
    """Encrypt a plaintext password using the master password."""
    key = derive_key(master_password)
    f = Fernet(key)
    return f.encrypt(plain_text.encode()).decode()


def decrypt_password(encrypted_text: str, master_password: str) -> str:
    """Decrypt an encrypted password using the master password."""
    key = derive_key(master_password)
    f = Fernet(key)
    return f.decrypt(encrypted_text.encode()).decode()
