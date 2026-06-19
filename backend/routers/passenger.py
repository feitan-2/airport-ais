from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import random
import string
from database import get_db

router = APIRouter(prefix="/passenger", tags=["passenger"])


@router.get("/flights")
def get_flights(
    destination: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
    db: Session = Depends(get_db)
):
    conditions = ["1=1"]
    params = {}

    if destination:
        conditions.append("(LOWER(f.destination_location) LIKE LOWER(:dest_like) OR LOWER(f.departure_location) LIKE LOWER(:dest_like))")
        params["dest_like"] = f"%{destination}%"
    if date_from:
        conditions.append("f.departure_datetime::date >= CAST(:date_from AS date)")
        params["date_from"] = date_from
    if date_to:
        conditions.append("f.departure_datetime::date <= CAST(:date_to AS date)")
        params["date_to"] = date_to

    where = " AND ".join(conditions)

    query = text(f"""
        SELECT
            f.flight_id,
            f.flight_number,
            f.departure_location,
            f.destination_location,
            f.departure_datetime,
            a.airline_name,
            a.airline_code,
            p.plane_type,
            p.plane_capacity,
            (p.plane_capacity -
                COALESCE(SUM(CASE WHEN b.booking_status IN ('Confirmed','Checked-in') THEN 1 ELSE 0 END), 0)
            ) AS seats_available
        FROM Flight f
        JOIN Airline a ON f.airline_id = a.airline_id
        JOIN Plane p ON f.plane_id = p.plane_id
        LEFT JOIN Booking b ON f.flight_id = b.flight_id
        WHERE {where}
        GROUP BY f.flight_id, f.flight_number, f.departure_location,
                 f.destination_location, f.departure_datetime,
                 a.airline_name, a.airline_code, p.plane_type, p.plane_capacity
        ORDER BY f.departure_datetime
    """)
    return db.execute(query, params).mappings().all()


@router.get("/bookings")
def get_my_bookings(passenger_id: int = Query(...), db: Session = Depends(get_db)):
    query = text("""
        SELECT
            b.booking_id,
            b.ticket_number,
            b.booking_status,
            f.flight_number,
            f.departure_location,
            f.destination_location,
            f.departure_datetime,
            a.airline_name,
            p.passenger_fullname,
            bp.boarding_pass_id,
            bp.boarding_pass_number,
            bp.gate_number,
            bp.seat_number
        FROM Booking b
        JOIN Flight f ON b.flight_id = f.flight_id
        JOIN Airline a ON f.airline_id = a.airline_id
        JOIN Passenger p ON b.passenger_id = p.passenger_id
        LEFT JOIN "Boarding Pass" bp ON b.booking_id = bp.booking_id
        WHERE b.passenger_id = :pid
        ORDER BY f.departure_datetime DESC
    """)
    return db.execute(query, {"pid": passenger_id}).mappings().all()


class BookingCreate(BaseModel):
    flight_id: int
    passenger_id: int


def generate_ticket():
    return "TKT-" + "".join(random.choices(string.digits, k=8))


@router.post("/bookings")
def create_booking(data: BookingCreate, db: Session = Depends(get_db)):
    try:
        capacity_row = db.execute(text("""
            SELECT p.plane_capacity AS cap,
                   COALESCE(SUM(CASE WHEN b.booking_status IN ('Confirmed','Checked-in') THEN 1 ELSE 0 END), 0) AS booked
            FROM Flight f
            JOIN Plane p ON f.plane_id = p.plane_id
            LEFT JOIN Booking b ON f.flight_id = b.flight_id
            WHERE f.flight_id = :fid
            GROUP BY p.plane_capacity
        """), {"fid": data.flight_id}).mappings().first()

        if not capacity_row:
            raise HTTPException(status_code=404, detail="Рейс не найден")
        if capacity_row["booked"] >= capacity_row["cap"]:
            raise HTTPException(status_code=400, detail="На этот рейс нет свободных мест")

        existing = db.execute(text("""
            SELECT booking_id FROM Booking
            WHERE flight_id = :fid AND passenger_id = :pid
            AND booking_status NOT IN ('Cancelled')
        """), {"fid": data.flight_id, "pid": data.passenger_id}).scalar()
        if existing:
            raise HTTPException(status_code=400, detail="Вы уже забронировали этот рейс")

        ticket = generate_ticket()
        result = db.execute(text("""
            INSERT INTO Booking (flight_id, passenger_id, ticket_number, booking_status)
            VALUES (:fid, :pid, :ticket, 'Confirmed')
            RETURNING booking_id
        """), {"fid": data.flight_id, "pid": data.passenger_id, "ticket": ticket})
        db.commit()
        return {"status": "success", "booking_id": result.scalar(), "ticket_number": ticket}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
