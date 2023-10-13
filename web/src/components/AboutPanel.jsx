const AboutPanel = ({ isActive, toggle }) => {
  if (!isActive) {
    return (
      <div className="about-component large-component">
        <button className="collapsible-button" onClick={toggle}>
          <span>Presentación</span>
          <span>→</span>
        </button>
      </div>
    );
  }
  return (
    <div className="large-component">
      <div className="collapsible-content">
        <div className="collapsible-header">
          <h3>
            Cobertura de señal móvil en instituciones educativas de Ayacucho: Una Herramienta de visualización
            interactiva
          </h3>
          <span onClick={toggle}>←</span>
        </div>
        <div>
          <p>
            La región de Ayacucho, conocida por su rica historia y cultura, enfrenta desafíos en cuanto a la cobertura
            de señal móvil en sus instituciones educativas. Con la irrupción de la pandemia y el auge de los entornos
            virtuales de aprendizaje, surge una cuestión crucial ¿tienen todos los estudiantes las mismas oportunidades
            de acceso a la educación?
          </p>
          <p>
            Para entender este problema, se combinó los datasets de cobertura de servicio móvil por empresa operadora
            obtenida de la{" "}
            <a
              target="_blank"
              href="https://www.datosabiertos.gob.pe/search/field_topic/expr%C3%A9sate-per%C3%BA-con-datos-1466?sort_by=changed"
              rel="noreferrer"
            >
              Plataforma Nacional de Datos Abiertos
            </a>{" "}
            , imágenes del{" "}
            <a
              target="_blank"
              href="https://geoservidorperu.minam.gob.pe/geoservidor/download_raster.aspx"
              rel="noreferrer"
            >
              Modelo de elevación digital global de Aster
            </a>{" "}
            del Ministerio del Ambiente y centros educativos obtenidos de la plataforma de{" "}
            <a target="_blank" href="https://www.openstreetmap.org/" rel="noreferrer">
              OpenStreetMap
            </a>{" "}
            que mi{" "}
            <a target="_blank" href="https://www.openstreetmap.org/user/DannyAiquipa/diary/44109" rel="noreferrer">
              equipo importó
            </a>{" "}
            en noviembre del 2017. A partir de estos recursos, se desarrolló una
            <a target="_blank" href="https://ayacucho-schools.surge.sh/" rel="noreferrer">
              herramienta de visualización
            </a>{" "}
            en 3D, que muestra tanto la ubicación de las instituciones educativas como de las antenas de telefonía móvil
            de los distintos proveedores de servicios. .{" "}
          </p>
          <p>
            Esta herramienta nos permite explorar e identificar las zonas, en particular las instituciones educativas,
            donde la cobertura de señal varía desde <b> "sin señal"</b> hasta <b>"señal alta"</b>. Además, podemos
            observar la intensidad y la cobertura de la señal móvil que llega a estas instituciones. La herramienta
            ofrece 3 funciones clave: una presentación general, una leyenda que nos permite filtrar las antenas por
            compañía, y un panel de control con estadísticas sobre la calidad del servicio en instituciones educativas y
            un ranking de provincias sin servicio.
          </p>
          <p>
            Los resultados son reveladores. Aún existen áreas donde la calidad de los servicios móviles es insuficiente o
            nula. Además, se ha identificado antenas que, a pesar de estar ubicadas cerca de las poblaciones, presentan
            interrupciones en su señal debido a su ubicación, lo que impide que llegue a las instituciones educativas y
            centros poblados. Estos hallazgoa nos plantean interrogantes importantes:
            <ul>
              <li>¿Qué medidas podemos tomar para mejorar el acceso a la educación en estas áreas?</li>
              <li>¿Qué oportunidades se les está negando a los estudiantes sin acceso a internet?</li>
              <li>
                ¿Qué acciones pueden emprender tanto el gobierno como el sector privado para abordar esta necesidad?
              </li>
            </ul>
          </p>

          <p>
            Es importante destacar que, aunque nuestro análisis se basa en medidas estándar y es robusto, no está exento
            de un margen de error. Para obtener una visión más precisa y completa, es esencial contar con otros
            datasets, como datos técnicos de las antenas, disponibilidad, datos metereológicos, etc., que complementen y
            enriquezcan la información actual.
          </p>
          <p>
            Comprendemos que la educación es un pilar fundamental del desarrollo social, y herramientas como ésta nos
            permiten explorar y reflexionar sobre las oportunidades y desafíos que enfrentan los estudiantes en áreas
            con limitada cobertura móvil.
          </p>
        </div>
      </div>
    </div>
  );
};
export default AboutPanel;
