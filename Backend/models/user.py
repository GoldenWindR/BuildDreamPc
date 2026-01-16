def validate_json(data, schema):
    for field in schema:
        if field not in data:
            return f"Missing field: {field}"
    return None

register_user_schema = [
    "login",
    "first_name",
    "last_name",
    "email",
    "password"
]

login_user_schema = [
    "login",
    "password"
]

change_password_schema = [
    "old_password",
    "new_password"
]

update_user_schema = [
    "first_name",
    "last_name"
]
