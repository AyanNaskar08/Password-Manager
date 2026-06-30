import random
import string

password = {}

#load existing password file

try:
    with open ("passwords.txt" , "r") as file:
        for line in file:
            line = line.strip()
            if line and ":" in line:
                website , pwd = line.split(":", 1)
                password[website] = pwd
except FileNotFoundError:
    print("No existing password file found. Starting fresh.")

#add new password
def add_password():
    website = input("Enter website name : ").strip().lower()
    pwd = input("Enter password : ")

    password[website] = pwd

    #update the file to prevent duplicates
    with open("passwords.txt", "w") as file:
        for web, p in password.items():
            file.write(f"{web}:{p}\n")
    
    print(f"Password added successfully for {website}")

#display all passwords
def display_passwords():
    if not password:
        print("No passwords found.")
    else:
        print("\nPasswords:")
        for website, pwd in password.items():
            print(f"{website}: {pwd}")

#search for password
def search_password():
    website = input("Enter website name to search : ").strip().lower()
    if website in password:
        print(f"Password for {website}: {password[website]}")
    else:
        print(f"Password not found for {website}")

#delete password
def delete_password():
    website = input("Enter website name to delete : ").strip().lower()
    if website in password:
        del password[website]
        #update the file
        with open("passwords.txt", "w") as file:
            for website, pwd in password.items():
                file.write(f"{website}:{pwd}\n")
        print(f"Password for {website} deleted successfully.")
    else:
        print(f"Password not found for {website}")

#generate random password
def generate_password():
    length = int(input("Enter password length : "))
    characters = string.ascii_letters + string.digits + string.punctuation
    pwd = ''.join(random.choice(characters) for _ in range(length))
    return pwd

#display menu
def display_menu():
    print("\nPassword Manager")
    print("1. Add password")
    print("2. Display passwords")
    print("3. Search password")
    print("4. Delete password")
    print("5. Generate random password")
    print("6. Exit")

#main program loop
def main():
    while True:
        display_menu()
        choice = input("Enter your choice : ")

        if choice == "1":
            add_password()
        elif choice == "2":
            display_passwords()
        elif choice == "3":
            search_password()
        elif choice == "4":
            delete_password()
        elif choice == "5":
            pwd = generate_password()
            print(f"Generated password : {pwd}")
            save_choice = input("Do you want to save this password? (y/n): ").strip().lower()
            if save_choice == 'y':
                website = input("Enter website name : ").strip().lower()
                password[website] = pwd
                with open("passwords.txt", "w") as file:
                    for web, p in password.items():
                        file.write(f"{web}:{p}\n")
                print(f"Password saved successfully for {website}")
        elif choice == "6":
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()  