# data/ · Datos guía históricos de emergencias en Piura

Datos aportados por Jhar Lujan Carrion (dueño del proyecto) como **guía** para la demo y para explorar posibles
predicciones de desastres asociados al Fenómeno El Niño.

| Archivo | Formato | Contenido |
|---|---|---|
| `indeci_historico_piura.csv` | CSV UTF-8 con cabecera, separado por comas | 5 000 eventos |
| `indeci_historico_piura.json` | Array JSON de objetos | Los mismos 5 000 eventos |

- Identificadores con formato SINPAD/INDECI (`SINPAD-PIU-00001` … `SINPAD-PIU-05000`), únicos.
- Fechas del 2010-01-01 al 2023-09-10.
- Coordenadas `lat`/`lng` en grados decimales WGS84 (EPSG:4326): lat −5,34…−4,91, lng −81,13…−80,14.
- Distritos: Castilla, Chulucanas, Piura, Paita, Tambogrande, Catacaos y Cura Mori.
- No contiene datos personales (ni nombres, ni DNI, ni contactos), solo conteos agregados.

## Columnas

| Columna | Tipo | Valores |
|---|---|---|
| `ID_EMERGENCIA` | texto | `SINPAD-PIU-NNNNN` |
| `DEPARTAMENTO` | texto | `PIURA` |
| `PROVINCIA` | texto | `PIURA`, `MORROPON` |
| `DISTRITO` | texto | 7 distritos (ver arriba) |
| `FECHA_EVENTO` | fecha `YYYY-MM-DD` | 2010–2023 |
| `TIPO_PELIGRO` | texto | `ACTIVACION DE QUEBRADA`, `INUNDACION PLUVIAL`, `DESBORDE DE RIO`, `COLAPSO DE DESAGÜE` |
| `PRECIPITACION_MM` | decimal | 5 – 110 |
| `VULNERABILIDAD_SUELO` | decimal | 0,60 – 0,95 |
| `NIVEL_SEVERIDAD` | texto | `BAJA`, `MEDIA`, `ALTA`, `CRITICA` |
| `TOTAL_DAMNIFICADOS` | entero | 0 – 2 500 |
| `TOTAL_AFECTADOS` | entero | 0 – 12 465 |
| `VIVIENDAS_COLAPSADAS` | entero | 0 – 400 |
| `lat`, `lng` | decimal | WGS84 |

## ⚠️ Aviso: datos sintéticos o de guía

Estos datos **no deben presentarse como un modelo entrenado con registros reales**. Muestran patrones artificiales:

- Cada distrito tiene un único valor fijo de `VULNERABILIDAD_SUELO`.
- `NIVEL_SEVERIDAD` se deriva casi directamente de `PRECIPITACION_MM`, con cortes en 40 y 70 mm.
- No hay estacionalidad: los eventos se reparten igual en los 12 meses, cuando en Piura las lluvias del Niño se concentran
  de enero a abril. Tampoco destacan los años del Niño costero (2017) ni del ciclón Yaku (2023).
- Paita figura con `PROVINCIA = MORROPON`, pero en realidad es una provincia propia.

Usos adecuados: semillas del modo mock, mapa de calor histórico, ranking de distritos y una regla explicable
(precipitación × vulnerabilidad → severidad) para la demo.

## Integración pendiente

El modo mock de la API busca `MOCK_DATASET_PATH` (por defecto `./data/indeci-piura.json`, relativo a `apps/api`), con otro
nombre y otro esquema. Para usar estos archivos hace falta adaptar el cargador o convertirlos (tarea de A2/A3).

## Rama kiro-datos

Rama kiro-datos: datos y script de extracción para Kiro (`data/scripts/extrac-data.py`). El script consulta el FeatureServer público de GeoSINPAD/INDECI y, si no responde, genera 5 000 registros sintéticos con `generar_datos_respaldo()`; los archivos actuales provienen de ese generador.
