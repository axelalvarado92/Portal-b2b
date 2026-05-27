# shared/utils.py
import json

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body, default=str)
    }

def success(data):
    return response(200, {"data": data})

def created(data):
    return response(201, {"data": data})

def bad_request(message):
    return response(400, {"error": message})

def unauthorized():
    return response(401, {"error": "No autorizado"})

def not_found(message="Recurso no encontrado"):
    return response(404, {"error": message})

def server_error(message="Error interno del servidor"):
    return response(500, {"error": message})