# Diseños de personajes y detalle

La petición del 2 de noviembre de 2026 tiene dos partes. Enriquecer el dibujo del capítulo 1 y recuperar sus identidades en las páginas posteriores. Las mejoras de textura no autorizan cambiar los rostros, el argumento ni los lugares.

## Referencias fijas

| Personaje | Referencia original | Rasgos que deben permanecer |
| --- | --- | --- |
| Hermione | [Capítulo 1, página 1](../dist/paginas/c01-p001.webp) y [página 2](../dist/paginas/c01-p002.webp) | Ojos castaños expresivos, pecas, forma original de nariz, mejillas, boca y barbilla. Rizos castaños abundantes y con mechones separados. |
| Pansy | Primer plano inferior derecho de [capítulo 1, página 2](../dist/paginas/c01-p002.webp), con apoyo de [página 5](../dist/paginas/c01-p005.webp) | Mandíbula y barbilla más angulosas, ojos verdes alargados, cejas marcadas, labios pequeños definidos. Melena negra lisa hasta la barbilla, raya lateral y mechones planos ligeramente asimétricos. |
| Sophie | [Capítulo 1, página 1](../dist/paginas/c01-p001.webp) | Ondas rubio miel a los hombros, ojos castaños y uniforme amarillo y negro. |
| Harry, Ron y Ginny | [Capítulo 1, página 2](../dist/paginas/c01-p002.webp) | Conservar la geometría individual de los rostros. Harry mantiene pelo negro revuelto y gafas redondas. Ron mantiene pelo pelirrojo y pecas. Ginny mantiene pelo largo rojizo. |
| Profesores | [Capítulo 1, páginas 2–6](../dist/paginas/c01-p002.webp) | Edad adulta y rasgos propios. Mantener arrugas, peinados, barba, gafas y silueta de cada uno. |
| Personajes presentados después | Primera aparición revisada de cada personaje | Mantener sus propios diseños y edad. No convertir a familiares en copias del rostro de Pansy o Hermione. |

Los archivos originales siguen guardados aunque el lector utilice una versión enriquecida. Estas referencias no se sustituyen por la última imagen generada. Las películas pueden orientar anatomía y alturas relativas, pero la identidad dibujada aprobada en el capítulo 1 tiene prioridad.

El vestido, el recogido y los accesorios dependen de la escena. Recuperar el rostro de Hermione no implica soltar su moño de gala ni ponerle el uniforme escolar en la mansión. La luz de una vela tampoco convierte el cabello negro en violeta ni los iris castaños en verdes.

## Qué cambió y por qué

La comparación visual muestra que Pansy fue adquiriendo mejillas más redondas, ojos más grandes y un corte de pelo abombado. En Hermione se suavizaron los rasgos y varió el volumen y acabado del cabello. Hay variaciones menores incluso entre páginas del capítulo 1.

Los [prompts iniciales](prompts-capitulo-01-paginas-02-03.json) describen colores y peinados y usan la portada como referencia. Las instrucciones posteriores acumulan páginas generadas y muchas condiciones de objetos, vestuario y color. No fijaban con la misma precisión la mandíbula, el corte, el párpado y la relación entre los rasgos. Es razonable inferir que esa cadena de referencias permitió acumular desviaciones. Los registros no permiten afirmar una causa interna concreta del generador.

La [revisión anterior del capítulo 9](prompts-continuidad-capitulo-09-paginas-33-37.json) pedía recuperar el dibujo temprano y conservar las identidades actuales. Esa combinación dejó demasiado peso al rostro reciente. Ahora los originales del capítulo 1 fijan la identidad y la página que se corrige fija composición, gestos, ropa y entorno.

## Detalles permitidos

- Mechones dentro del volumen ya dibujado, pecas y pestañas discretas, reflejos pequeños en iris sin agrandar los ojos.
- Costuras, tejido y bordados de la ropa existente.
- Lomos y cantos de libros, madera, piedra tallada y materiales presentes en cada lugar.
- Facetas y reflejos de las joyas que ya figuran en la historia.

Se conservan palabras, acentos, globos, poses y secuencia. El lector sigue mostrando las imágenes limpias. Las opciones de copiar y descargar añaden «Fanfic: Nicole_Winkel» en el pie exterior.

## Alcance de esta revisión

Se revisan las 18 páginas del capítulo 1 y los personajes del tramo 15–37 del capítulo 9. Se incorporan 16 ediciones de detalle del capítulo 1 y 22 ediciones del capítulo 9. Las páginas 3 y 13 del capítulo 1 conservan sus originales porque no se obtuvo una edición aceptada de la herramienta. La página 34 del capítulo 9 contiene interiores sin personajes y conserva la versión de continuidad ya revisada. Este alcance no equivale a una nueva corrección individual de los capítulos 2–8 ni de las páginas 1–14 del 9.

Los archivos, prompts y comprobaciones de cada edición se registran en [capítulo 1](prompts-detalle-capitulo-01.json) y [capítulo 9](prompts-identidad-capitulo-09.json).
