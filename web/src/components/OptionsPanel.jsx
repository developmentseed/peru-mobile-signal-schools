import { useState } from "react";

import { TEL_NAMES } from "../utils/constants";

const Opciones = ({ isActive, toggle, handleFilter }) => {
  const [selectedCompanies, setSelectedCompanies] = useState(["Vi", "Te", "Am", "En"]);
  const handleCheckboxChange = (e) => {
    const value = e.target.value;

    let newCompanies;
    if (e.target.checked) {
      newCompanies = [...selectedCompanies, value];
    } else {
      newCompanies = selectedCompanies.filter((company) => company !== value);
    }
    setSelectedCompanies(newCompanies);

    handleFilter(newCompanies);
  };

  if (!isActive) {
    return (
      <div className="options">
        <button className="collapsible-button" onClick={toggle}>
          <span>Leyenda</span>
          <span>→</span>
        </button>
      </div>
    );
  }
  return (
    <div className="options">
      <div className="collapsible-content">
        <div className="collapsible-header">
          <h3>Leyenda</h3>
          <span onClick={toggle}>←</span>
        </div>
        <div>
          <p className="p-title">Filtro por compañía</p>
          <ul className="filter-list">
            {Object.keys(TEL_NAMES).map((key) => (
              <li key={key} className="filter-item">
                <label>
                  <input
                    type="checkbox"
                    value={key}
                    checked={selectedCompanies.includes(key)}
                    onChange={handleCheckboxChange}
                  />
                  {TEL_NAMES[key]}
                </label>
              </li>
            ))}
          </ul>
          <div className="color-legend">
            <p className="p-title">Colores de las instituciones educativas</p>
            <ul>
              <li>
                <span className="color-box no-signal "></span>
                Sin señal
              </li>
              <li>
                <span className="color-box low-signal"></span>
                Señal baja
              </li>
              <li>
                <span className="color-box medium-signal"></span>
                Señal media
              </li>
              <li>
                <span className="color-box high-signal"></span>
                Señal alta
              </li>
            </ul>
          </div>
          <div className="color-legend">
            <p className="p-title">Señal de las antenas</p>
            <ul>
              <li>
                <span className="color-box cell-tower-signal"></span>
                Cobertura de señal de una antena
              </li>
            </ul>
          </div>
          <div className="color-legend">
            <p className="p-title">Guía de usuario</p>
            <p>
              Navega por el mapa de Ayacucho, pasa el cursor sobre los puntos de las instituciones educativas o los
              íconos de las compañías.
            </p>
            <p>
              Puedes hacer clic en los íconos de las compañías y ver la cobertura de señal no obstruída de la antena.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Opciones;
