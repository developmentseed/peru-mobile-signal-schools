import click
import json
from tqdm import tqdm
from joblib import Parallel, delayed
from itertools import chain
import pandas as pd
import geopandas as gpd
from shapely.geometry import shape
import csv
import mercantile
import gzip
from copy import deepcopy


def process_cluster(key, features):
    features = list(features)
    id_used = set()
    new_features = []

    for i in features:
        geom = shape(i.get("geometry")).buffer(5)
        id = i.get("properties").get("idx")

        if id in id_used:
            continue
        features_intersec = []

        for j in features:
            id_j = j.get("properties").get("idx")
            if id_j == id or id_j in id_used:
                continue

            geom_j = shape(j.get("geometry")).buffer(5)

            if geom.intersects(geom_j):
                features_intersec.append(deepcopy(j.get("properties", {})))
                id_used.add(id_j)
        if features_intersec:
            i["properties"]["features_intersec"] = features_intersec

        new_features.append(i)
        id_used.add(id)

    return new_features


def get_tile(x):
    tile = mercantile.tile(x["LONGITUD"], x["LATITUD"], 13)
    return f"{tile.x}_{tile.y}_{tile.z}"


def run(csv_path, output_file, output_app_file):
    reader = csv.reader(open(csv_path, "r", encoding="ISO-8859-1"), delimiter=";")
    rows = list(reader)

    df = pd.DataFrame(rows[1:], columns=rows[0])
    df["LATITUD"] = pd.to_numeric(df["LATITUD"], errors="coerce")
    df["LONGITUD"] = pd.to_numeric(df["LONGITUD"], errors="coerce")

    gdf = gpd.GeoDataFrame(
        df, geometry=gpd.points_from_xy(df["LONGITUD"], df["LATITUD"])
    )
    gdf.crs = "EPSG:4326"
    print("initial", gdf.shape[0])
    # reduce columna
    gdf["emp"] = gdf["EMPRESA_OPERADORA"].apply(lambda x: str(x)[:2])
    gdf["tile"] = gdf.apply(get_tile, axis=1)
    gdf["up_1mb"] = gdf["HASTA_1_MBPS"]
    gdf["plus_1mb"] = gdf["MÁS_DE_1_MBPS"]
    gdf["idx"] = gdf["NUM"]

    gdf = gdf[
        ["idx", "emp", "tile", "2G", "3G", "4G", "5G", "up_1mb", "plus_1mb",
         "geometry"]]

    gdf = gdf[(gdf["up_1mb"] == "1") | (gdf["plus_1mb"] == "1")]
    print("filter", gdf.shape[0])

    gdf_mercator = gdf.to_crs(3857)

    geojson_output = json.loads(gdf_mercator.to_json()).get("features")
    group_tiles = {}
    for feature in tqdm(geojson_output, desc="cluster for tile"):
        props = feature.get("properties", {})
        fake_key = props.get("tile")
        if not group_tiles.get(fake_key):
            group_tiles[fake_key] = []
        group_tiles[fake_key].append(feature)

    new_features_2d = Parallel(n_jobs=-1)(
        delayed(process_cluster)(k, v)
        for k, v in tqdm(group_tiles.items(), desc=f"merge features  ")
    )
    new_features_app = list(chain.from_iterable(list(new_features_2d)))

    for i in new_features_app:
        new_element = dict(i.get("properties"))
        features_intersec = list(i.get("properties", {}).get("features_intersec", []))
        if new_element.get("features_intersec"):
            del new_element["features_intersec"]
        features_intersec.append(dict(new_element))
        # clean features_intersec

        new_props = {
            "features_intersec": features_intersec,
            "idx": new_element.get("idx"),
            "size": len(features_intersec),
            "ico": "other"
        }
        if len(features_intersec) == 1:
            new_props["ico"] = features_intersec[0]["emp"]

        i["properties"] = new_props

    new_gdf = gpd.GeoDataFrame.from_features(new_features_app)
    new_gdf.crs = "EPSG:3857"
    json.dump(
        {"type": "FeatureCollection", "features": json.loads(new_gdf.to_json()).get("features")}, open(output_file, "w")
    )
    new_gdf = new_gdf.to_crs(4326)
    geojson_output = json.loads(new_gdf.to_json())
    json.dump(geojson_output, open(output_app_file, "w"))

    # save gzip
    json_str = json.dumps(geojson_output)
    json_bytes = json_str.encode('utf-8')
    with gzip.GzipFile(output_app_file.replace(".geojson", ".geojson.gz"), 'w') as f_out:
        f_out.write(json_bytes)


@click.command(short_help="Process antennas csv")
@click.option(
    "--csv_path",
    help="Data csv",
    required=True,
    type=str,
)
@click.option(
    "--output_file",
    help="Data output",
    required=True,
    type=str,
)
@click.option(
    "--output_app_file",
    help="Data fot the app output",
    required=True,
    type=str,
)
def main(csv_path, output_file, output_app_file):
    run(csv_path, output_file, output_app_file)


if __name__ == "__main__":
    main()
