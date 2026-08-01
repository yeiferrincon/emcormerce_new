import sqlite3

conn = sqlite3.connect('app.db')
cursor = conn.cursor()
cursor.execute('SELECT id, name, image_url FROM products')
print('Productos en la base de datos:')
for row in cursor.fetchall():
    print(f'ID: {row[0]}, Nombre: {row[1]}, Imagen: {row[2]}')
conn.close()
