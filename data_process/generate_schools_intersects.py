import json
import ast
import click
import pandas as pd
import geopandas as gpd
from shapely.geometry import box, shape
from shapely.ops import unary_union
import mercantile
from itertools import chain
from pathlib import Path
from tqdm import tqdm
from joblib import Parallel, delayed
from geojson import FeatureCollection as fc


def get_tile(x, zoom):
    tile = mercantile.tile(x.x, x.y, zoom)
    return f"{tile.x}_{tile.y}_{tile.z}"


def get_tile_near(x, zoom):
    tile = mercantile.tile(x.x, x.y, zoom)
    parent = mercantile.parent(tile)
    neighbors = mercantile.neighbors(parent)
    polygons = []
    for neighbor in neighbors:
        bbox = mercantile.bounds(neighbor)
        polygon = box(bbox.west, bbox.south, bbox.east, bbox.north)
        polygons.append(polygon)
    bbox = unary_union(polygons).bounds
    return box(*bbox)


def gdf_group(x, gdf_):
    df_filter = gdf_[gdf_.intersects(x.geometry)]
    if df_filter.empty:
        return ""
    return ",".join(df_filter["idx"].unique().tolist())


def process_group(feature, schools, antennas):
    antennas = antennas.reset_index(drop=True)
    schools = schools.reset_index(drop=True)

    ids_cobertura = str(feature.get("properties").get("ids_cobertura", "")).split(",")

    filter_schools = schools[schools["tile"] == feature.get("properties").get("tile")].copy()
    filter_schools["clean"] = "no"
    filter_schools_json = json.loads(filter_schools.to_json()).get("features")

    if not ids_cobertura:
        return filter_schools_json

    filter_antenas = antennas[antennas["idx"].isin(ids_cobertura)].copy()

    for feature in filter_schools_json:
        feature["properties"]["up_1mb"] = 0
        feature["properties"]["plus_1mb"] = 0
        gdf_concatenated_copy = filter_antenas.copy()
        df_intersects = gdf_concatenated_copy[gdf_concatenated_copy.geometry.intersects(shape(feature.get("geometry")))]
        if df_intersects.empty:
            continue
        metadata2d = [json.loads(i) for i in df_intersects["features_intersec"].to_list()]
        metadata = list(chain.from_iterable(metadata2d))

        up_1mb = len([i for i in metadata if i.get("up_1mb") in [1, "1", True]])
        plus_1mb = len([i for i in metadata if i.get("plus_1mb") in [1, "1", True]])
        feature["properties"]["up_1mb"] = up_1mb
        feature["properties"]["plus_1mb"] = plus_1mb
        feature["properties"]["clean"] = True

    return filter_schools_json


def read_viewhead(feature, file_geojson_path):
    try:
        gdf = gpd.read_file(f"{file_geojson_path}/{feature.get('properties').get('idx')}.geojson")
        gdf.crs = "EPSG:4326"
        gdf["features_intersec"] = feature.get("properties").get("features_intersec",[])
        gdf["idx"] = feature.get('properties').get('idx')
        return gdf.copy()
    except Exception as ex:
        return gpd.GeoDataFrame()


def run(schools_path, zoom_tile, antennas_path, schools_out_path, schools_out_bbox_path, file_geojson_path):
    df_schools = gpd.read_file(schools_path)
    df_schools.crs = "EPSG:4326"
    df_schools["tile"] = df_schools.geometry.apply(lambda x: get_tile(x, zoom_tile))

    df_schools_bbox = df_schools.drop_duplicates(subset=["tile"]).copy()
    df_schools_bbox["geometry"] = df_schools_bbox.geometry.apply(
        lambda x: get_tile_near(x, zoom_tile)
    )
    # df antennas
    df_anteas = gpd.read_file(antennas_path)
    df_anteas.crs = "EPSG:4326"

    df_anteas["exist"] = df_anteas["idx"].apply(lambda idx: Path(f"{file_geojson_path}/{idx}.geojson").exists())
    df_anteas = df_anteas[df_anteas["exist"]]

    # process antenas
    df_anteas_json = json.loads(df_anteas.to_json()).get("features")
    new_antenas_list = Parallel(n_jobs=-1)(
        delayed(read_viewhead)(feature, file_geojson_path)
        for feature in tqdm(df_anteas_json, desc=f"process antenas ")
    )
    new_antenas_list = [i for i in new_antenas_list if not i.empty]
    new_antenas = pd.concat(new_antenas_list, ignore_index=True)
    # df schools bbox
    df_schools_bbox["ids_cobertura"] = df_schools_bbox.apply(lambda x: gdf_group(x, df_anteas), axis=1)
    df_schools_bbox = df_schools_bbox.drop_duplicates(subset=["tile"]).copy()
    df_schools_bbox.to_file(schools_out_bbox_path, driver="GeoJSON")
    df_schools_bbox_json = json.loads(df_schools_bbox.to_json()).get("features")

    new_features_2d = Parallel(n_jobs=-1)(
        delayed(process_group)(feature, df_schools.copy(), new_antenas.copy())
        for feature in tqdm(df_schools_bbox_json, desc=f"process school group ")
    )
    new_features = list(chain.from_iterable(new_features_2d))
    json.dump(fc(new_features), open(schools_out_path, "w"))


@click.command(short_help="Process schools intersects ")
@click.option(
    "--schools_path",
    help="Schools path csv",
    required=True,
    type=str,
)
@click.option(
    "--zoom_tile",
    help="Zoom data",
    default=13,
    type=int,
)
@click.option(
    "--antennas_path",
    help="Antennas path",
    required=True,
    type=str,
)
@click.option(
    "--schools_out_path",
    help="Data schools output",
    required=True,
    type=str,
)
@click.option(
    "--schools_out_bbox_path",
    help="Data schools bbox output",
    required=True,
    type=str,
)
@click.option(
    "--file_geojson_path",
    help="File prefix ",
    required=True,
    type=str,
)
def main(schools_path, zoom_tile, antennas_path, schools_out_path, schools_out_bbox_path, file_geojson_path):
    run(schools_path, zoom_tile, antennas_path, schools_out_path, schools_out_bbox_path, file_geojson_path)


if __name__ == "__main__":
    main()
