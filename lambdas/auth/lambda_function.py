from shared.db import get_connection


def handler(event, context):

    sub = event["requestContext"]["authorizer"]["claims"]["sub"]

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, email, full_name, role, is_active
        FROM public.users
        WHERE cognito_sub = %s
    """, (sub,))

    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        return {
            "statusCode": 401,
            "body": "User not found"
        }

    return {
        "statusCode": 200,
        "body": {
            "user": user
        }
    }