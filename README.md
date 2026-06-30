# Password Manager

A self-hosted password manager built with Flask and SQLite. Passwords are encrypted at rest using a key derived from your master password, and access to the vault is protected by a bcrypt-hashed master password login.

## Features

- Master password setup and login (hashed with bcrypt)
- Vault entries encrypted with Fernet symmetric encryption
- Add, update, delete, and search saved passwords
- Organize entries by category, with search and filtering
- Built-in random password generator (configurable length and character sets)
- Import passwords from CSV or XLSX files
- Export the vault to CSV
- Simple web UI served via Flask templates

## Tech Stack

| Layer        | Technology                          |
|--------------|---------------------------------------|
| Backend      | Python, Flask                        |
| Database     | SQLite via Flask-SQLAlchemy          |
| Auth         | bcrypt (master password hashing)     |
| Encryption   | Fernet (cryptography library)        |
| Frontend     | HTML, CSS, JavaScript                |
| File Import  | csv, openpyxl (.xlsx)                |

## Project Structure

```
Password-Manager/
├── static/                 # CSS / JavaScript assets
├── templates/               # HTML templates (setup, login, vault)
├── app.py                    # Flask routes and application logic
├── models.py                  # SQLAlchemy models (MasterPassword, PasswordEntry)
├── crypto_utils.py             # Key derivation, encryption & decryption helpers
├── requirements.txt             # Python dependencies
└── .gitignore
```

## API / Routes

| Method | Endpoint                | Description                                |
|--------|--------------------------|---------------------------------------------|
| GET    | `/`                      | Redirects to setup, login, or vault         |
| GET/POST | `/setup`               | Create the master password (first run)      |
| GET/POST | `/login`               | Log in with the master password             |
| POST   | `/logout`                | Clear the session                           |
| GET    | `/vault`                  | Main vault page (auth required)             |
| GET    | `/api/passwords`           | List/search/filter saved entries            |
| POST   | `/api/passwords`            | Add a new entry                             |
| PUT    | `/api/passwords/<id>`        | Update an existing entry                    |
| DELETE | `/api/passwords/<id>`         | Delete an entry                             |
| POST   | `/api/generate`                | Generate a random password                  |
| POST   | `/api/import`                   | Import entries from a `.csv` or `.xlsx` file |
| GET    | `/api/export`                    | Export all entries to a `.csv` file          |
| GET    | `/api/categories`                 | List distinct categories                     |

## Getting Started

### Prerequisites

- Python 3.x
- pip

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/AyanNaskar08/Password-Manager.git
   cd Password-Manager
   ```

2. Create and activate a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application
   ```bash
   python app.py
   ```

5. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

6. On first run, create a master password. This password unlocks the vault and is also used to derive the encryption key for stored entries.

## Security

- The master password is hashed with bcrypt before being stored.
- Vault passwords are encrypted using Fernet symmetric encryption, with the key derived by SHA-256 hashing the master password.
- The master password is kept in the Flask session while logged in, to decrypt entries on demand.
- The vault database (`vault.db`) is a local SQLite file.

## Future Improvements

- Switch to a proper key-derivation function (PBKDF2 or Argon2) with a stored salt
- Add password strength indicators and breach checking
- Add two-factor authentication
- Support multiple user accounts
- Auto-lock the vault after a period of inactivity

## License

Not specified.

## Author

AyanNaskar08
