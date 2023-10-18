import React from "react";

import { TEL_NAMES_ICO } from "../utils/constants";

const DetailPoint = ({ hoverInfo }) => {
  if (!hoverInfo) return null;
  const { id } = hoverInfo.layer;
  const { properties } = hoverInfo;
  let createTableRow = [];
  try {
    createTableRow = JSON.parse(properties.features_intersec || properties.ant_data).map((i, k) => (
      <tr key={k}>
        <td>
          <img src={`/${TEL_NAMES_ICO[i["emp"]]}`} width={20}></img>
        </td>
        <td className={i["up_1mb"] === "1" ? "check" : "cross"}>{i["up_1mb"] === "1" ? "✔" : "✖"}</td>
        <td className={i["plus_1mb"] === "1" ? "check" : "cross"}>{i["plus_1mb"] === "1" ? "✔" : "✖"}</td>
        <td className={i["2G"] === "1" ? "check" : "cross"}>{i["2G"] === "1" ? "✔" : "✖"}</td>
        <td className={i["3G"] === "1" ? "check" : "cross"}>{i["3G"] === "1" ? "✔" : "✖"}</td>
        <td className={i["4G"] === "1" ? "check" : "cross"}>{i["4G"] === "1" ? "✔" : "✖"}</td>
        <td className={i["5G"] === "1" ? "check" : "cross"}>{i["5G"] === "1" ? "✔" : "✖"}</td>
      </tr>
    ));
  } catch (error) {
    console.error(error);
  }
  const BuildRow = ({ k, v }) =>
    v ? (
      <tr className="fz10">
        <td>
          <b>{k}</b>
        </td>
        <td>{v}</td>
      </tr>
    ) : null;

  if (id === "schools-layer") {
    return (
      <div className="custom-popup">
        <div className="custom-popup-wrap">
          <table className="custom-popup-table">
            <thead>
              <tr>
                <th colSpan={2} className="center">
                  {properties.name || "--"}
                </th>
              </tr>
            </thead>
            <tbody className=" custom-popup-left">
              <BuildRow k="Province" v={properties.province} />
              <BuildRow k="District" v={properties.district} />
              <BuildRow k="Sub District" v={properties.subdistrict} />
              <BuildRow k="Full Address" v={properties.full} />
              <BuildRow k="Source" v={properties.source} />
            </tbody>
          </table>
          {createTableRow.lenght && (
            <table className="custom-popup-table mt10">
              <thead>
                <tr>
                  <th colSpan={7}>Data antennas</th>
                </tr>
                <tr className="fz10">
                  <th></th>
                  <th>Up 1mb</th>
                  <th>Plus 1mb</th>
                  <th>2G</th>
                  <th>3G</th>
                  <th>4G</th>
                  <th>5G</th>
                </tr>
              </thead>
              <tbody> {createTableRow}</tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="custom-popup">
      <div className="custom-popup-wrap">
        <table className="custom-popup-table">
          <thead>
            <tr>
              <th colSpan={7}>Data antennas</th>
            </tr>
            <tr className="fz10">
              <th></th>
              <th>Up 1mb</th>
              <th>Plus 1mb</th>
              <th>2G</th>
              <th>3G</th>
              <th>4G</th>
              <th>5G</th>
            </tr>
          </thead>
          <tbody> {createTableRow}</tbody>
        </table>
      </div>
    </div>
  );
};
export default DetailPoint;
