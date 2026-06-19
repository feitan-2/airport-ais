from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import date
from database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


def _friendly_error(e: Exception, entity: str = "запись") -> str:
    msg = str(e)
    if "ForeignKeyViolation" in msg or "foreign key" in msg.lower():
        hints = {
            "рейс": "Нельзя удалить рейс, на который есть бронирования. Сначала отмените все бронирования на этот рейс.",
            "самолёт": "Нельзя удалить самолёт, который назначен на рейс. Сначала удалите или измените рейс.",
            "авиакомпания": "Нельзя удалить авиакомпанию, у которой есть рейсы. Сначала удалите или переназначьте рейсы.",
            "агент": "Нельзя удалить агента, за которым закреплены посадочные талоны.",
            "контролёр": "Нельзя удалить контролёра, за которым закреплены проверки.",
        }
        return hints.get(entity, f"Нельзя удалить: {entity} используется в других данных системы.")
    if "UniqueViolation" in msg or "unique" in msg.lower():
        return "Запись с такими данными уже существует."
    if "NotNullViolation" in msg or "null value" in msg.lower():
        return "Заполните все обязательные поля."
    return "Операция не выполнена. Проверьте данные и попробуйте снова."


# ───── Рейсы ─────

class FlightCreate(BaseModel):
    flight_number: str
    departure_location: str
    destination_location: str
    departure_datetime: date
    airline_id: int
    plane_id: int

class FlightUpdate(BaseModel):
    flight_number: str
    departure_location: str
    destination_location: str
    departure_datetime: date
    airline_id: int
    plane_id: int


@router.get("/flights")
def get_flights(db: Session = Depends(get_db)):
    query = text("""
        SELECT f.flight_id, f.flight_number, f.departure_location,
               f.destination_location, f.departure_datetime,
               a.airline_name, a.airline_id,
               p.plane_type, p.plane_capacity, p.plane_id,
               p.plane_capacity AS capacity_int,
               COALESCE(SUM(CASE WHEN b.booking_status IN ('Confirmed','Checked-in') THEN 1 ELSE 0 END), 0) AS booked,
               p.plane_capacity - COALESCE(SUM(CASE WHEN b.booking_status IN ('Confirmed','Checked-in') THEN 1 ELSE 0 END), 0) AS seats_available
        FROM Flight f
        JOIN Airline a ON f.airline_id = a.airline_id
        JOIN Plane p ON f.plane_id = p.plane_id
        LEFT JOIN Booking b ON f.flight_id = b.flight_id
        GROUP BY f.flight_id, f.flight_number, f.departure_location,
                 f.destination_location, f.departure_datetime,
                 a.airline_name, a.airline_id,
                 p.plane_type, p.plane_capacity, p.plane_id
        ORDER BY f.departure_datetime
    """)
    return db.execute(query).mappings().all()


@router.post("/flights")
def create_flight(data: FlightCreate, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO Flight (flight_number, departure_location, destination_location,
                                departure_datetime, airline_id, plane_id)
            VALUES (:num, :dep, :dest, :dt, :aid, :pid)
            RETURNING flight_id
        """)
        result = db.execute(query, {
            "num": data.flight_number, "dep": data.departure_location,
            "dest": data.destination_location, "dt": data.departure_datetime,
            "aid": data.airline_id, "pid": data.plane_id
        })
        db.commit()
        return {"status": "success", "flight_id": result.scalar()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/flights/{flight_id}")
def update_flight(flight_id: int, data: FlightUpdate, db: Session = Depends(get_db)):
    try:
        query = text("""
            UPDATE Flight
            SET flight_number = :num,
                departure_location = :dep,
                destination_location = :dest,
                departure_datetime = :dt,
                airline_id = :aid,
                plane_id = :pid
            WHERE flight_id = :fid
        """)
        db.execute(query, {
            "num": data.flight_number, "dep": data.departure_location,
            "dest": data.destination_location, "dt": data.departure_datetime,
            "aid": data.airline_id, "pid": data.plane_id, "fid": flight_id
        })
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/flights/{flight_id}")
def delete_flight(flight_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("DELETE FROM Flight WHERE flight_id = :fid"), {"fid": flight_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_friendly_error(e, "рейс"))


# ───── Самолёты ─────

class PlaneCreate(BaseModel):
    plane_type: str
    plane_capacity: int

class PlaneUpdate(BaseModel):
    plane_type: str
    plane_capacity: int


@router.get("/planes")
def get_planes(db: Session = Depends(get_db)):
    return db.execute(text("SELECT * FROM Plane ORDER BY plane_type")).mappings().all()


@router.post("/planes")
def create_plane(data: PlaneCreate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("INSERT INTO Plane (plane_type, plane_capacity) VALUES (:t, :c) RETURNING plane_id"),
            {"t": data.plane_type, "c": data.plane_capacity}
        )
        db.commit()
        return {"status": "success", "plane_id": result.scalar()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/planes/{plane_id}")
def update_plane(plane_id: int, data: PlaneUpdate, db: Session = Depends(get_db)):
    try:
        db.execute(
            text("UPDATE Plane SET plane_type = :t, plane_capacity = :c WHERE plane_id = :pid"),
            {"t": data.plane_type, "c": data.plane_capacity, "pid": plane_id}
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/planes/{plane_id}")
def delete_plane(plane_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("DELETE FROM Plane WHERE plane_id = :pid"), {"pid": plane_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_friendly_error(e, "самолёт"))


# ───── Авиакомпании ─────

class AirlineCreate(BaseModel):
    airline_name: str
    airline_code: str

class AirlineUpdate(BaseModel):
    airline_name: str
    airline_code: str


@router.get("/airlines")
def get_airlines(db: Session = Depends(get_db)):
    return db.execute(text("SELECT * FROM Airline ORDER BY airline_name")).mappings().all()


@router.post("/airlines")
def create_airline(data: AirlineCreate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("INSERT INTO Airline (airline_name, airline_code) VALUES (:n, :c) RETURNING airline_id"),
            {"n": data.airline_name, "c": data.airline_code}
        )
        db.commit()
        return {"status": "success", "airline_id": result.scalar()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/airlines/{airline_id}")
def update_airline(airline_id: int, data: AirlineUpdate, db: Session = Depends(get_db)):
    try:
        db.execute(
            text("UPDATE Airline SET airline_name = :n, airline_code = :c WHERE airline_id = :aid"),
            {"n": data.airline_name, "c": data.airline_code, "aid": airline_id}
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/airlines/{airline_id}")
def delete_airline(airline_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("DELETE FROM Airline WHERE airline_id = :aid"), {"aid": airline_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_friendly_error(e, "авиакомпания"))


# ───── Агенты ─────

class AgentCreate(BaseModel):
    agent_fullname: str
    agent_post: str

class AgentUpdate(BaseModel):
    agent_fullname: str
    agent_post: str


@router.get("/agents")
def get_agents(db: Session = Depends(get_db)):
    return db.execute(
        text('SELECT agent_id, agent_fullname, agent_post FROM "Registration Agent" ORDER BY agent_fullname')
    ).mappings().all()


@router.post("/agents")
def create_agent(data: AgentCreate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text('INSERT INTO "Registration Agent" (agent_fullname, agent_post) VALUES (:n, :p) RETURNING agent_id'),
            {"n": data.agent_fullname, "p": data.agent_post}
        )
        db.commit()
        return {"status": "success", "agent_id": result.scalar()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/agents/{agent_id}")
def update_agent(agent_id: int, data: AgentUpdate, db: Session = Depends(get_db)):
    try:
        db.execute(
            text('UPDATE "Registration Agent" SET agent_fullname = :n, agent_post = :p WHERE agent_id = :aid'),
            {"n": data.agent_fullname, "p": data.agent_post, "aid": agent_id}
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/agents/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(
            text('DELETE FROM "Registration Agent" WHERE agent_id = :aid'),
            {"aid": agent_id}
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_friendly_error(e, "агент"))


# ───── Контролёры ─────

class ControllerCreate(BaseModel):
    controller_fullname: str
    controller_post: str

class ControllerUpdate(BaseModel):
    controller_fullname: str
    controller_post: str


@router.get("/controllers")
def get_controllers(db: Session = Depends(get_db)):
    return db.execute(
        text('SELECT controller_id, controller_fullname, controller_post FROM "Control Service" ORDER BY controller_fullname')
    ).mappings().all()


@router.post("/controllers")
def create_controller(data: ControllerCreate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text('INSERT INTO "Control Service" (controller_fullname, controller_post) VALUES (:n, :p) RETURNING controller_id'),
            {"n": data.controller_fullname, "p": data.controller_post}
        )
        db.commit()
        return {"status": "success", "controller_id": result.scalar()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/controllers/{controller_id}")
def update_controller(controller_id: int, data: ControllerUpdate, db: Session = Depends(get_db)):
    try:
        db.execute(
            text('UPDATE "Control Service" SET controller_fullname = :n, controller_post = :p WHERE controller_id = :cid'),
            {"n": data.controller_fullname, "p": data.controller_post, "cid": controller_id}
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/controllers/{controller_id}")
def delete_controller(controller_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(
            text('DELETE FROM "Control Service" WHERE controller_id = :cid'),
            {"cid": controller_id}
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=_friendly_error(e, "контролёр"))


# ───── Списки для выпадающих меню ─────

@router.get("/airlines-list")
def get_airlines_list(db: Session = Depends(get_db)):
    return db.execute(
        text("SELECT airline_id, airline_name, airline_code FROM Airline ORDER BY airline_name")
    ).mappings().all()


@router.get("/planes-list")
def get_planes_list(db: Session = Depends(get_db)):
    return db.execute(
        text("SELECT plane_id, plane_type, plane_capacity FROM Plane ORDER BY plane_type")
    ).mappings().all()


# ───── Отчёт ─────

@router.get("/report/occupancy")
def get_report(
    airline_id: int = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
):
    conditions = ["1=1"]
    params = {}
    if airline_id:
        conditions.append("airline_id = :airline_id")
        params["airline_id"] = airline_id
    if date_from:
        conditions.append("departure_datetime::date >= CAST(:date_from AS date)")
        params["date_from"] = date_from
    if date_to:
        conditions.append("departure_datetime::date <= CAST(:date_to AS date)")
        params["date_to"] = date_to
    where = " AND ".join(conditions)

    query = text(f"""
        SELECT flight_id, flight_number, destination_location, plane_type,
               capacity, registered, occupancy_percentage, airline_id, airline_name
        FROM v_flight_occupancy
        WHERE {where}
        ORDER BY occupancy_percentage DESC
    """)
    return db.execute(query, params).mappings().all()
