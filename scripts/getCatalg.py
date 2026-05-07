import pandas as pd

# 1. Leer el archivo Excel
# Asegúrate de que el nombre del archivo coincida exactamente con el tuyo
nombre_archivo = 'excel_pro_definitivo_base_datos_nutricional_C_1200_alimentos.xlsx'

try:
    # Leemos específicamente la hoja 'alimentos_master'
    df = pd.read_excel(nombre_archivo, sheet_name='alimentos_master')
    
    # 2. Filtrar y renombrar las columnas necesarias
    # Mapeamos: nombre -> name, hidratos_g -> cho, proteina_g -> pro, grasa_g -> fat
    df_filtrado = df[['nombre', 'kcal', 'hidratos_g', 'proteina_g', 'grasa_g']].copy()
    df_filtrado.rename(columns={
        'nombre': 'name',
        'hidratos_g': 'cho',
        'proteina_g': 'pro',
        'grasa_g': 'fat'
    }, inplace=True)
    
    # 3. Convertir los datos a una lista de diccionarios
    alimentos_lista = df_filtrado.to_dict(orient='records')
    
    # 4. Construir el texto en formato JavaScript
    js_content = "const foods = [\n"
    
    for item in alimentos_lista:
        # Escapamos las comillas simples en el nombre del alimento para no romper la sintaxis de JS
        nombre_seguro = str(item['name']).replace("'", "\\'")
        
        # Formateamos cada línea
        js_content += f"  {{ name: '{nombre_seguro}', kcal: {item['kcal']}, cho: {item['cho']}, pro: {item['pro']}, fat: {item['fat']} }},\n"
        
    js_content += "];\n"
    
    # 5. Guardar el resultado en un nuevo archivo .js
    with open('foods.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("¡Éxito! Se ha generado el archivo 'foods.js' con los 1200 alimentos.")

except FileNotFoundError:
    print(f"Error: No se encontró el archivo '{nombre_archivo}'. Asegúrate de que esté en la misma carpeta que este script.")
except Exception as e:
    print(f"Ocurrió un error inesperado: {e}")