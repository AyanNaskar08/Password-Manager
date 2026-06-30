"""
Database models for the Password Manager.
"""

# pyrefly: ignore [missing-import]
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()


class MasterPassword(db.Model):
    """Stores the bcrypt-hashed master password."""
    __tablename__ = 'master_password'

    id = db.Column(db.Integer, primary_key=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class PasswordEntry(db.Model):
    """Stores an individual password entry (encrypted)."""
    __tablename__ = 'password_entries'

    id = db.Column(db.Integer, primary_key=True)
    website = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(255), default='')
    encrypted_password = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), default='General')
    notes = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self, decrypted_password=None):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'website': self.website,
            'username': self.username,
            'password': decrypted_password or '••••••••',
            'category': self.category,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
