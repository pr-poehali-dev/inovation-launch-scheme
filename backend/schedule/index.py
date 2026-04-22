"""Управление событиями расписания: сохранение, получение, удаление"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p61927516_inovation_launch_sch")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ensure_user(conn, session_id: str) -> str:
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (session_id) VALUES (%s) ON CONFLICT (session_id) DO UPDATE SET session_id = EXCLUDED.session_id RETURNING id",
            (session_id,),
        )
        return str(cur.fetchone()[0])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    session_id = event.get("headers", {}).get("X-Session-Id", "anonymous")

    conn = get_conn()
    try:
        user_id = ensure_user(conn, session_id)

        if method == "GET":
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, title, event_type, day_of_week, start_time::text, end_time::text, date::text, description, source
                        FROM {SCHEMA}.schedule_events WHERE user_id = %s ORDER BY day_of_week, start_time""",
                    (user_id,),
                )
                rows = cur.fetchall()
            events = [
                {
                    "id": str(r[0]),
                    "title": r[1],
                    "event_type": r[2],
                    "day_of_week": r[3],
                    "start_time": r[4],
                    "end_time": r[5],
                    "date": r[6],
                    "description": r[7],
                    "source": r[8],
                }
                for r in rows
            ]
            conn.commit()
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"events": events})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            title = body.get("title", "").strip()
            event_type = body.get("event_type", "study")
            day_of_week = body.get("day_of_week")
            start_time = body.get("start_time")
            end_time = body.get("end_time")
            date = body.get("date")
            description = body.get("description", "")
            source = body.get("source", "manual")

            if not title:
                return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "title required"})}

            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.schedule_events
                        (user_id, title, event_type, day_of_week, start_time, end_time, date, description, source)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (user_id, title, event_type, day_of_week, start_time, end_time, date, description, source),
                )
                new_id = str(cur.fetchone()[0])
            conn.commit()
            return {"statusCode": 201, "headers": CORS_HEADERS, "body": json.dumps({"id": new_id})}

        if method == "DELETE":
            params = event.get("queryStringParameters") or {}
            event_id = params.get("id")
            if not event_id:
                return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "id required"})}
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.schedule_events SET title = title WHERE id = %s AND user_id = %s",
                    (event_id, user_id),
                )
            conn.commit()
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    finally:
        conn.close()

    return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "method not allowed"})}
