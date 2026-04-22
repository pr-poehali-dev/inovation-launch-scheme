"""Психологи и бронирование сессий: получение списка, слотов, создание брони"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p61927516_inovation_launch_sch")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    session_id = event.get("headers", {}).get("X-Session-Id", "anonymous")
    action = params.get("action", "list")

    db = conn()
    try:
        # GET /psychology?action=list — список психологов
        if method == "GET" and action == "list":
            with db.cursor() as cur:
                cur.execute(f"""
                    SELECT id, name, avatar_initials, year_of_study, university,
                           specialization, about, rating, sessions_count, session_duration_min
                    FROM {SCHEMA}.psychologists
                    WHERE is_active = TRUE
                    ORDER BY rating DESC
                """)
                rows = cur.fetchall()
            result = [
                {
                    "id": str(r[0]), "name": r[1], "avatar_initials": r[2],
                    "year_of_study": r[3], "university": r[4],
                    "specialization": list(r[5]), "about": r[6],
                    "rating": float(r[7]), "sessions_count": r[8],
                    "session_duration_min": r[9],
                }
                for r in rows
            ]
            db.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"psychologists": result})}

        # GET /psychology?action=slots&psychologist_id=... — слоты психолога
        if method == "GET" and action == "slots":
            psych_id = params.get("psychologist_id")
            if not psych_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "psychologist_id required"})}
            with db.cursor() as cur:
                cur.execute(f"""
                    SELECT s.id, s.day_of_week, s.start_time::text, s.end_time::text, s.is_available,
                           CASE WHEN b.id IS NOT NULL THEN TRUE ELSE FALSE END as is_booked
                    FROM {SCHEMA}.psychologist_slots s
                    LEFT JOIN {SCHEMA}.bookings b
                        ON b.slot_id = s.id AND b.status IN ('pending','confirmed')
                        AND b.session_date >= CURRENT_DATE
                    WHERE s.psychologist_id = %s
                    ORDER BY s.day_of_week, s.start_time
                """, (psych_id,))
                rows = cur.fetchall()
            slots = [
                {
                    "id": str(r[0]), "day_of_week": r[1],
                    "start_time": r[2], "end_time": r[3],
                    "is_available": r[4] and not r[5],
                }
                for r in rows
            ]
            db.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"slots": slots})}

        # GET /psychology?action=my_bookings — мои записи
        if method == "GET" and action == "my_bookings":
            with db.cursor() as cur:
                cur.execute(f"""
                    SELECT b.id, b.status, b.session_date::text, b.notes,
                           p.name, p.avatar_initials, p.session_duration_min,
                           s.start_time::text, s.end_time::text
                    FROM {SCHEMA}.bookings b
                    JOIN {SCHEMA}.psychologists p ON p.id = b.psychologist_id
                    JOIN {SCHEMA}.psychologist_slots s ON s.id = b.slot_id
                    WHERE b.user_session_id = %s
                    ORDER BY b.session_date DESC, s.start_time DESC
                """, (session_id,))
                rows = cur.fetchall()
            bookings = [
                {
                    "id": str(r[0]), "status": r[1], "session_date": r[2], "notes": r[3],
                    "psychologist_name": r[4], "avatar_initials": r[5],
                    "session_duration_min": r[6], "start_time": r[7], "end_time": r[8],
                }
                for r in rows
            ]
            db.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"bookings": bookings})}

        # POST /psychology — создать бронь
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            psych_id = body.get("psychologist_id")
            slot_id = body.get("slot_id")
            session_date = body.get("session_date")
            user_name = body.get("user_name", "")
            notes = body.get("notes", "")

            if not all([psych_id, slot_id, session_date]):
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "psychologist_id, slot_id, session_date required"})}

            with db.cursor() as cur:
                # Проверяем, не занят ли слот
                cur.execute(f"""
                    SELECT COUNT(*) FROM {SCHEMA}.bookings
                    WHERE slot_id = %s AND session_date = %s AND status IN ('pending','confirmed')
                """, (slot_id, session_date))
                if cur.fetchone()[0] > 0:
                    return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "slot_already_booked"})}

                cur.execute(f"""
                    INSERT INTO {SCHEMA}.bookings
                        (psychologist_id, slot_id, user_session_id, user_name, session_date, notes, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'confirmed')
                    RETURNING id
                """, (psych_id, slot_id, session_id, user_name, session_date, notes))
                booking_id = str(cur.fetchone()[0])

            db.commit()
            return {"statusCode": 201, "headers": CORS, "body": json.dumps({"id": booking_id, "status": "confirmed"})}

    finally:
        db.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}
