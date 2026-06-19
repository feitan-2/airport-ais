from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from database import get_db

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    passenger_fullname: str
    passenger_passport: str
    username: str
    password: str


def _display_name(row) -> str:
    if row["user_role"] == "agent":
        return row["agent_fullname"] or "Агент"
    if row["user_role"] == "controller":
        return row["controller_fullname"] or "Контролёр"
    if row["user_role"] == "passenger":
        return row["passenger_fullname"] or "Пассажир"
    return "Администратор"


def _entity_id(row):
    if row["user_role"] == "agent":
        return row["agent_id"]
    if row["user_role"] == "controller":
        return row["controller_id"]
    if row["user_role"] == "passenger":
        return row["passenger_id"]
    return None


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    row = (
        db.execute(
            text("""
            SELECT
                u.user_login,
                u.user_role,
                u.passenger_id,
                u.agent_id,
                u.controller_id,
                p.passenger_fullname,
                ra.agent_fullname,
                cs.controller_fullname
            FROM Users u
            LEFT JOIN Passenger p ON u.passenger_id = p.passenger_id
            LEFT JOIN "Registration Agent" ra ON u.agent_id = ra.agent_id
            LEFT JOIN "Control Service" cs ON u.controller_id = cs.controller_id
            WHERE u.user_login = :login
              AND u.user_password = :password
              AND u.is_active = true
        """),
            {"login": data.username, "password": data.password},
        )
        .mappings()
        .first()
    )

    if not row:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    return {
        "role": row["user_role"],
        "entity_id": _entity_id(row),
        "display_name": _display_name(row),
        "username": row["user_login"],
    }


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing_login = db.execute(
        text("SELECT user_id FROM Users WHERE user_login = :login"),
        {"login": data.username},
    ).scalar()
    if existing_login:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким логином уже существует"
        )

    existing_passport = db.execute(
        text("SELECT passenger_id FROM Passenger WHERE passenger_passport = :passport"),
        {"passport": data.passenger_passport},
    ).scalar()
    if existing_passport:
        raise HTTPException(
            status_code=400,
            detail="Пассажир с таким номером паспорта уже зарегистрирован",
        )

    try:
        passenger_id = db.execute(
            text("""
                INSERT INTO Passenger (passenger_fullname, passenger_passport)
                VALUES (:name, :passport)
                RETURNING passenger_id
            """),
            {
                "name": data.passenger_fullname.strip(),
                "passport": data.passenger_passport.strip(),
            },
        ).scalar()

        db.execute(
            text("""
                INSERT INTO Users (user_login, user_password, user_role, passenger_id)
                VALUES (:login, :password, 'passenger', :passenger_id)
            """),
            {
                "login": data.username.strip(),
                "password": data.password,
                "passenger_id": passenger_id,
            },
        )

        db.commit()
    except Exception as e:
        db.rollback()
        msg = str(e)
        if "StringDataRightTruncation" in msg or "value too long" in msg:
            raise HTTPException(
                status_code=400, detail="Одно из полей превышает допустимую длину"
            )
        if "UniqueViolation" in msg or "unique" in msg.lower():
            raise HTTPException(
                status_code=400, detail="Пользователь с такими данными уже существует"
            )
        raise HTTPException(status_code=400, detail="Ошибка при создании аккаунта")

    return {
        "role": "passenger",
        "entity_id": passenger_id,
        "display_name": data.passenger_fullname.strip(),
        "username": data.username.strip(),
    }
