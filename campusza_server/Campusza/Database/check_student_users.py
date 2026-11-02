import psycopg2

conn = psycopg2.connect(
    host="43.205.255.163",
    port=5432,
    dbname="campusza",
    user="postgres",
    password="abc123",
)
cur = conn.cursor()
cur.execute(
    """
    SELECT u.id, u.mobile, u.role, u.profile_id, substring(u.password_hash, 1, 16)
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.created_at DESC
    LIMIT 10
    """
)
print("student users:", cur.fetchall())
cur.execute(
    """
    SELECT s.id, s.phone, s.date_of_birth
    FROM students s
    ORDER BY s.created_at DESC
    LIMIT 10
    """
)
print("students:", cur.fetchall())
cur.close()
conn.close()
