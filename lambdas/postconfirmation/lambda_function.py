import sys
import os
import json
import boto3

cognito = boto3.client("cognito-idp")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.db import get_connection

BOOTSTRAP_ADMIN_EMAIL = os.environ.get("BOOTSTRAP_ADMIN_EMAIL")


def handler(event, context):

    print("EVENT:")
    print(json.dumps(event))

    try:

        user_attributes = event["request"]["userAttributes"]

        cognito_sub = user_attributes["sub"]
        email = user_attributes["email"]
        full_name = user_attributes.get("name", "")

        if not cognito_sub:
            raise Exception("Cognito sub no disponible en Post Confirmation")
        
        if not email:
            raise Exception("Email no disponible en Post Confirmation")

        # El email solo se utiliza para determinar el rol
        # durante el bootstrap inicial.
        # Los cambios posteriores de email NO deben modificar el role.

        role = "customer"

        if (
            BOOTSTRAP_ADMIN_EMAIL
            and email.lower() == BOOTSTRAP_ADMIN_EMAIL.lower()
        ):
            role = "admin"

        conn = get_connection()
        cur = conn.cursor()

        # ---------------------------------------------------
        # UPSERT USER
        # ---------------------------------------------------

        user_id = cognito_sub

        cur.execute("""
            INSERT INTO users (
                id,
                cognito_sub,
                email,
                full_name,
                role,
                is_active
            )
            VALUES (%s, %s, %s, %s, %s, true)
        
            ON CONFLICT (id)
            DO UPDATE SET
                cognito_sub = EXCLUDED.cognito_sub,
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role,
                is_active = true
        """, [
            user_id,
            cognito_sub,
            email,
            full_name,
            role
        ])

        conn.commit()

        cur.close()
        conn.close()

        print(f"Usuario sincronizado: {email} ({role})")

        return event

    except Exception as e:

        print(f"Error postconfirmation: {str(e)}")

        raise e