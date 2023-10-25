const AboutPanel = ({ isActive, toggle }) => {
  if (!isActive) {
    return (
      <div className="about-component large-component">
        <button className="collapsible-button" onClick={toggle}>
          <span>About</span>
          <span>→</span>
        </button>
      </div>
    );
  }
  return (
    <div className="large-component">
      <div className="collapsible-content">
        <div className="collapsible-header">
          <h3>Mobile signal coverage in educational institutions of Perú: An Interactive Visualization Tool</h3>
          <span onClick={toggle}>←</span>
        </div>
        <div>
          <p>
            The country of Perú, known for its geographical diversity and rich culture, faces challenges regarding
            mobile signal coverage in its educational institutions throughout its vast territory. With the onset of the
            pandemic and the rise of virtual education, a fundamental question arises: Do all Peruvian students have
            equal opportunities to access education?
          </p>
          <p>
            To address this challenge, datasets were combined that detail
            <a
              target="_blank"
              href="https://www.datosabiertos.gob.pe/search/field_topic/expr%C3%A9sate-per%C3%BA-con-datos-1466?sort_by=changed"
              rel="noreferrer"
            >
              mobile service coverage by carrier
            </a>
            , available on the National Open Data Platform, images from{" "}
            <a
              target="_blank"
              href="https://geoservidorperu.minam.gob.pe/geoservidor/download_raster.aspx"
              rel="noreferrer"
            >
              {" "}
              the Aster Global Digital Elevation Model from the Ministry of the Environment
            </a>
            , and locations of educational centers extracted from{" "}
            <a target="_blank" href="https://www.openstreetmap.org/" rel="noreferrer">
              OpenStreetMap{" "}
            </a>
            , which our team{" "}
            <a target="_blank" href="https://www.openstreetmap.org/user/DannyAiquipa/diary/44109" rel="noreferrer">
              {" "}
              imported in November 2017{" "}
            </a>
            . Using this data, a 3D visualization tool was designed, illustrating both the positions of educational
            institutions and mobile phone antennas from various providers nationwide.
          </p>
          <p>
            This tool makes it easier to explore and identify areas, especially educational institutions, where signal
            coverage ranges from <b>"no signal" </b>to <b>"high signal"</b>. We can analyze the intensity and range of
            the mobile signal in these institutions. The tool incorporates three main features: an overview, a legend
            that allows us to filter the antennas by carrier, and a control panel with statistics related to the quality
            of service in educational institutions and a ranking of regions without service.
          </p>
          <p>
            The analysis reveals that throughout Perú, there are areas where mobile service quality is poor or even
            non-existent. Antennas were identified that, although located near communities, experience signal
            interruptions due to their location, restricting the signal's reach to educational institutions and towns.
            These findings lead us to consider critical questions:
            <ul>
              <li>What strategies can be implemented to enhance access to education in these regions?</li>
              <li>What opportunities are being denied to students without internet access?</li>
              <li>What initiatives can both the government and the private sector undertake to address this demand?</li>
            </ul>
          </p>

          <p>
            It's crucial to note that, although our study is based on standard criteria and is consistent, it is not
            free from certain margins of error. To obtain a more accurate and comprehensive view, it is essential to
            incorporate other datasets, such as technical details of antennas, availability, meteorological data, and
            others, that add value and detail to the current analysis.
          </p>
          <p>
            We understand that education is the cornerstone of social progress, and tools like the one we have developed
            provide a clear perspective on the challenges and opportunities facing students in areas with limited mobile
            coverage throughout Perú.
          </p>
        </div>
      </div>
    </div>
  );
};
export default AboutPanel;
