from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

router = APIRouter(prefix="/control", tags=["controller"])


@router.get("/scan/{bp_number}")
def scan_boarding_pass(bp_number: str, db: Session = Depends(get_db)):
    query = text("""
        SELECT
            bp.boarding_pass_id,
            bp.boarding_pass_number,
            bp.gate_number,
            bp.seat_number,
            bp.boarding_time,
            bp.controller_id,
            p.passenger_fullname,
            p.passenger_passport,
            f.flight_number,
            f.destination_location,
            f.departure_datetime,
            b.booking_status,
            cs.controller_fullname
        FROM "Boarding Pass" bp
        JOIN Booking b ON bp.booking_id = b.booking_id
        JOIN Passenger p ON b.passenger_id = p.passenger_id
        JOIN Flight f ON b.flight_id = f.flight_id
        LEFT JOIN "Control Service" cs ON bp.controller_id = cs.controller_id
        WHERE bp.boarding_pass_number = :num
    """)
    result = db.execute(query, {"num": bp_number}).mappings().first()
    if not result:
        raise HTTPException(status_code=404, detail=f"Талон №{bp_number} не найден")

    if result["booking_status"] != "Checked-in":
        raise HTTPException(
            status_code=400,
            detail=f"Пассажир {result['passenger_fullname']} не прошёл регистрацию (статус: {result['booking_status']}). Проход невозможен.",
        )

    return result


@router.post("/approve/{boarding_pass_id}")
def approve_boarding_pass(
    boarding_pass_id: int, controller_id: int, db: Session = Depends(get_db)
):
    try:
        check = (
            db.execute(
                text("""
                SELECT bp.boarding_pass_id, bp.controller_id, b.booking_status
                FROM "Boarding Pass" bp
                JOIN Booking b ON bp.booking_id = b.booking_id
                WHERE bp.boarding_pass_id = :bpid
            """),
                {"bpid": boarding_pass_id},
            )
            .mappings()
            .first()
        )

        if not check:
            raise HTTPException(status_code=404, detail="Талон не найден")

        if check["booking_status"] != "Checked-in":
            raise HTTPException(
                status_code=400,
                detail="Пассажир не зарегистрирован. Проход невозможен.",
            )

        if check["controller_id"] is not None:
            raise HTTPException(status_code=400, detail="Талон уже был проверен ранее")

        db.execute(
            text("""
                UPDATE "Boarding Pass"
                SET controller_id = :cid, boarding_time = now()
                WHERE boarding_pass_id = :bpid
            """),
            {"cid": controller_id, "bpid": boarding_pass_id},
        )
        db.commit()
        return {"status": "success", "message": "Прохождение контроля зафиксировано"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
