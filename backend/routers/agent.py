from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import random
from database import get_db

router = APIRouter(prefix="/agent", tags=["agent"])


def generate_bp_number(db):
    while True:
        num = str(random.randint(100000, 999999))
        exists = db.execute(
            text('SELECT 1 FROM "Boarding Pass" WHERE boarding_pass_number = :n'),
            {"n": num},
        ).scalar()
        if not exists:
            return num


@router.get("/queue")
def get_queue(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            q.booking_id AS id,
            q.name,
            q.passport,
            q.ticket,
            q.flight_number,
            q.destination_location,
            CASE
                WHEN q.airline_code = 'SU' THEN ARRAY['A1', 'A2', 'A3']
                WHEN q.airline_code = 'EK' THEN ARRAY['B10', 'B11']
                WHEN q.airline_code = 'LH' THEN ARRAY['C1', 'C2', 'C3']
                WHEN q.airline_code = 'LX' THEN ARRAY['D1', 'D2']
                WHEN q.airline_code = 'JL' THEN ARRAY['E5', 'E6']
                ELSE ARRAY['G1', 'G2', 'G3']
            END AS available_gates
        FROM v_passenger_queue q
        ORDER BY q.flight_number, q.name
    """)
    return db.execute(query).mappings().all()


@router.get("/bookings")
def get_all_bookings(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            b.booking_id,
            p.passenger_fullname,
            f.flight_number,
            b.ticket_number,
            b.booking_status
        FROM Booking b
        JOIN Passenger p ON b.passenger_id = p.passenger_id
        JOIN Flight f ON b.flight_id = f.flight_id
        ORDER BY b.booking_id DESC
    """)
    return db.execute(query).mappings().all()


class BookingStatusUpdate(BaseModel):
    booking_status: str


@router.put("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: int, data: BookingStatusUpdate, db: Session = Depends(get_db)
):
    allowed = ["Confirmed", "Cancelled", "Checked-in", "Pending"]
    if data.booking_status not in allowed:
        raise HTTPException(status_code=400, detail="Недопустимый статус")
    try:
        db.execute(
            text("UPDATE Booking SET booking_status = :s WHERE booking_id = :bid"),
            {"s": data.booking_status, "bid": booking_id},
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/register")
def register_passenger(
    booking_id: int = Query(...),
    seat: str = Query(...),
    gate: str = Query(...),
    agent_id: int = Query(...),
    bags: int = Query(0, ge=0),
    weight: float = Query(0.0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        db.execute(
            text("CALL register_passenger_on_flight(:b_id, :gate, :seat, NULL)"),
            {"b_id": booking_id, "gate": gate, "seat": seat},
        )

        boarding_pass_id = db.execute(
            text(
                'SELECT boarding_pass_id FROM "Boarding Pass" WHERE booking_id = :bid ORDER BY boarding_pass_id DESC LIMIT 1'
            ),
            {"bid": booking_id},
        ).scalar()

        bp_number = None
        if boarding_pass_id:
            bp_number = generate_bp_number(db)
            db.execute(
                text(
                    'UPDATE "Boarding Pass" SET agent_id = :aid, boarding_pass_number = :num WHERE boarding_pass_id = :bpid'
                ),
                {"aid": agent_id, "num": bp_number, "bpid": boarding_pass_id},
            )

        tag_numbers = []
        if bags > 0 and weight > 0 and boarding_pass_id:
            piece_weight = round(weight / bags, 2)
            for i in range(bags):
                tag = f"BAG-{boarding_pass_id}-{i + 1}"
                db.execute(
                    text("""
                        INSERT INTO Baggage (booking_id, boarding_pass_id, baggage_weight, tag_number)
                        VALUES (:bid, :bpid, :w, :tag)
                    """),
                    {
                        "bid": booking_id,
                        "bpid": boarding_pass_id,
                        "w": piece_weight,
                        "tag": tag,
                    },
                )
                tag_numbers.append(tag)

        db.commit()
        return {
            "status": "success",
            "boarding_pass_id": boarding_pass_id,
            "boarding_pass_number": bp_number,
            "tag_numbers": tag_numbers,
        }
    except Exception as e:
        db.rollback()
        msg = str(e)
        import re

        m = re.search(r"DETAIL:.*?([^\n]+)|ERROR:.*?([^\n]+)", msg)
        clean = m.group(1) or m.group(2) if m else None
        for marker in ["Место ", "Неверный статус", "Бронирование с ID", "Невозможно"]:
            idx = msg.find(marker)
            if idx != -1:
                clean = msg[idx:].split("\n")[0].strip()
                break
        raise HTTPException(status_code=400, detail=clean or "Операция не выполнена")


@router.get("/boarding-passes")
def get_boarding_passes(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            bp.boarding_pass_id,
            bp.boarding_pass_number,
            p.passenger_fullname,
            f.flight_number,
            f.departure_location,
            f.destination_location,
            f.departure_datetime,
            a.airline_name,
            bp.gate_number,
            bp.seat_number,
            bp.boarding_time,
            COALESCE(SUM(bg.baggage_weight), 0) AS baggage_weight,
            COUNT(bg.baggage_id) AS baggage_pieces,
            STRING_AGG(bg.tag_number, ', ' ORDER BY bg.baggage_id) AS tag_numbers
        FROM "Boarding Pass" bp
        JOIN Booking b ON bp.booking_id = b.booking_id
        JOIN Passenger p ON b.passenger_id = p.passenger_id
        JOIN Flight f ON b.flight_id = f.flight_id
        JOIN Airline a ON f.airline_id = a.airline_id
        LEFT JOIN Baggage bg ON bg.booking_id = bp.booking_id
                             AND bg.boarding_pass_id = bp.boarding_pass_id
        GROUP BY bp.boarding_pass_id, bp.boarding_pass_number, p.passenger_fullname, f.flight_number,
                 f.departure_location, f.destination_location, f.departure_datetime,
                 a.airline_name, bp.gate_number, bp.seat_number, bp.boarding_time
        ORDER BY bp.boarding_time DESC
    """)
    return db.execute(query).mappings().all()
