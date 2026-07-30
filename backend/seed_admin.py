import sys
from pathlib import Path

# Add the backend directory to python path
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

from app.config.database import SessionLocal
from app.models.user import User, UserRole
from app.security.password_hash import hash_password


def seed():
    db = SessionLocal()
    try:
        email = "admin@ropashop.com"
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"El usuario '{email}' ya existe.")
            if existing.role != UserRole.admin:
                existing.role = UserRole.admin
                db.commit()
                print("El rol del usuario existente fue actualizado a 'admin'.")
            else:
                print("El usuario ya tiene rol de 'admin'.")
            return

        admin_user = User(
            name="Administrador RopaShop",
            email=email,
            password_hash=hash_password("45"),
            role=UserRole.admin,
            phone="+57 300 123 4567",
            address="Oficinas Principales RopaShop, Medellín",
        )
        db.add(admin_user)
        db.commit()
        print("¡Usuario administrador creado con éxito!")
        print(f"Email: {email}")
        print("Contraseña: admin12345")
    except Exception as e:
        print(f"Error al crear el administrador: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
