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
          <span>Legend</span>
          <span>→</span>
        </button>
      </div>
    );
  }
  return (
    <div className="options">
      <div className="collapsible-content">
        <div className="collapsible-header">
          <h3>Legend</h3>
          <span onClick={toggle}>←</span>
        </div>
        <div>
          <p className="p-title">FFilter by company</p>
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
            <p className="p-title">Colors of educational institutions</p>
            <ul>
              <li>
                <span className="color-box no-signal"></span>
                No signal
              </li>
              <li>
                <span className="color-box low-signal"></span>
                Low signal
              </li>
              <li>
                <span className="color-box medium-signal"></span>
                Medium signal
              </li>
              <li>
                <span className="color-box high-signal"></span>
                High signal
              </li>
            </ul>
          </div>
          <div className="color-legend">
            <p className="p-title">Antenna Signal</p>
            <ul>
              <li>
                <span className="color-box cell-tower-signal"></span>
                Signal coverage from an antenna
              </li>
            </ul>
          </div>
          <div className="color-legend">
            <p className="p-title">User Guide</p>
            <p>
              Navigate the map of Ayacucho, hover over the points of educational institutions or the icons of the
              companies.
            </p>
            <p>You can click on the company icons and see the unobstructed signal coverage of the antenna.</p>
            <p>Use the shift key to move the map and generate a more 3D view</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Opciones;
