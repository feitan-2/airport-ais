

/*
    ХРАНИМАЯ ПРОЦЕДУРА
    Выполняет:                         
   1. Проверку существования и статуса бронирования           
   2. Изменение статуса Booking → 'Checked-in'                
   3. Создание записи в "Boarding Pass"

-- p_booking_id       — ID бронирования                       
-- p_gate_number      — номер выхода на посадку               
-- p_seat_number      — номер места в самолёте                
-- out_boarding_pass_id — (OUT) ID созданного талона 
*/

CREATE OR REPLACE PROCEDURE public.register_passenger_on_flight(
    IN  p_booking_id          INTEGER,
    IN  p_gate_number         CHARACTER VARYING,
    IN  p_seat_number         CHARACTER VARYING,
    INOUT out_boarding_pass_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $procedure$
DECLARE
    v_booking_status VARCHAR(25);
BEGIN
    SELECT booking_status INTO v_booking_status
    FROM Booking
    WHERE booking_id = p_booking_id;

    IF v_booking_status IS NULL THEN
        RAISE EXCEPTION 'Бронирование с ID % не найдено.', p_booking_id;
    END IF;

    IF v_booking_status <> 'Confirmed' THEN
        RAISE EXCEPTION 'Неверный статус бронирования: %. Регистрация невозможна.', v_booking_status;
    END IF;

    UPDATE Booking
    SET booking_status = 'Checked-in'
    WHERE booking_id = p_booking_id;

    INSERT INTO "Boarding Pass" (booking_id, gate_number, seat_number, agent_id, boarding_time)
    VALUES (p_booking_id, p_gate_number, p_seat_number, 1, now())
    RETURNING boarding_pass_id INTO out_boarding_pass_id;
END;
$procedure$;



/*
    trg_check_duplicate_seat                                                        
Назначение: Перед добавлением посадочного талона проверяет,  
что место (seat_number) на данном рейсе ещё не занято        
другим пассажиром. Если занято — генерирует исключение
*/

CREATE OR REPLACE FUNCTION fn_check_duplicate_seat()
RETURNS TRIGGER AS $$
DECLARE
    v_flight_id      INT;
    v_existing_count INT;
BEGIN
    SELECT f.flight_id INTO v_flight_id
    FROM Booking b
    JOIN Flight f ON b.flight_id = f.flight_id
    WHERE b.booking_id = NEW.booking_id;

    SELECT COUNT(*) INTO v_existing_count
    FROM "Boarding Pass" bp
    JOIN Booking b ON bp.booking_id = b.booking_id
    WHERE b.flight_id = v_flight_id
      AND bp.seat_number = NEW.seat_number;

    IF v_existing_count > 0 THEN
        RAISE EXCEPTION 'Место % на данном рейсе уже занято другим пассажиром.', NEW.seat_number;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_duplicate_seat ON "Boarding Pass";

CREATE TRIGGER trg_check_duplicate_seat
BEFORE INSERT ON "Boarding Pass"
FOR EACH ROW EXECUTE FUNCTION fn_check_duplicate_seat();



/*
    trg_prevent_checkin_cancel
Назначение: Запрещает любое изменение статуса бронирования из
'Checked-in'. Бизнес-правило: статус 'Checked-in' является
финальным — пассажир уже прошёл регистрацию, талон выдан,
изменение статуса в любую сторону недопустимо.
*/
CREATE OR REPLACE FUNCTION fn_prevent_checkin_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.booking_status = 'Checked-in' AND NEW.booking_status <> 'Checked-in' THEN
        RAISE EXCEPTION 'Невозможно изменить статус: пассажир уже зарегистрирован и прошёл регистрацию.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_checkin_cancel ON Booking;

CREATE TRIGGER trg_prevent_checkin_cancel
BEFORE UPDATE ON Booking
FOR EACH ROW EXECUTE FUNCTION fn_prevent_checkin_cancel();


/*
    Представление: v_flight_occupancy 
                                                             
 Назначение: Сводная информация о загрузке каждого рейса.     
Используется в отчёте «Загрузка рейсов» (GET /report/        
occupancy). Входной параметр фильтрации: airline_id.         
                                                              
    Поля:                                                        
    flight_id            — ID рейса                           
    flight_number        — номер рейса                        
    destination_location — пункт назначения                   
    plane_type           — тип самолёта                       
    capacity             — вместимость самолёта (INTEGER)      
    registered           — кол-во зарегистрированных          
    occupancy_percentage — процент загрузки (0..100)          
    airline_id           — ID авиакомпании (для фильтра)      
    airline_name         — название авиакомпании              
*/
CREATE OR REPLACE VIEW v_flight_occupancy AS
SELECT
    f.flight_id,
    f.flight_number,
    f.destination_location,
    f.departure_datetime,
    p.plane_type,
    p.plane_capacity AS capacity,
    COUNT(b.booking_id) AS registered,
    ROUND(
        CASE
            WHEN p.plane_capacity > 0
                THEN COUNT(b.booking_id)::NUMERIC / p.plane_capacity * 100
            ELSE 0
        END, 2
    ) AS occupancy_percentage,
    a.airline_id,
    a.airline_name
FROM Flight f
JOIN Plane    p ON f.plane_id    = p.plane_id
JOIN Airline  a ON f.airline_id  = a.airline_id
LEFT JOIN Booking b
       ON f.flight_id = b.flight_id
      AND b.booking_status = 'Checked-in'
GROUP BY
    f.flight_id, f.flight_number, f.destination_location, f.departure_datetime,
    p.plane_type, p.plane_capacity,
    a.airline_id, a.airline_name;


/*
    Представление: v_passenger_queue 
                                                            
Назначение: Очередь пассажиров на регистрацию — все          
бронирования со статусом 'Confirmed', для которых ещё не     
выдан посадочный талон. Используется в GET /bookings.        
                                                            
    Поля:                                                        
    booking_id           — ID бронирования                    
    name                 — ФИО пассажира                      
    passport             — номер паспорта                     
    ticket               — номер билета                       
    flight_number        — номер рейса                        
    destination_location — пункт назначения                   
    airline_code         — код авиакомпании
*/
CREATE OR REPLACE VIEW v_passenger_queue AS
SELECT
    b.booking_id,
    p.passenger_fullname   AS name,
    p.passenger_passport   AS passport,
    b.ticket_number        AS ticket,
    f.flight_number,
    f.destination_location,
    a.airline_code
FROM Booking b
JOIN Passenger p ON b.passenger_id = p.passenger_id
JOIN Flight    f ON b.flight_id    = f.flight_id
JOIN Airline   a ON f.airline_id   = a.airline_id
LEFT JOIN "Boarding Pass" bp ON b.booking_id = bp.booking_id
WHERE b.booking_status = 'Confirmed'
  AND bp.boarding_pass_id IS NULL;
